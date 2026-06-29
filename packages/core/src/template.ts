import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";

export const TEMPLATE_FILE_NAME = "template.story-video.yaml";

export const TEMPLATE_CLASSES = [
  "story_style",
  "scene_layout",
  "subtitle_style",
  "audio_style",
  "publish_pack"
] as const;

export type TemplateClass = (typeof TEMPLATE_CLASSES)[number];

export interface StoryVideoTemplate {
  spec_version: 1;
  id: string;
  name: string;
  description: string;
  template_class: TemplateClass;
  category: string;
  tags: string[];
  best_for: string[];
  not_for?: string[];
  visual?: {
    palette?: Record<string, string>;
    typography?: Record<string, string>;
    image_prompt_rules: string[];
  };
  motion?: {
    default_scene_motion: string;
    transitions: string[];
    overlays?: string[];
  };
  subtitles?: {
    format: "srt" | "ass";
    position: string;
    max_lines: number;
    keyword_highlight?: boolean;
  };
  audio?: {
    narration_mood: string;
    bgm_mood?: string;
    sfx?: string[];
  };
  layout?: {
    scene_count?: { min?: number; max?: number };
    structure?: string[];
  };
  publish?: {
    title_rules?: string[];
    description_rules?: string[];
    tag_rules?: string[];
    disclosure_rules?: string[];
  };
  license: {
    spdx: string;
    attribution_required: boolean;
  };
  provenance?: unknown;
}

export interface LoadedTemplate {
  template: StoryVideoTemplate;
  dir: string;
  filePath: string;
  source: "builtin" | "user" | "env";
}

export interface TemplateSearchDir {
  dir: string;
  source: LoadedTemplate["source"];
}

export interface TemplateValidationResult {
  ok: boolean;
  errors: string[];
}

export async function loadTemplates(templatesDir: string): Promise<StoryVideoTemplate[]> {
  const records = await loadTemplateRecords([{ dir: templatesDir, source: "builtin" }]);
  return records.map((record) => record.template);
}

export async function loadTemplateRecords(searchDirs: TemplateSearchDir[]): Promise<LoadedTemplate[]> {
  const records: LoadedTemplate[] = [];

  for (const searchDir of searchDirs) {
    records.push(...(await loadTemplateRecordsFromDir(searchDir)));
  }

  const seen = new Map<string, LoadedTemplate>();
  for (const record of records) {
    const prior = seen.get(record.template.id);
    if (prior) {
      throw new Error(
        `Duplicate template id "${record.template.id}" in ${prior.filePath} and ${record.filePath}`
      );
    }
    seen.set(record.template.id, record);
  }

  return records.sort((a, b) => a.template.id.localeCompare(b.template.id));
}

export async function loadTemplateRecordsFromDir(searchDir: TemplateSearchDir): Promise<LoadedTemplate[]> {
  const rootFile = join(searchDir.dir, TEMPLATE_FILE_NAME);
  if (await pathExists(rootFile)) {
    return [await readTemplateRecord(rootFile, searchDir.dir, searchDir.source)];
  }

  if (!(await pathExists(searchDir.dir))) return [];

  const entries = await readdir(searchDir.dir, { withFileTypes: true });
  const records: LoadedTemplate[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(searchDir.dir, entry.name);
    const filePath = join(dir, TEMPLATE_FILE_NAME);
    if (!(await pathExists(filePath))) continue;
    records.push(await readTemplateRecord(filePath, dir, searchDir.source));
  }

  return records;
}

export async function findTemplate(templatesDir: string, id: string): Promise<StoryVideoTemplate | null> {
  const templates = await loadTemplates(templatesDir);
  return templates.find((template) => template.id === id) ?? null;
}

export async function findTemplateRecord(searchDirs: TemplateSearchDir[], id: string): Promise<LoadedTemplate | null> {
  const records = await loadTemplateRecords(searchDirs);
  return records.find((record) => record.template.id === id) ?? null;
}

export async function validateTemplateFile(filePath: string): Promise<TemplateValidationResult> {
  try {
    const value = YAML.parse(await readFile(filePath, "utf8")) as unknown;
    return validateTemplate(value);
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

export function createStarterTemplate(
  id: string,
  name: string,
  templateClass: TemplateClass = "story_style"
): StoryVideoTemplate {
  const base: StoryVideoTemplate = {
    spec_version: 1,
    id,
    name,
    description: "Describe when this template should be used.",
    template_class: templateClass,
    category: "custom",
    tags: ["custom"],
    best_for: ["Custom narrated story videos"],
    not_for: ["Unreviewed or misleading content"],
    license: {
      spdx: "MIT",
      attribution_required: false
    },
    provenance: {
      origin: {
        kind: "user",
        name: "User-authored template"
      },
      transformation: {
        notes: "Created with story-video template init."
      }
    }
  };

  if (templateClass === "story_style") {
    return {
      ...base,
      visual: {
        palette: {
          background: "#171717",
          accent: "#c08a4a",
          subtitle: "#f5e8cf"
        },
        typography: {
          title: "serif",
          body: "sans"
        },
        image_prompt_rules: [
          "Describe the recurring image style.",
          "List objects, eras, or visual mistakes to avoid."
        ]
      },
      motion: {
        default_scene_motion: "slow_push_in",
        transitions: ["crossfade"],
        overlays: ["film_grain"]
      },
      subtitles: {
        format: "ass",
        position: "bottom_safe",
        max_lines: 2,
        keyword_highlight: true
      },
      audio: {
        narration_mood: "calm_storyteller",
        bgm_mood: "ambient"
      }
    };
  }

  if (templateClass === "scene_layout") {
    return {
      ...base,
      layout: {
        scene_count: { min: 6, max: 14 },
        structure: ["hook", "background", "incident", "escalation", "turn", "aftertaste"]
      }
    };
  }

  if (templateClass === "subtitle_style") {
    return {
      ...base,
      subtitles: {
        format: "ass",
        position: "bottom_safe",
        max_lines: 2,
        keyword_highlight: true
      }
    };
  }

  if (templateClass === "audio_style") {
    return {
      ...base,
      audio: {
        narration_mood: "calm_storyteller",
        bgm_mood: "ambient"
      }
    };
  }

  return {
    ...base,
    publish: {
      title_rules: ["Keep the hook specific and avoid misleading certainty."],
      description_rules: ["Record source and AI disclosure review state."],
      tag_rules: ["Use topic, genre, and source tags."],
      disclosure_rules: ["Review YouTube altered content requirements before publishing."]
    }
  };
}

export function stringifyTemplate(template: StoryVideoTemplate): string {
  return YAML.stringify(template, { lineWidth: 100 });
}

export function validateTemplate(value: unknown): TemplateValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["template must be a YAML object"] };
  }

  if (value.spec_version !== 1) {
    errors.push("spec_version must be 1");
  }
  requireString(value, "id", errors);
  requireString(value, "name", errors);
  requireString(value, "description", errors);
  requireString(value, "template_class", errors);
  requireString(value, "category", errors);
  requireStringArray(value, "tags", errors);
  requireStringArray(value, "best_for", errors);

  if (typeof value.id === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) {
    errors.push("id must be kebab-case");
  }

  const templateClass = typeof value.template_class === "string" ? value.template_class : "";
  if (!TEMPLATE_CLASSES.includes(templateClass as TemplateClass)) {
    errors.push(`template_class must be one of ${TEMPLATE_CLASSES.join(", ")}`);
  }

  if (requires(templateClass, "visual") && !isRecord(value.visual)) {
    errors.push("visual must be an object");
  } else if (isRecord(value.visual)) {
    requireStringArray(value.visual, "image_prompt_rules", errors, "visual.image_prompt_rules");
  }

  if (requires(templateClass, "motion") && !isRecord(value.motion)) {
    errors.push("motion must be an object");
  } else if (isRecord(value.motion)) {
    requireString(value.motion, "default_scene_motion", errors, "motion.default_scene_motion");
    requireStringArray(value.motion, "transitions", errors, "motion.transitions");
  }

  if (requires(templateClass, "subtitles") && !isRecord(value.subtitles)) {
    errors.push("subtitles must be an object");
  } else if (isRecord(value.subtitles)) {
    requireString(value.subtitles, "format", errors, "subtitles.format");
    requireString(value.subtitles, "position", errors, "subtitles.position");
    if (typeof value.subtitles.max_lines !== "number") {
      errors.push("subtitles.max_lines must be a number");
    }
  }

  if (requires(templateClass, "audio") && !isRecord(value.audio)) {
    errors.push("audio must be an object");
  } else if (isRecord(value.audio)) {
    requireString(value.audio, "narration_mood", errors, "audio.narration_mood");
  }

  if (requires(templateClass, "layout") && !isRecord(value.layout)) {
    errors.push("layout must be an object");
  }

  if (requires(templateClass, "publish") && !isRecord(value.publish)) {
    errors.push("publish must be an object");
  }

  if (!isRecord(value.license)) {
    errors.push("license must be an object");
  } else {
    requireString(value.license, "spdx", errors, "license.spdx");
    if (typeof value.license.attribution_required !== "boolean") {
      errors.push("license.attribution_required must be a boolean");
    }
  }

  return { ok: errors.length === 0, errors };
}

async function readTemplateRecord(
  filePath: string,
  dir: string,
  source: LoadedTemplate["source"]
): Promise<LoadedTemplate> {
  try {
    const value = YAML.parse(await readFile(filePath, "utf8")) as unknown;
    const validation = validateTemplate(value);
    if (!validation.ok) {
      throw new Error(validation.errors.join("; "));
    }
    return {
      template: value as StoryVideoTemplate,
      dir,
      filePath,
      source
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load template ${filePath}: ${message}`);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function requires(templateClass: string, field: string): boolean {
  const required: Record<string, string[]> = {
    story_style: ["visual", "motion", "subtitles", "audio"],
    scene_layout: ["layout"],
    subtitle_style: ["subtitles"],
    audio_style: ["audio"],
    publish_pack: ["publish"]
  };
  return (required[templateClass] ?? []).includes(field);
}

function requireString(record: Record<string, unknown>, key: string, errors: string[], label = key): void {
  if (typeof record[key] !== "string" || record[key].trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function requireStringArray(record: Record<string, unknown>, key: string, errors: string[], label = key): void {
  if (!Array.isArray(record[key]) || !record[key].every((item) => typeof item === "string" && item.trim() !== "")) {
    errors.push(`${label} must be a non-empty string array`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
