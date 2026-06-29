import { readFile } from "node:fs/promises";
import YAML from "yaml";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface StorySource {
  kind: "original_outline" | "public_domain_text" | "manual_script" | "licensed_source";
  text?: string;
  url?: string;
  attribution?: string;
}

export interface StoryStyle {
  visual_preset: string;
  voice_preset: string;
  music_preset?: string;
}

export type SceneStatus =
  | "draft"
  | "locked_text"
  | "image_ready"
  | "audio_ready"
  | "caption_ready"
  | "needs_review"
  | "approved"
  | "rendered";

export interface SceneMotion {
  type?: string;
  transition?: string;
}

export interface SceneAssets {
  image?: string;
  voice?: string;
  captions?: string;
  music?: string;
}

export interface SceneReview {
  locked_text?: boolean;
  risk_flags?: string[];
  approved_by?: string | null;
  notes?: string;
}

export interface StoryScene {
  id: string;
  title?: string;
  status?: SceneStatus;
  narration: string;
  image_prompt?: string;
  negative_prompt?: string;
  image_path?: string;
  motion?: SceneMotion;
  assets?: SceneAssets;
  review?: SceneReview;
  duration_sec?: number;
}

export interface StoryProject {
  id: string;
  title: string;
  type: string;
  duration_sec: number;
  aspect_ratio: AspectRatio;
  language: string;
  source: StorySource;
  style: StoryStyle;
  scenes?: StoryScene[];
  publish?: {
    channel?: string;
    audience?: string;
    ai_disclosure_required?: "yes" | "no" | "review";
  };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const aspectRatios = new Set<AspectRatio>(["16:9", "9:16", "1:1"]);
const sceneStatuses = new Set<SceneStatus>([
  "draft",
  "locked_text",
  "image_ready",
  "audio_ready",
  "caption_ready",
  "needs_review",
  "approved",
  "rendered"
]);
const sourceKinds = new Set<StorySource["kind"]>([
  "original_outline",
  "public_domain_text",
  "manual_script",
  "licensed_source"
]);

export function validateStoryProject(value: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["story must be a YAML object"], warnings };
  }

  requireString(value, "id", errors);
  requireString(value, "title", errors);
  requireString(value, "type", errors);
  requireString(value, "language", errors);

  if (typeof value.duration_sec !== "number" || value.duration_sec <= 0) {
    errors.push("duration_sec must be a positive number");
  }

  if (typeof value.aspect_ratio !== "string" || !aspectRatios.has(value.aspect_ratio as AspectRatio)) {
    errors.push('aspect_ratio must be one of "16:9", "9:16", "1:1"');
  }

  if (!isRecord(value.source)) {
    errors.push("source must be an object");
  } else {
    if (typeof value.source.kind !== "string" || !sourceKinds.has(value.source.kind as StorySource["kind"])) {
      errors.push("source.kind is invalid");
    }
    if (!value.source.text && !value.source.url) {
      warnings.push("source should include text or url for traceability");
    }
  }

  if (!isRecord(value.style)) {
    errors.push("style must be an object");
  } else {
    requireString(value.style, "visual_preset", errors, "style.visual_preset");
    requireString(value.style, "voice_preset", errors, "style.voice_preset");
  }

  if (value.scenes !== undefined) {
    if (!Array.isArray(value.scenes)) {
      errors.push("scenes must be an array when provided");
    } else {
      value.scenes.forEach((scene, index) => validateScene(scene, index, errors, warnings));
    }
  } else {
    warnings.push("scenes are not defined yet");
  }

  if (typeof value.title === "string" && /真实/.test(value.title)) {
    warnings.push("title contains '真实'; review wording and AI disclosure before publishing");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function parseStoryYaml(source: string): StoryProject {
  const value = YAML.parse(source) as unknown;
  const validation = validateStoryProject(value);
  if (!validation.ok) {
    throw new Error(`Invalid story project:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return value as StoryProject;
}

export async function readStoryProject(filePath: string): Promise<StoryProject> {
  return parseStoryYaml(await readFile(filePath, "utf8"));
}

export function stringifyStoryProject(project: StoryProject): string {
  return YAML.stringify(project, { lineWidth: 100 });
}

export function createStarterStoryProject(id: string, title: string): StoryProject {
  return {
    id,
    title,
    type: "folk_horror",
    duration_sec: 240,
    aspect_ratio: "16:9",
    language: "zh-CN",
    source: {
      kind: "original_outline",
      text: "在这里写故事梗概或古籍原文。"
    },
    style: {
      visual_preset: "chinese_folk_horror",
      voice_preset: "suspense_male",
      music_preset: "low_drone"
    },
    publish: {
      channel: "chinese-folk-ghost-stories",
      audience: "general",
      ai_disclosure_required: "review"
    },
    scenes: [
      {
        id: "scene-001",
        title: "村口打谷场",
        status: "draft",
        narration: "村口的打谷场，白天热闹，夜里却没人敢靠近。",
        image_prompt: "零几年中国农村夜晚，空荡打谷场，远处老槐树，昏黄月光，中式民俗恐怖",
        negative_prompt: "血腥，正脸怪物，现代城市，高饱和卡通",
        motion: {
          type: "slow_push_in",
          transition: "crossfade"
        },
        review: {
          locked_text: false,
          risk_flags: []
        },
        duration_sec: 12
      }
    ]
  };
}

function validateScene(scene: unknown, index: number, errors: string[], warnings: string[]): void {
  const label = `scenes[${index}]`;
  if (!isRecord(scene)) {
    errors.push(`${label} must be an object`);
    return;
  }

  requireString(scene, "id", errors, `${label}.id`);
  requireString(scene, "narration", errors, `${label}.narration`);

  if (scene.status !== undefined && (typeof scene.status !== "string" || !sceneStatuses.has(scene.status as SceneStatus))) {
    errors.push(`${label}.status is invalid`);
  }

  if (!scene.image_prompt && !scene.image_path && !assetPath(scene, "image")) {
    warnings.push(`${label} should include image_prompt, image_path, or assets.image`);
  }

  if (scene.duration_sec !== undefined && (typeof scene.duration_sec !== "number" || scene.duration_sec <= 0)) {
    errors.push(`${label}.duration_sec must be a positive number`);
  }

  if (scene.motion !== undefined && !isRecord(scene.motion)) {
    errors.push(`${label}.motion must be an object`);
  }

  if (scene.assets !== undefined && !isRecord(scene.assets)) {
    errors.push(`${label}.assets must be an object`);
  } else if (isRecord(scene.assets)) {
    validateOptionalString(scene.assets, "image", errors, `${label}.assets.image`);
    validateOptionalString(scene.assets, "voice", errors, `${label}.assets.voice`);
    validateOptionalString(scene.assets, "captions", errors, `${label}.assets.captions`);
    validateOptionalString(scene.assets, "music", errors, `${label}.assets.music`);
  }

  if (scene.review !== undefined && !isRecord(scene.review)) {
    errors.push(`${label}.review must be an object`);
  } else if (isRecord(scene.review)) {
    if (scene.review.locked_text !== undefined && typeof scene.review.locked_text !== "boolean") {
      errors.push(`${label}.review.locked_text must be a boolean`);
    }
    if (
      scene.review.risk_flags !== undefined &&
      (!Array.isArray(scene.review.risk_flags) || !scene.review.risk_flags.every((flag) => typeof flag === "string"))
    ) {
      errors.push(`${label}.review.risk_flags must be a string array`);
    }
  }
}

function requireString(record: Record<string, unknown>, key: string, errors: string[], label = key): void {
  if (typeof record[key] !== "string" || record[key].trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function validateOptionalString(record: Record<string, unknown>, key: string, errors: string[], label = key): void {
  if (record[key] !== undefined && (typeof record[key] !== "string" || record[key].trim() === "")) {
    errors.push(`${label} must be a non-empty string when provided`);
  }
}

function assetPath(scene: Record<string, unknown>, key: keyof SceneAssets): string | undefined {
  if (!isRecord(scene.assets)) return undefined;
  const value = scene.assets[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
