import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import YAML from "yaml";
import {
  defaultScenesJsonPath,
  parseStoryYaml,
  type StoryProject,
  type StoryScene,
  stringifyStoryProject,
  validateStoryProject
} from "@story-video/core";

interface AdoptOptions {
  userCwd: string;
}

interface RawTaipingScene {
  id: string;
  caption?: string;
  text?: string;
  durationSec?: number;
  estimate_sec?: number;
  image?: string;
  imagePrompt?: string;
  image_prompt?: string;
  wavPath?: string;
  mp3Path?: string;
  narration_focus?: string;
}

interface ShortStoryboardScene {
  id: string;
  visual_prompt?: string;
  on_screen_text?: string;
  narration?: string;
  duration_sec?: number;
  pause_after_sec?: number;
  source_image?: string;
  image_prompt?: string;
}

interface ShortStoryboard {
  template?: string;
  sync_contract?: string;
  style?: string;
  topic?: string;
  protagonist?: string;
  scenes?: ShortStoryboardScene[];
}

export async function adoptCommand(args: string[], options: AdoptOptions): Promise<void> {
  const kind = args[0];
  if (kind === "taiping") {
    await adoptTaiping(args.slice(1), options);
    return;
  }
  if (kind === "short-story") {
    await adoptShortStory(args.slice(1), options);
    return;
  }

  throw new Error(
    [
      "Usage:",
      "  story-video adopt taiping <legacy-workspace-dir> [--out <dir>] [--force]",
      "  story-video adopt short-story <story-script.json | html-video-project-dir> [--out <dir>] [--force]"
    ].join("\n")
  );
}

async function adoptTaiping(args: string[], options: AdoptOptions): Promise<void> {
  const workspaceArg = args[0];
  if (!workspaceArg) {
    throw new Error("Usage: story-video adopt taiping <legacy-workspace-dir> [--out <dir>] [--force]");
  }

  const workspaceDir = resolveFrom(options.userCwd, workspaceArg);
  const legacyPath = join(workspaceDir, "story.yaml");
  if (!existsSync(legacyPath)) {
    throw new Error(`Legacy Taiping story.yaml not found: ${legacyPath}`);
  }

  const outDir = resolveFrom(options.userCwd, readFlag(args, "--out") ?? basename(workspaceDir));
  await ensureWritableOutput(outDir, args.includes("--force"));

  const legacy = asRecord(YAML.parse(await readFile(legacyPath, "utf8")));
  const rawScenes = await readTaipingScenes(workspaceDir, legacy);
  if (rawScenes.length === 0) {
    throw new Error(`No Taiping scenes found in ${workspaceDir}`);
  }

  await mkdir(join(outDir, "assets", "images"), { recursive: true });
  await mkdir(join(outDir, "assets", "voice"), { recursive: true });

  const scenes: StoryScene[] = [];
  for (const raw of rawScenes) {
    const imageSource = firstExisting([
      stringValue(raw.image),
      join(workspaceDir, "assets", `${raw.id}.png`),
      join(workspaceDir, "assets", `${raw.id}.jpg`),
      join(workspaceDir, "assets", `${raw.id}.jpeg`)
    ]);
    const voiceSource = firstExisting([
      stringValue(raw.wavPath),
      stringValue(raw.mp3Path),
      join(workspaceDir, "audio", "scene", `${raw.id}.wav`),
      join(workspaceDir, "audio", "scene", `${raw.id}.mp3`)
    ]);

    const imageRel = imageSource ? await copyAsset(imageSource, outDir, "images", raw.id) : undefined;
    const voiceRel = voiceSource ? await copyAsset(voiceSource, outDir, "voice", raw.id) : undefined;

    scenes.push({
      id: raw.id,
      title: raw.caption,
      status: voiceRel ? "audio_ready" : imageRel ? "image_ready" : "draft",
      narration: raw.text || raw.narration_focus || raw.caption || raw.id,
      image_prompt: raw.imagePrompt || raw.image_prompt,
      image_path: imageRel,
      assets: compactAssets({
        image: imageRel,
        voice: voiceRel
      }),
      motion: {
        type: "slow_push_in",
        transition: "crossfade"
      },
      review: {
        locked_text: Boolean(raw.text),
        risk_flags: []
      },
      duration_sec: positiveNumber(raw.durationSec) ?? positiveNumber(raw.estimate_sec) ?? estimateNarrationDuration(raw.text)
    });
  }

  const project: StoryProject = {
    id: stringValue(legacy.id) || slugFromTitle(stringValue(legacy.title) || basename(workspaceDir)),
    title: stringValue(legacy.title) || stringValue(legacy.name) || basename(workspaceDir),
    type: "taiping_guangji_longform",
    duration_sec: positiveNumber(getPath(legacy, ["production", "target_duration_sec"])) ?? sumSceneDurations(scenes),
    aspect_ratio: normalizeAspect(stringValue(legacy.aspect_ratio) || stringValue(legacy.aspect) || "16:9"),
    language: stringValue(legacy.language) || "zh-CN",
    source: {
      kind: "public_domain_text",
      text: [
        stringValue(legacy.hook),
        Array.isArray(legacy.story_structure) ? legacy.story_structure.join("\n") : ""
      ].filter(Boolean).join("\n\n") || "太平广记白话改编。",
      url: stringValue(getPath(legacy, ["source", "reference_url"])),
      attribution: taipingAttribution(legacy)
    },
    style: {
      visual_preset: stringValue(getPath(legacy, ["production", "template_id"])) || stringValue(getPath(legacy, ["template", "id"])) || "frame-taiping-immortal-scroll",
      voice_preset: `tencent-${stringValue(getPath(legacy, ["production", "voice", "voice_type"])) || "501002"}`,
      music_preset: stringValue(getPath(legacy, ["production", "music", "preset"])) || "temple_ambient_low"
    },
    publish: {
      channel: "chinese-folk-ghost-stories",
      audience: "classical-zhiguai",
      ai_disclosure_required: "review"
    },
    scenes
  };

  await writeLoemeProject(outDir, project);
  await writeFile(join(outDir, "script.md"), taipingScriptMarkdown(project), "utf8");
  await writeAdoptionReport(outDir, {
    kind: "taiping",
    source: workspaceDir,
    scenes,
    notes: [
      "Converted from existing Taiping Guangji workspace.",
      "Existing scene images and per-scene voice files were copied when present.",
      "TTS and image generation are not rerun by adopt."
    ]
  });
  console.log(`adopted taiping workspace -> ${outDir}`);
  printReadiness(scenes);
}

async function adoptShortStory(args: string[], options: AdoptOptions): Promise<void> {
  const inputArg = args[0];
  if (!inputArg) {
    throw new Error("Usage: story-video adopt short-story <story-script.json | html-video-project-dir> [--out <dir>] [--force]");
  }

  const inputPath = resolveFrom(options.userCwd, inputArg);
  const storyboardPath = await resolveStoryboardPath(inputPath);
  const htmlVideoProjectDir = basename(dirname(storyboardPath)) === "story" ? dirname(dirname(storyboardPath)) : dirname(storyboardPath);
  const legacyProjectPath = join(htmlVideoProjectDir, "project.json");
  const legacyProject = existsSync(legacyProjectPath)
    ? asRecord(JSON.parse(await readFile(legacyProjectPath, "utf8")))
    : {};
  const storyboard = asShortStoryboard(JSON.parse(await readFile(storyboardPath, "utf8")));
  const storyboardScenes = storyboard.scenes ?? [];
  if (storyboardScenes.length === 0) {
    throw new Error(`No scenes found in ${storyboardPath}`);
  }

  const defaultOutName = slugFromTitle(storyboard.topic || stringValue(legacyProject.name) || basename(htmlVideoProjectDir));
  const outDir = resolveFrom(options.userCwd, readFlag(args, "--out") ?? defaultOutName);
  await ensureWritableOutput(outDir, args.includes("--force"));
  await mkdir(join(outDir, "assets", "images"), { recursive: true });
  await mkdir(join(outDir, "assets", "voice"), { recursive: true });

  const scenes: StoryScene[] = [];
  for (const scene of storyboardScenes) {
    const imageSource = firstExisting([
      scene.source_image ? resolveLegacyAsset(htmlVideoProjectDir, scene.source_image) : undefined,
      resolveLegacyAsset(htmlVideoProjectDir, stringValue(getPath(legacyProject, ["variables", `${scene.id}:image`]))),
      join(htmlVideoProjectDir, "assets", `${scene.id}.png`),
      join(htmlVideoProjectDir, "assets", `${scene.id}.jpg`),
      join(htmlVideoProjectDir, "assets", `${scene.id}.jpeg`),
      join(htmlVideoProjectDir, "assets", `${scene.id}.svg`)
    ]);
    const voiceSource = firstExisting([
      join(htmlVideoProjectDir, "assets", "tts-segments", `${scene.id}.mp3`),
      join(htmlVideoProjectDir, "assets", "tts-segments", `${scene.id}.wav`),
      join(htmlVideoProjectDir, "audio", "scene", `${scene.id}.mp3`),
      join(htmlVideoProjectDir, "audio", "scene", `${scene.id}.wav`)
    ]);
    const imageRel = imageSource ? await copyAsset(imageSource, outDir, "images", scene.id) : undefined;
    const voiceRel = voiceSource ? await copyAsset(voiceSource, outDir, "voice", scene.id) : undefined;

    scenes.push({
      id: scene.id,
      title: titleFromText(scene.on_screen_text || scene.narration || scene.id),
      status: voiceRel ? "audio_ready" : imageRel ? "image_ready" : "draft",
      narration: scene.narration || scene.on_screen_text || scene.id,
      image_prompt: scene.visual_prompt || scene.image_prompt,
      image_path: imageRel,
      assets: compactAssets({
        image: imageRel,
        voice: voiceRel
      }),
      motion: {
        type: "slow_push_in",
        transition: "crossfade"
      },
      review: {
        locked_text: true,
        risk_flags: []
      },
      duration_sec: positiveNumber(scene.duration_sec) ?? estimateNarrationDuration(scene.narration || scene.on_screen_text)
    });
  }

  const project: StoryProject = {
    id: slugFromTitle(storyboard.topic || stringValue(legacyProject.name) || basename(htmlVideoProjectDir)),
    title: storyboard.topic || stringValue(legacyProject.name) || basename(htmlVideoProjectDir),
    type: "short_story_vertical",
    duration_sec: positiveNumber(getPath(legacyProject, ["preferences", "durationTargetSec"])) ?? sumSceneDurations(scenes),
    aspect_ratio: "9:16",
    language: "zh-CN",
    source: {
      kind: "manual_script",
      text: scenes.map((scene) => scene.narration).join("\n")
    },
    style: {
      visual_preset: storyboard.template || stringValue(legacyProject.templateId) || "frame-quote-carousel",
      voice_preset: stringValue(getPath(legacyProject, ["soundtrack", "narrationVoiceId"])) || "tencent-603006",
      music_preset: stringValue(getPath(legacyProject, ["soundtrack", "musicPrompt"])) || "local_bgm"
    },
    publish: {
      channel: "short-story",
      audience: "vertical-short-video",
      ai_disclosure_required: "review"
    },
    scenes
  };

  await writeLoemeProject(outDir, project);
  await writeFile(join(outDir, "script.md"), shortStoryScriptMarkdown(project, storyboard), "utf8");
  await writeAdoptionReport(outDir, {
    kind: "short-story",
    source: storyboardPath,
    scenes,
    notes: [
      "Converted from existing html-video story-script JSON.",
      "Scene images and tts-segments were copied when present.",
      "SVG scene images are preserved; FFmpeg support depends on local build. PNG assets are safest."
    ]
  });
  console.log(`adopted short story -> ${outDir}`);
  printReadiness(scenes);
}

async function readTaipingScenes(workspaceDir: string, legacy: Record<string, unknown>): Promise<RawTaipingScene[]> {
  const scenesJsonPath = join(workspaceDir, "scenes.json");
  if (existsSync(scenesJsonPath)) {
    const scenes = JSON.parse(await readFile(scenesJsonPath, "utf8"));
    if (Array.isArray(scenes)) {
      return scenes.map((scene) => {
        const record = asRecord(scene);
        return {
          id: stringValue(record.id),
          caption: stringValue(record.caption) || undefined,
          text: stringValue(record.text) || undefined,
          durationSec: positiveNumber(record.durationSec),
          image: stringValue(record.image) || undefined,
          imagePrompt: stringValue(record.imagePrompt) || undefined,
          wavPath: stringValue(record.wavPath) || undefined,
          mp3Path: stringValue(record.mp3Path) || undefined
        };
      }).filter((scene) => scene.id);
    }
  }

  const scriptSections = await readTaipingScriptSections(workspaceDir, legacy);
  const legacyScenes = Array.isArray(legacy.scenes) ? legacy.scenes : [];
  return legacyScenes.map((scene) => {
    const record = asRecord(scene);
    const id = stringValue(record.id);
    const section = scriptSections.get(id);
    return {
      id,
      caption: stringValue(record.caption) || section?.caption,
      text: section?.text,
      estimate_sec: positiveNumber(record.estimate_sec),
      image_prompt: stringValue(record.image_prompt),
      narration_focus: stringValue(record.narration_focus)
    };
  }).filter((scene) => scene.id);
}

async function readTaipingScriptSections(workspaceDir: string, legacy: Record<string, unknown>): Promise<Map<string, { caption: string; text: string }>> {
  const candidates = [
    join(workspaceDir, "script.md"),
    resolveLegacyAsset(workspaceDir, stringValue(getPath(legacy, ["source", "script_markdown"])))
  ].filter((item): item is string => Boolean(item));
  const scriptPath = candidates.find((candidate) => existsSync(candidate));
  if (!scriptPath) return new Map();

  const markdown = await readFile(scriptPath, "utf8");
  const sections = new Map<string, { caption: string; text: string }>();
  const matches = [...markdown.matchAll(/^##\s+(scene-\d+)\s+(.+)\n/gm)];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    if (match.index === undefined) continue;
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? markdown.length : markdown.length;
    sections.set(match[1], {
      caption: match[2].trim(),
      text: cleanNarration(markdown.slice(start, end))
    });
  }
  return sections;
}

async function resolveStoryboardPath(inputPath: string): Promise<string> {
  if (!existsSync(inputPath)) throw new Error(`Input not found: ${inputPath}`);
  if (inputPath.endsWith(".json")) return inputPath;

  const storyDir = join(inputPath, "story");
  if (!existsSync(storyDir)) {
    throw new Error(`No story directory found in ${inputPath}`);
  }
  const files = (await readdir(storyDir))
    .filter((name) => /^story-script-.+\.json$/.test(name))
    .sort();
  const latest = files.at(-1);
  if (!latest) {
    throw new Error(`No story-script-*.json found in ${storyDir}`);
  }
  return join(storyDir, latest);
}

async function writeLoemeProject(outDir: string, project: StoryProject): Promise<void> {
  const validation = validateStoryProject(project);
  if (!validation.ok) {
    throw new Error(`Converted project is invalid:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  }
  await mkdir(outDir, { recursive: true });
  const storyPath = join(outDir, "story.yaml");
  await writeFile(storyPath, stringifyStoryProject(project), "utf8");
  await writeFile(defaultScenesJsonPath(storyPath), `${JSON.stringify(project.scenes ?? [], null, 2)}\n`, "utf8");
  parseStoryYaml(await readFile(storyPath, "utf8"));
}

async function writeAdoptionReport(
  outDir: string,
  input: { kind: string; source: string; scenes: StoryScene[]; notes: string[] }
): Promise<void> {
  const missingImages = input.scenes.filter((scene) => !scene.assets?.image).map((scene) => scene.id);
  const missingVoice = input.scenes.filter((scene) => !scene.assets?.voice).map((scene) => scene.id);
  const lines = [
    "# Adoption Report",
    "",
    `kind: ${input.kind}`,
    `source: ${input.source}`,
    `scenes: ${input.scenes.length}`,
    `missing_images: ${missingImages.length ? missingImages.join(", ") : "none"}`,
    `missing_voice: ${missingVoice.length ? missingVoice.join(", ") : "none"}`,
    "",
    "## Notes",
    "",
    ...input.notes.map((note) => `- ${note}`),
    ""
  ];
  await writeFile(join(outDir, "adoption-report.md"), lines.join("\n"), "utf8");
}

async function ensureWritableOutput(outDir: string, force: boolean): Promise<void> {
  const storyPath = join(outDir, "story.yaml");
  if (existsSync(storyPath) && !force) {
    throw new Error(`Output already contains story.yaml: ${storyPath}. Use --force to overwrite Loeme files.`);
  }
  await mkdir(outDir, { recursive: true });
}

async function copyAsset(sourcePath: string, outDir: string, folder: "images" | "voice", id: string): Promise<string> {
  const absolute = resolve(sourcePath);
  const ext = extname(absolute) || (folder === "images" ? ".png" : ".wav");
  const relPath = join("assets", folder, `${id}${ext}`);
  const dest = join(outDir, relPath);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(absolute, dest);
  return relPath;
}

function taipingScriptMarkdown(project: StoryProject): string {
  return [
    `# ${project.title}`,
    "",
    ...(project.scenes ?? []).flatMap((scene) => [
      `## ${scene.id} ${scene.title ?? ""}`.trim(),
      "",
      scene.narration,
      ""
    ])
  ].join("\n");
}

function shortStoryScriptMarkdown(project: StoryProject, storyboard: ShortStoryboard): string {
  return [
    `# ${project.title}`,
    "",
    storyboard.style ? `> ${storyboard.style}` : "",
    storyboard.sync_contract ? `> ${storyboard.sync_contract}` : "",
    "",
    ...(project.scenes ?? []).flatMap((scene, index) => [
      `## ${index + 1}. ${scene.title ?? scene.id}`,
      "",
      scene.narration,
      ""
    ])
  ].filter(Boolean).join("\n");
}

function printReadiness(scenes: StoryScene[]): void {
  const missingImages = scenes.filter((scene) => !scene.assets?.image).length;
  const missingVoice = scenes.filter((scene) => !scene.assets?.voice).length;
  console.log(`scenes: ${scenes.length}`);
  console.log(`missing images: ${missingImages}`);
  console.log(`missing voice: ${missingVoice}`);
}

function taipingAttribution(legacy: Record<string, unknown>): string {
  const source = asRecord(legacy.source);
  return [
    stringValue(source.work) || "太平广记",
    stringValue(source.chapter),
    Array.isArray(source.entries) ? source.entries.join(" / ") : "",
    stringValue(source.cited_from) ? `cited from ${stringValue(source.cited_from)}` : ""
  ].filter(Boolean).join(" · ");
}

function normalizeAspect(value: string): "16:9" | "9:16" | "1:1" {
  if (value === "9:16") return "9:16";
  if (value === "1:1") return "1:1";
  return "16:9";
}

function compactAssets(input: { image?: string; voice?: string }): { image?: string; voice?: string } | undefined {
  const output: { image?: string; voice?: string } = {};
  if (input.image) output.image = input.image;
  if (input.voice) output.voice = input.voice;
  return Object.keys(output).length ? output : undefined;
}

function firstExisting(paths: Array<string | undefined>): string | undefined {
  for (const item of paths) {
    if (item && existsSync(item)) return item;
  }
  return undefined;
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function resolveLegacyAsset(root: string, value: string | undefined): string | undefined {
  if (!value) return undefined;
  return isAbsolute(value) ? value : resolve(root, value);
}

function resolveFrom(cwd: string, value: string): string {
  return isAbsolute(value) ? value : resolve(cwd, value);
}

function cleanNarration(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+$/gm, "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\n+/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

function estimateNarrationDuration(text: string | undefined): number {
  if (!text) return 8;
  const cjkChars = [...text].filter((char) => /[\u3400-\u9fff]/.test(char)).length;
  return Math.max(3, Number((cjkChars / 4.8 + 0.6).toFixed(2)));
}

function sumSceneDurations(scenes: StoryScene[]): number {
  const sum = scenes.reduce((total, scene) => total + (scene.duration_sec ?? estimateNarrationDuration(scene.narration)), 0);
  return Number(Math.max(1, sum).toFixed(2));
}

function titleFromText(text: string): string {
  return [...text.replace(/[，。！？、,.!?]/g, " ").trim()].slice(0, 12).join("") || "Scene";
}

function slugFromTitle(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (/^[a-z0-9-]+$/.test(ascii) && ascii) return ascii;
  return `story-${Buffer.from(title).toString("hex").slice(0, 12)}`;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asShortStoryboard(value: unknown): ShortStoryboard {
  const record = asRecord(value);
  return {
    template: stringValue(record.template) || undefined,
    sync_contract: stringValue(record.sync_contract) || undefined,
    style: stringValue(record.style) || undefined,
    topic: stringValue(record.topic) || undefined,
    protagonist: stringValue(record.protagonist) || undefined,
    scenes: Array.isArray(record.scenes)
      ? record.scenes.map((scene) => {
          const item = asRecord(scene);
          return {
            id: stringValue(item.id),
            visual_prompt: stringValue(item.visual_prompt) || undefined,
            on_screen_text: stringValue(item.on_screen_text) || undefined,
            narration: stringValue(item.narration) || undefined,
            duration_sec: positiveNumber(item.duration_sec),
            pause_after_sec: positiveNumber(item.pause_after_sec),
            source_image: stringValue(item.source_image) || undefined,
            image_prompt: stringValue(item.image_prompt) || undefined
          };
        }).filter((scene) => scene.id)
      : []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
