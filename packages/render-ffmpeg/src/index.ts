import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { AspectRatio, StoryProject, StoryScene } from "@story-video/core";

export interface RenderPlan {
  output: string;
  aspectRatio: string;
  durationSec: number;
  sceneCount: number;
  requires: string[];
}

export interface RenderOptions {
  projectDir: string;
  output?: string;
  fps?: number;
  resolution?: string;
  keepTemp?: boolean;
  ffmpegPath?: string;
  ffprobePath?: string;
}

export interface RenderResult {
  outputPath: string;
  durationSec: number | null;
  sceneCount: number;
  tempDir: string;
  commands: string[][];
}

interface PreparedScene {
  scene: StoryScene;
  imagePath: string;
  voicePath: string;
  durationSec: number;
}

export class RenderError extends Error {
  details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "RenderError";
    this.details = details;
  }
}

export function createRenderPlan(project: StoryProject, output = "outputs/final.mp4"): RenderPlan {
  return {
    output,
    aspectRatio: project.aspect_ratio,
    durationSec: project.duration_sec,
    sceneCount: project.scenes?.length ?? 0,
    requires: ["ffmpeg"]
  };
}

export function describeRenderPlan(plan: RenderPlan): string {
  return [
    `output: ${plan.output}`,
    `aspect ratio: ${plan.aspectRatio}`,
    `duration: ${plan.durationSec}s`,
    `scenes: ${plan.sceneCount}`,
    `requires: ${plan.requires.join(", ")}`
  ].join("\n");
}

export async function renderProject(project: StoryProject, options: RenderOptions): Promise<RenderResult> {
  const ffmpeg = options.ffmpegPath ?? "ffmpeg";
  const ffprobe = options.ffprobePath ?? "ffprobe";
  const projectDir = resolve(options.projectDir);
  const outputPath = resolveProjectPath(projectDir, options.output ?? "outputs/final.mp4");
  const fps = options.fps ?? 30;
  const resolution = parseResolution(options.resolution ?? defaultResolution(project.aspect_ratio));
  const scenes = prepareScenes(project, projectDir);
  ensureBinary(ffmpeg, "ffmpeg");
  const canUseFfprobe = binaryAvailable(ffprobe);
  const tempDir = join(dirname(outputPath), ".render-tmp", `${Date.now()}`);
  const commands: string[][] = [];

  await mkdir(tempDir, { recursive: true });
  await mkdir(dirname(outputPath), { recursive: true });

  try {
    const segmentPaths: string[] = [];
    for (const [index, scene] of scenes.entries()) {
      const segmentPath = join(tempDir, `${String(index + 1).padStart(3, "0")}-${scene.scene.id}.mp4`);
      const subtitlePath = join(tempDir, `${String(index + 1).padStart(3, "0")}-${scene.scene.id}.ass`);
      await writeFile(subtitlePath, createSceneAss(scene.scene.narration, scene.durationSec, resolution));
      const args = createSceneRenderArgs({
        scene,
        segmentPath,
        subtitlePath,
        fps,
        resolution
      });
      commands.push([ffmpeg, ...args]);
      await run(ffmpeg, args);
      segmentPaths.push(segmentPath);
    }

    const listPath = join(tempDir, "concat.txt");
    await writeFile(listPath, segmentPaths.map((segmentPath) => `file '${escapeConcatPath(segmentPath)}'`).join("\n") + "\n");

    const concatArgs = ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", "-movflags", "+faststart", outputPath];
    commands.push([ffmpeg, ...concatArgs]);
    await run(ffmpeg, concatArgs);

    const durationSec = canUseFfprobe ? probeDuration(ffprobe, outputPath) : probeDurationWithFfmpeg(ffmpeg, outputPath);
    if (!options.keepTemp) {
      await rm(tempDir, { recursive: true, force: true });
    }

    return {
      outputPath,
      durationSec,
      sceneCount: scenes.length,
      tempDir,
      commands
    };
  } catch (error) {
    if (!options.keepTemp) {
      await rm(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

function createSceneRenderArgs(input: {
  scene: PreparedScene;
  segmentPath: string;
  subtitlePath: string;
  fps: number;
  resolution: { width: number; height: number };
}): string[] {
  const duration = formatSeconds(input.scene.durationSec);
  const videoFilter = [
    `scale=${input.resolution.width}:${input.resolution.height}:force_original_aspect_ratio=increase`,
    `crop=${input.resolution.width}:${input.resolution.height}`,
    `fps=${input.fps}`,
    `ass=${escapeFilterPath(input.subtitlePath)}`,
    "format=yuv420p"
  ].join(",");

  return [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(input.fps),
    "-t",
    duration,
    "-i",
    input.scene.imagePath,
    "-i",
    input.scene.voicePath,
    "-filter_complex",
    `[0:v]${videoFilter}[v];[1:a]apad,atrim=0:${duration},asetpts=N/SR/TB[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "stillimage",
    "-r",
    String(input.fps),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    input.segmentPath
  ];
}

function prepareScenes(project: StoryProject, projectDir: string): PreparedScene[] {
  const scenes = project.scenes ?? [];
  if (scenes.length === 0) {
    throw new RenderError("No scenes found", ["Run split-scenes or add scenes to story.yaml before rendering."]);
  }

  const errors: string[] = [];
  const prepared = scenes.map((scene) => {
    const image = scene.assets?.image ?? scene.image_path;
    const voice = scene.assets?.voice;
    const durationSec = scene.duration_sec ?? 0;

    if (!image) errors.push(`${scene.id}: missing assets.image`);
    if (!voice) errors.push(`${scene.id}: missing assets.voice`);
    if (!durationSec || durationSec <= 0) errors.push(`${scene.id}: duration_sec must be positive`);

    const imagePath = image ? resolveProjectPath(projectDir, image) : "";
    const voicePath = voice ? resolveProjectPath(projectDir, voice) : "";
    if (imagePath && !existsSync(imagePath)) errors.push(`${scene.id}: image not found: ${image}`);
    if (voicePath && !existsSync(voicePath)) errors.push(`${scene.id}: voice not found: ${voice}`);

    return {
      scene,
      imagePath,
      voicePath,
      durationSec
    };
  });

  if (errors.length > 0) {
    throw new RenderError("Project is not render-ready", errors);
  }

  return prepared;
}

function ensureBinary(binary: string, label: string): void {
  if (binaryAvailable(binary)) return;
  throw new RenderError(`${label} is required`, [`Install ${label} and make sure "${binary}" is on PATH.`]);
}

function binaryAvailable(binary: string): boolean {
  const result = spawnSync(binary, ["-version"], { stdio: "ignore" });
  return result.status === 0;
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      reject(new RenderError(error.message));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      reject(new RenderError(`Command failed: ${command}`, [stderr.trim().slice(-2000)]));
    });
  });
}

function probeDuration(ffprobe: string, outputPath: string): number | null {
  const result = spawnSync(
    ffprobe,
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", outputPath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) return null;
  const parsed = Number(result.stdout.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function probeDurationWithFfmpeg(ffmpeg: string, outputPath: string): number | null {
  const result = spawnSync(ffmpeg, ["-hide_banner", "-i", outputPath], { encoding: "utf8" });
  const text = `${result.stderr}\n${result.stdout}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function resolveProjectPath(projectDir: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(projectDir, filePath);
}

function parseResolution(value: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/i.exec(value.trim());
  if (!match) {
    throw new RenderError("Invalid resolution", [`Use WIDTHxHEIGHT, for example 1920x1080. Received: ${value}`]);
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width <= 0 || height <= 0) {
    throw new RenderError("Invalid resolution", [`Resolution must be positive. Received: ${value}`]);
  }
  return { width, height };
}

function defaultResolution(aspectRatio: AspectRatio): string {
  if (aspectRatio === "9:16") return "1080x1920";
  if (aspectRatio === "1:1") return "1080x1080";
  return "1920x1080";
}

function formatSeconds(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function escapeConcatPath(value: string): string {
  return value.replace(/'/g, "'\\''");
}

function escapeFilterPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function createSceneAss(narration: string, durationSec: number, resolution: { width: number; height: number }): string {
  const isVertical = resolution.height > resolution.width;
  const fontSize = isVertical ? 58 : 52;
  const marginV = isVertical ? 150 : 74;
  const blocks = subtitleBlocks(narration, isVertical ? 15 : 19);
  const weights = blocks.map((block) => Math.max(4, charCount(block)));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
  let cursor = 0;
  const events: string[] = [];

  blocks.forEach((block, index) => {
    const isLast = index === blocks.length - 1;
    const duration = isLast
      ? Math.max(0.8, durationSec - cursor)
      : Math.max(1.2, (durationSec * weights[index]) / totalWeight);
    const start = cursor;
    const end = Math.min(durationSec, cursor + duration);
    if (end > start + 0.15) {
      events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${escapeAssText(block)}`);
    }
    cursor = end;
  });

  return `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${resolution.width}
PlayResY: ${resolution.height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,PingFang SC,${fontSize},&H00F9F6EB,&H000000FF,&HD0000000,&H8E000000,-1,0,0,0,100,100,0,0,1,5,2,2,86,86,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;
}

function subtitleBlocks(text: string, lineLen: number): string[] {
  const sentences = splitSentences(text);
  const blocks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (charCount(buffer + sentence) > lineLen * 2 && buffer) {
      blocks.push(wrapChinese(buffer, lineLen));
      buffer = "";
    }
    buffer += sentence;
  }
  if (buffer) blocks.push(wrapChinese(buffer, lineLen));
  return blocks.length ? blocks : [wrapChinese(text, lineLen)];
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, "");
  return (normalized.match(/[^。！？!?；;]+[。！？!?；;]?/g) ?? [normalized])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function wrapChinese(text: string, lineLen: number): string {
  const chars = [...text.replace(/\s+/g, "")];
  if (chars.length <= lineLen) return chars.join("");
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += lineLen) {
    lines.push(chars.slice(i, i + lineLen).join(""));
  }
  return lines.slice(0, 2).join("\n");
}

function charCount(text: string): number {
  return [...text.replace(/\s/g, "")].length;
}

function escapeAssText(text: string): string {
  return text
    .replace(/[{}]/g, "")
    .replace(/\n/g, "\\N");
}

function assTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${pad2(m)}:${pad2(s)}.${String(cs).padStart(2, "0")}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
