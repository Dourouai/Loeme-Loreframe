#!/usr/bin/env node

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { delimiter, dirname, join, resolve } from "node:path";
import {
  createPublishPack,
  createScenesFromScript,
  createStarterStoryProject,
  createStarterTemplate,
  createStoryManifest,
  defaultManifestPath,
  defaultPackageListPath,
  defaultPublishPath,
  defaultScenesJsonPath,
  defaultScriptPath,
  findTemplateRecord,
  findTemplate,
  loadTemplateRecords,
  parseStoryYaml,
  projectDirFromStoryPath,
  replaceProjectScenes,
  sceneAssetRelativePath,
  type SceneAssetKind,
  stringifyStoryProject,
  stringifyTemplate,
  TEMPLATE_CLASSES,
  TEMPLATE_FILE_NAME,
  type TemplateClass,
  updateSceneAsset,
  validateStoryProject
} from "@story-video/core";
import { validateTemplateFile } from "@story-video/core";
import { RenderError, createRenderPlan, describeRenderPlan, renderProject } from "@story-video/render-ffmpeg";
import { spawnSync } from "node:child_process";
import { detectAgents, findAgent, invokeAgent } from "@story-video/runtime";
import { ConfigStore, maskSecret } from "./config.js";
import { createDefaultProviderRegistry } from "@story-video/providers";
import { adoptCommand } from "./adopt.js";

const [, , command, ...args] = process.argv;
const userCwd = process.env.INIT_CWD || process.cwd();

async function main(): Promise<void> {
  switch (command) {
    case "doctor":
      doctor();
      break;
    case "init":
      await init(args);
      break;
    case "validate":
      await validate(args);
      break;
    case "templates":
      await templates();
      break;
    case "template":
      await templateCommand(args);
      break;
    case "inspect-template":
      await inspectTemplate(args);
      break;
    case "agents":
      await agents();
      break;
    case "config":
      config(args);
      break;
    case "generate-script":
      await generateScript(args);
      break;
    case "split-scenes":
      await splitScenes(args);
      break;
    case "import-image":
      await importSceneAsset(args, "image");
      break;
    case "import-voice":
      await importSceneAsset(args, "voice");
      break;
    case "import-captions":
      await importSceneAsset(args, "captions");
      break;
    case "package":
      await packageProject(args);
      break;
    case "plan":
      await plan(args);
      break;
    case "render":
      await render(args);
      break;
    case "adopt":
      await adoptCommand(args, { userCwd });
      break;
    case "music":
      await music(args);
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      help();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function help(): void {
  console.log(`story-video

Commands:
  doctor                         Check local dependencies
  init <id> [--title <title>]     Create a starter story project
  validate <story.yaml>           Validate story metadata
  templates                       List story video style templates
  template init <id> [--name <name>] [--class story_style] [--dir templates]
  template validate <path>         Validate a user template file or directory
  template dirs                    Show template search directories
  inspect-template <id>           Print one template's metadata
  agents                          Detect local/API generation agents
  config show                     Show local config status
  config set-deepseek --api-key <key> [--model <id>] [--base-url <url>]
  generate-script <story.yaml> [--agent deepseek-api|codex] [--template <id>]
  split-scenes <story.yaml> [--script <script.md>] [--max-scenes <n>] [--dry-run]
  import-image <story.yaml> <scene-id> <path>
  import-voice <story.yaml> <scene-id> <path>
  import-captions <story.yaml> <scene-id> <path>
  music list                      List default music library tracks
  music search <query>            Search music presets by mood/use case
  package <story.yaml>            Write publish.json, manifest.json, and package file list
  plan <story.yaml>               Print the FFmpeg render plan
  render <story.yaml> [--output outputs/final.mp4] [--resolution 1920x1080] [--fps 30] [--ffmpeg <path>] [--ffprobe <path>]
  adopt taiping <legacy-dir>       Convert an existing Taiping Guangji workspace to Loeme files
  adopt short-story <json|dir>     Convert an existing short-story storyboard/project to Loeme files
`);
}

function doctor(): void {
  const checks = [
    { label: "ffmpeg", binary: process.env.FFMPEG_BIN ?? "ffmpeg", required: true },
    { label: "ffprobe", binary: process.env.FFPROBE_BIN ?? "ffprobe", required: false }
  ].map((check) => {
    const result = spawnSync(check.binary, ["-version"], { stdio: "ignore" });
    return { ...check, ok: result.status === 0 };
  });

  for (const check of checks) {
    const required = check.required ? "" : " optional";
    console.log(`${check.ok ? "ok" : "missing"}${required} ${check.label}\t${check.binary}`);
  }

  if (checks.some((check) => check.required && !check.ok)) {
    process.exitCode = 1;
  }
}

async function init(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    throw new Error("Usage: story-video init <id> [--title <title>]");
  }

  const title = readFlag(args, "--title") ?? id;
  const root = join(userCwd, id);
  const project = createStarterStoryProject(id, title);

  await mkdir(join(root, "assets"), { recursive: true });
  await writeFile(join(root, "story.yaml"), stringifyStoryProject(project));
  await writeFile(join(root, "script.md"), `# ${title}\n\n在这里写人工审核后的旁白脚本。\n`);
  await writeFile(join(root, "assets", ".gitkeep"), "");

  console.log(`created ${root}`);
}

async function validate(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video validate <story.yaml>");
  }

  const value = parseStoryYaml(await readFile(resolveUserPath(filePath), "utf8"));
  const result = validateStoryProject(value);

  for (const warning of result.warnings) {
    console.log(`warning: ${warning}`);
  }

  console.log(`valid ${filePath}`);
}

async function templates(): Promise<void> {
  const templateClass = readFlag(process.argv.slice(2), "--class");
  const loaded = await loadTemplateRecords(resolveTemplateSearchDirs());
  for (const record of loaded) {
    const template = record.template;
    if (templateClass && template.template_class !== templateClass) continue;
    console.log(`${template.id}\t${template.name}\t${template.template_class}\t${template.category}\t${record.source}`);
    console.log(`  ${template.description}`);
  }
}

async function templateCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  if (subcommand === "init") {
    await initTemplate(args.slice(1));
    return;
  }

  if (subcommand === "validate") {
    await validateTemplateCommand(args.slice(1));
    return;
  }

  if (subcommand === "dirs") {
    for (const searchDir of resolveTemplateSearchDirs()) {
      console.log(`${searchDir.source}\t${searchDir.dir}`);
    }
    return;
  }

  throw new Error("Usage: story-video template init|validate|dirs");
}

async function initTemplate(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    throw new Error("Usage: story-video template init <id> [--name <name>] [--class story_style] [--dir templates]");
  }

  const templateClassRaw = readFlag(args, "--class") ?? "story_style";
  if (!TEMPLATE_CLASSES.includes(templateClassRaw as TemplateClass)) {
    throw new Error(`--class must be one of ${TEMPLATE_CLASSES.join(", ")}`);
  }

  const name = readFlag(args, "--name") ?? titleize(id);
  const outputDir = resolveUserPath(readFlag(args, "--dir") ?? "templates");
  const templateDir = join(outputDir, id);
  const filePath = join(templateDir, TEMPLATE_FILE_NAME);
  if (existsSync(filePath)) {
    throw new Error(`Template already exists: ${filePath}`);
  }

  const template = createStarterTemplate(id, name, templateClassRaw as TemplateClass);
  await mkdir(templateDir, { recursive: true });
  await writeFile(filePath, stringifyTemplate(template));
  await writeFile(
    join(templateDir, "README.md"),
    `# ${name}\n\nDescribe this ${templateClassRaw} template, when to use it, and what to avoid.\n`
  );
  console.log(`created ${filePath}`);
}

async function validateTemplateCommand(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) {
    throw new Error("Usage: story-video template validate <template.story-video.yaml | template-dir>");
  }

  const targetPath = resolveUserPath(target);
  const filePath = targetPath.endsWith(".yaml") ? targetPath : join(targetPath, TEMPLATE_FILE_NAME);
  const result = await validateTemplateFile(filePath);
  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`error: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`valid ${filePath}`);
}

async function inspectTemplate(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    throw new Error("Usage: story-video inspect-template <id>");
  }

  const record = await findTemplateRecord(resolveTemplateSearchDirs(), id);
  if (!record) {
    throw new Error(`Template not found: ${id}`);
  }

  console.log(JSON.stringify({ ...record.template, _meta: { source: record.source, dir: record.dir } }, null, 2));
}

async function agents(): Promise<void> {
  const store = new ConfigStore(userCwd);
  const detected = await detectAgents({ cwd: userCwd, config: store.read() });
  for (const agent of detected) {
    const status = agent.available ? "ok" : "missing";
    const detail = agent.version ?? agent.path ?? agent.hint ?? agent.installUrl ?? "";
    console.log(`${status} ${agent.id}\t${agent.name}${detail ? `\t${detail}` : ""}`);
  }
}

function config(args: string[]): void {
  const subcommand = args[0];
  const store = new ConfigStore(userCwd);

  if (subcommand === "show") {
    const current = store.read();
    console.log(`config: ${store.path}`);
    console.log(`defaultAgent: ${current.defaultAgent ?? "(unset)"}`);
    console.log(`deepseek.apiKey: ${maskSecret(current.deepseek?.apiKey) || envStatus("DEEPSEEK_API_KEY")}`);
    console.log(`deepseek.model: ${current.deepseek?.model ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat"}`);
    console.log(`deepseek.baseUrl: ${current.deepseek?.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}`);
    console.log(`templateDirs: ${(current.templateDirs ?? []).join(", ") || "(none)"}`);
    return;
  }

  if (subcommand === "set-deepseek") {
    const apiKey = readFlag(args, "--api-key");
    const model = readFlag(args, "--model");
    const baseUrl = readFlag(args, "--base-url");
    if (!apiKey && !model && !baseUrl) {
      throw new Error("Usage: story-video config set-deepseek --api-key <key> [--model <id>] [--base-url <url>]");
    }
    store.setDeepSeek({ apiKey, model, baseUrl });
    console.log(`updated ${store.path}`);
    return;
  }

  if (subcommand === "add-template-dir") {
    const dir = args[1];
    if (!dir) {
      throw new Error("Usage: story-video config add-template-dir <dir>");
    }
    store.addTemplateDir(dir);
    console.log(`added template dir ${dir}`);
    return;
  }

  if (subcommand === "remove-template-dir") {
    const dir = args[1];
    if (!dir) {
      throw new Error("Usage: story-video config remove-template-dir <dir>");
    }
    store.removeTemplateDir(dir);
    console.log(`removed template dir ${dir}`);
    return;
  }

  throw new Error("Usage: story-video config show | config set-deepseek --api-key <key> | config add-template-dir <dir>");
}

async function plan(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video plan <story.yaml>");
  }

  const project = parseStoryYaml(await readFile(resolveUserPath(filePath), "utf8"));
  console.log(describeRenderPlan(createRenderPlan(project)));
}

async function render(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video render <story.yaml> [--output outputs/final.mp4] [--resolution 1920x1080] [--fps 30]");
  }

  const storyPath = resolveUserPath(filePath);
  const project = parseStoryYaml(await readFile(storyPath, "utf8"));
  const fpsRaw = readFlag(args, "--fps");
  const fps = fpsRaw === undefined ? undefined : Number(fpsRaw);
  if (fps !== undefined && (!Number.isInteger(fps) || fps <= 0)) {
    throw new Error("--fps must be a positive integer");
  }

  try {
    const result = await renderProject(project, {
      projectDir: projectDirFromStoryPath(storyPath),
      output: readFlag(args, "--output"),
      resolution: readFlag(args, "--resolution"),
      fps,
      ffmpegPath: readFlag(args, "--ffmpeg") ?? process.env.FFMPEG_BIN,
      ffprobePath: readFlag(args, "--ffprobe") ?? process.env.FFPROBE_BIN,
      keepTemp: args.includes("--keep-temp")
    });

    console.log(`rendered ${result.outputPath}`);
    console.log(`scenes: ${result.sceneCount}`);
    if (result.durationSec !== null) {
      console.log(`duration: ${result.durationSec.toFixed(3)}s`);
    }
    if (args.includes("--keep-temp")) {
      console.log(`temp: ${result.tempDir}`);
    }
  } catch (error) {
    if (error instanceof RenderError) {
      console.error(error.message);
      for (const detail of error.details) {
        if (detail) console.error(`- ${detail}`);
      }
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

async function splitScenes(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video split-scenes <story.yaml> [--script <script.md>] [--max-scenes <n>] [--dry-run]");
  }

  const storyPath = resolveUserPath(filePath);
  const scriptPath = resolveUserPath(readFlag(args, "--script") ?? defaultScriptPath(storyPath));
  const maxScenesRaw = readFlag(args, "--max-scenes");
  const parsedMaxScenes = maxScenesRaw ? Number(maxScenesRaw) : undefined;
  if (parsedMaxScenes !== undefined && (!Number.isInteger(parsedMaxScenes) || parsedMaxScenes <= 0)) {
    throw new Error("--max-scenes must be a positive integer");
  }

  const project = parseStoryYaml(await readFile(storyPath, "utf8"));
  const script = await readFile(scriptPath, "utf8");
  const scenes = createScenesFromScript(script, { maxScenes: parsedMaxScenes });
  if (scenes.length === 0) {
    throw new Error(`No narration chunks found in ${scriptPath}`);
  }

  const nextProject = replaceProjectScenes(project, scenes);

  if (args.includes("--dry-run")) {
    console.log(JSON.stringify(scenes, null, 2));
    return;
  }

  await writeFile(storyPath, stringifyStoryProject(nextProject));
  await writeFile(defaultScenesJsonPath(storyPath), `${JSON.stringify(scenes, null, 2)}\n`);
  console.log(`wrote ${scenes.length} scenes to ${storyPath}`);
  console.log(`wrote ${defaultScenesJsonPath(storyPath)}`);
}

async function importSceneAsset(args: string[], kind: SceneAssetKind): Promise<void> {
  const [filePath, sceneId, sourcePathRaw] = args;
  if (!filePath || !sceneId || !sourcePathRaw) {
    throw new Error(`Usage: story-video import-${kind} <story.yaml> <scene-id> <path>`);
  }

  const storyPath = resolveUserPath(filePath);
  const sourcePath = resolveUserPath(sourcePathRaw);
  if (!existsSync(sourcePath)) {
    throw new Error(`Asset not found: ${sourcePath}`);
  }

  const relativePath = sceneAssetRelativePath(kind, sceneId, sourcePath);
  const destinationPath = join(projectDirFromStoryPath(storyPath), relativePath);
  await mkdir(dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);

  const project = parseStoryYaml(await readFile(storyPath, "utf8"));
  const nextProject = updateSceneAsset(project, sceneId, kind, relativePath);
  await writeFile(storyPath, stringifyStoryProject(nextProject));

  console.log(`copied ${sourcePath} -> ${destinationPath}`);
  console.log(`updated ${storyPath}`);
}

async function packageProject(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video package <story.yaml>");
  }

  const storyPath = resolveUserPath(filePath);
  const projectDir = projectDirFromStoryPath(storyPath);
  const project = parseStoryYaml(await readFile(storyPath, "utf8"));
  const publishPack = createPublishPack(project);
  const manifest = createStoryManifest(project);
  const packageListPath = defaultPackageListPath(storyPath);

  await mkdir(dirname(packageListPath), { recursive: true });
  await writeFile(defaultPublishPath(storyPath), `${JSON.stringify(publishPack, null, 2)}\n`);
  await writeFile(defaultManifestPath(storyPath), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(packageListPath, packageFileList(project, projectDir).join("\n") + "\n");

  console.log(`wrote ${defaultPublishPath(storyPath)}`);
  console.log(`wrote ${defaultManifestPath(storyPath)}`);
  console.log(`wrote ${packageListPath}`);
}

async function generateScript(args: string[]): Promise<void> {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("Usage: story-video generate-script <story.yaml> [--agent deepseek-api|codex] [--template <id>]");
  }

  const store = new ConfigStore(userCwd);
  const config = store.read();
  const project = parseStoryYaml(await readFile(resolveUserPath(filePath), "utf8"));
  const templateId = readFlag(args, "--template") ?? project.style.visual_preset;
  const record = await findTemplateRecord(resolveTemplateSearchDirs(), templateId);
  if (!record) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const agentId = readFlag(args, "--agent") ?? config.defaultAgent ?? "deepseek-api";
  const agent = findAgent(agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  const prompt = [
    "你是一个中文 YouTube 有声故事视频编剧。",
    "请根据 story.yaml 与风格模板，生成一版可人工审核的旁白脚本。",
    "",
    "要求：",
    "- 适合图片 + 旁白 + 字幕的视频，不要写成小说正文。",
    "- 开头 10 秒必须有钩子。",
    "- 用自然口语讲述，但保持民间故事氛围。",
    "- 按场景分段，每段给建议画面。",
    "- 不要把 AI 编造内容包装成确证真实事件。",
    "- 输出 Markdown。",
    "",
    "story.yaml:",
    "```yaml",
    stringifyStoryProject(project).trim(),
    "```",
    "",
    "template:",
    "```json",
    JSON.stringify(record.template, null, 2),
    "```"
  ].join("\n");

  const result = await invokeAgent({
    agent,
    prompt,
    context: { cwd: userCwd, config },
    onEvent(event) {
      if (event.type === "text") process.stdout.write(event.chunk);
      if (event.type === "error") process.stderr.write(`\n${event.message}\n`);
    }
  });

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode;
  }
}

async function music(args: string[]): Promise<void> {
  const subcommand = args[0];
  const registry = createDefaultProviderRegistry();
  const library = registry.list("music_library")[0];
  if (!library || library.kind !== "music_library") {
    throw new Error("No music library provider registered");
  }

  if (subcommand === "list") {
    printMusicTracks(await library.listTracks());
    return;
  }

  if (subcommand === "search") {
    const query = args.slice(1).join(" ");
    if (!query.trim()) {
      throw new Error("Usage: story-video music search <query>");
    }
    printMusicTracks(await library.searchTracks(query));
    return;
  }

  throw new Error("Usage: story-video music list | music search <query>");
}

function printMusicTracks(tracks: Array<import("@story-video/providers").MusicTrack>): void {
  for (const track of tracks) {
    const license = track.license.spdx ?? track.license.name ?? "unknown";
    const bundled = track.bundled ? "bundled" : "preset";
    console.log(`${track.id}\t${track.title}\t${bundled}\t${license}`);
    console.log(`  ${track.description}`);
    console.log(`  moods: ${track.moods.join(", ")}`);
    if (track.generationPrompt) {
      console.log(`  prompt: ${track.generationPrompt}`);
    }
  }
}

function packageFileList(project: ReturnType<typeof parseStoryYaml>, projectDir: string): string[] {
  const files = [
    "story.yaml",
    "script.md",
    "scenes.json",
    "publish.json",
    "manifest.json",
    "outputs/final.mp4",
    "outputs/final.srt",
    "outputs/final.ass",
    ...((project.scenes ?? []).flatMap((scene) => [
      scene.assets?.image,
      scene.assets?.voice,
      scene.assets?.captions,
      scene.assets?.music,
      scene.image_path && !scene.assets?.image ? scene.image_path : undefined
    ])).filter((path): path is string => Boolean(path))
  ];

  return [...new Set(files)].map((file) => {
    const absolute = join(projectDir, file);
    const status = existsSync(absolute) ? "present" : "missing";
    return `${status}\t${file}`;
  });
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function resolveTemplateSearchDirs() {
  const store = new ConfigStore(userCwd);
  const config = store.read();
  const dirs = [
    { dir: join(userCwd, "templates"), source: "builtin" as const },
    ...envTemplateDirs().map((dir) => ({ dir: resolveUserPath(dir), source: "env" as const })),
    ...(config.templateDirs ?? []).map((dir) => ({ dir: resolveUserPath(dir), source: "user" as const }))
  ];

  const seen = new Set<string>();
  return dirs.filter((item) => {
    const key = resolve(item.dir);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function envStatus(key: string): string {
  return process.env[key] ? "(set in env)" : "(unset)";
}

function resolveUserPath(path: string): string {
  return path.startsWith("/") ? path : join(userCwd, path);
}

function envTemplateDirs(): string[] {
  const many = process.env.STORY_VIDEO_TEMPLATE_DIRS;
  if (many) return many.split(delimiter).filter(Boolean);
  const one = process.env.STORY_VIDEO_TEMPLATES_DIR;
  return one ? [one] : [];
}

function titleize(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
