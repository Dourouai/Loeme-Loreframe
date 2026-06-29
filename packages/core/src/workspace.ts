import { dirname, extname, join } from "node:path";
import { createHash } from "node:crypto";
import type { StoryProject, StoryScene } from "./schema.js";

export type SceneAssetKind = "image" | "voice" | "captions" | "music";

export interface PublishPack {
  title: string;
  description: string;
  tags: string[];
  ai_disclosure_required: "yes" | "no" | "review";
  source_note: string;
}

export interface ManifestAsset {
  sceneId?: string;
  kind: SceneAssetKind | "thumbnail" | "script" | "story" | "publish";
  path: string;
  sha256?: string;
}

export interface StoryManifest {
  schema_version: 1;
  generated_at: string;
  project: {
    id: string;
    title: string;
    type: string;
    aspect_ratio: string;
    duration_sec: number;
    language: string;
  };
  scene_count: number;
  assets: ManifestAsset[];
  review: {
    ai_disclosure_required: "yes" | "no" | "review";
    warnings: string[];
  };
}

export interface SplitScriptOptions {
  maxScenes?: number;
  defaultSceneDurationSec?: number;
}

const defaultSceneDurationSec = 18;

export function projectDirFromStoryPath(storyPath: string): string {
  return dirname(storyPath);
}

export function defaultScriptPath(storyPath: string): string {
  return join(projectDirFromStoryPath(storyPath), "script.md");
}

export function createScenesFromScript(script: string, options: SplitScriptOptions = {}): StoryScene[] {
  const chunks = scriptToNarrationChunks(script);
  const maxScenes = options.maxScenes ?? 30;
  return chunks.slice(0, maxScenes).map((narration, index) => {
    const sceneNumber = index + 1;
    return {
      id: `scene-${String(sceneNumber).padStart(3, "0")}`,
      title: titleFromNarration(narration, sceneNumber),
      status: "draft",
      narration,
      duration_sec: estimateSceneDurationSec(narration, options.defaultSceneDurationSec ?? defaultSceneDurationSec),
      motion: {
        type: "slow_push_in",
        transition: index === 0 ? "fade_in" : "crossfade"
      },
      review: {
        locked_text: false,
        risk_flags: []
      }
    };
  });
}

export function replaceProjectScenes(project: StoryProject, scenes: StoryScene[]): StoryProject {
  return {
    ...project,
    scenes
  };
}

export function updateSceneAsset(
  project: StoryProject,
  sceneId: string,
  kind: SceneAssetKind,
  relativePath: string
): StoryProject {
  const scenes = project.scenes ?? [];
  let found = false;
  const nextScenes = scenes.map((scene) => {
    if (scene.id !== sceneId) return scene;
    found = true;
    const assets = { ...(scene.assets ?? {}), [kind]: relativePath };
    const status = statusForAsset(kind, scene.status);
    return {
      ...scene,
      status,
      image_path: kind === "image" ? relativePath : scene.image_path,
      assets
    };
  });

  if (!found) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  return {
    ...project,
    scenes: nextScenes
  };
}

export function createPublishPack(project: StoryProject): PublishPack {
  const sourceNote = sourceNoteForProject(project);
  const tags = unique([
    project.type,
    project.style.visual_preset,
    "narrated story",
    "folk story",
    project.language
  ]);

  return {
    title: project.title,
    description: [
      sourceNote,
      "",
      "This video package was prepared with Loeme Loreframe.",
      "Review all AI-generated images, narration, music, and subtitles before publishing."
    ].join("\n"),
    tags,
    ai_disclosure_required: project.publish?.ai_disclosure_required ?? "review",
    source_note: sourceNote
  };
}

export function createStoryManifest(project: StoryProject, options: { generatedAt?: Date } = {}): StoryManifest {
  const warnings: string[] = [];
  if (/真实/.test(project.title)) {
    warnings.push("title contains '真实'; review wording and AI disclosure before publishing");
  }

  const assets: ManifestAsset[] = [
    { kind: "story", path: "story.yaml" },
    { kind: "script", path: "script.md" },
    { kind: "publish", path: "publish.json" }
  ];

  for (const scene of project.scenes ?? []) {
    if (scene.assets?.image) assets.push({ sceneId: scene.id, kind: "image", path: scene.assets.image });
    if (scene.assets?.voice) assets.push({ sceneId: scene.id, kind: "voice", path: scene.assets.voice });
    if (scene.assets?.captions) assets.push({ sceneId: scene.id, kind: "captions", path: scene.assets.captions });
    if (scene.assets?.music) assets.push({ sceneId: scene.id, kind: "music", path: scene.assets.music });
    if (scene.image_path && !scene.assets?.image) {
      assets.push({ sceneId: scene.id, kind: "image", path: scene.image_path });
    }
  }

  return {
    schema_version: 1,
    generated_at: (options.generatedAt ?? new Date()).toISOString(),
    project: {
      id: project.id,
      title: project.title,
      type: project.type,
      aspect_ratio: project.aspect_ratio,
      duration_sec: project.duration_sec,
      language: project.language
    },
    scene_count: project.scenes?.length ?? 0,
    assets,
    review: {
      ai_disclosure_required: project.publish?.ai_disclosure_required ?? "review",
      warnings
    }
  };
}

export function sceneAssetRelativePath(kind: SceneAssetKind, sceneId: string, sourcePath: string): string {
  const ext = extname(sourcePath) || fallbackExt(kind);
  return join("assets", assetFolder(kind), `${sceneId}${ext}`);
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function defaultScenesJsonPath(storyPath: string): string {
  return join(projectDirFromStoryPath(storyPath), "scenes.json");
}

export function defaultPublishPath(storyPath: string): string {
  return join(projectDirFromStoryPath(storyPath), "publish.json");
}

export function defaultManifestPath(storyPath: string): string {
  return join(projectDirFromStoryPath(storyPath), "manifest.json");
}

export function defaultPackageListPath(storyPath: string): string {
  return join(projectDirFromStoryPath(storyPath), "outputs", "package-files.txt");
}

function scriptToNarrationChunks(script: string): string[] {
  const withoutYamlFence = script.replace(/```[\s\S]*?```/g, "\n");
  return withoutYamlFence
    .split(/\n\s*\n/g)
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && !line.startsWith(">"))
        .map((line) => line.replace(/^[-*]\s+/, ""))
        .join(" ")
        .trim()
    )
    .filter(Boolean);
}

function estimateSceneDurationSec(narration: string, fallback: number): number {
  const cjkChars = [...narration].filter((char) => /[\u3400-\u9fff]/.test(char)).length;
  const latinWords = narration.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word)).length;
  const estimated = Math.ceil(cjkChars / 4.5 + latinWords / 2.4);
  return Math.max(8, fallback, estimated);
}

function titleFromNarration(narration: string, sceneNumber: number): string {
  const plain = narration.replace(/[，。！？、,.!?]/g, " ").trim();
  const title = [...plain].slice(0, 12).join("").trim();
  return title || `Scene ${sceneNumber}`;
}

function statusForAsset(kind: SceneAssetKind, current: StoryScene["status"]): StoryScene["status"] {
  if (current === "approved" || current === "rendered" || current === "locked_text") return current;
  if (kind === "image") return "image_ready";
  if (kind === "voice") return "audio_ready";
  if (kind === "captions") return "caption_ready";
  return current ?? "draft";
}

function sourceNoteForProject(project: StoryProject): string {
  if (project.source.attribution) return project.source.attribution;
  if (project.source.kind === "public_domain_text") return "Public-domain source adaptation.";
  if (project.source.kind === "licensed_source") return "Licensed source adaptation. Verify license before publishing.";
  if (project.source.kind === "manual_script") return "Manual script prepared for narration.";
  return "Original outline or folk-story adaptation. Review factual wording before publishing.";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function fallbackExt(kind: SceneAssetKind): string {
  if (kind === "image") return ".png";
  if (kind === "voice" || kind === "music") return ".wav";
  return ".srt";
}

function assetFolder(kind: SceneAssetKind): string {
  if (kind === "image") return "images";
  if (kind === "voice") return "voice";
  if (kind === "captions") return "captions";
  return "music";
}
