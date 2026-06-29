# Loeme Loreframe

Open-source scene-first narrated video generation for folk tales, ghost stories, myths, and image-based story channels.

Loeme Loreframe turns a story idea, source text, or outline into a YouTube-ready package:

- narrated video MP4
- thumbnail
- subtitles
- title and description
- tags
- source and generation manifest

The first milestone is intentionally small: render a story video from human-reviewed script, images, and narration audio. AI script writing, image generation, TTS, Shorts slicing, and Studio UI can be added after the production spine is stable.

Naming note: the public project name is **Loeme Loreframe**. The current local workspace and package names may still use `story-video-factory` / `@story-video/*` until the open-source repo and package scope are finalized.

## Reference

Loeme Loreframe references the Studio interaction and open-source product structure from Open Design's [`html-video`](https://github.com/nexu-io/html-video): a dense local workbench, template-aware creation, provider settings, agent integration, and render/export flow.

The product direction is different: Loeme focuses on narrated image story videos, with chapters, narration, music, subtitles, and local FFmpeg rendering as the core workflow.

## Why

The target format is not a general video editor and not HTML-to-video. It is a repeatable pipeline for narrated image stories:

1. Script
2. Storyboard
3. Scene images
4. Narration
5. Subtitles
6. Background music
7. FFmpeg render
8. QA
9. YouTube publish package

## Quick Start

```bash
pnpm install
pnpm build
pnpm story-video doctor
pnpm story-video validate examples/daguchang-ghost-story/story.yaml
```

Create a new story project:

```bash
pnpm story-video init my-ghost-story --title "半夜路过打谷场的人"
```

Split a reviewed script into scene cards and prepare a local publish package:

```bash
pnpm story-video split-scenes my-ghost-story/story.yaml
pnpm story-video import-image my-ghost-story/story.yaml scene-001 ./scene-001.png
pnpm story-video import-voice my-ghost-story/story.yaml scene-001 ./scene-001.wav
pnpm story-video render my-ghost-story/story.yaml
pnpm story-video package my-ghost-story/story.yaml
```

Adopt current Taiping Guangji and short-story production outputs from the old html-video workspace:

```bash
pnpm story-video adopt taiping ../html-video/workspaces/taiping-shenxian1-guangchengzi --out tmp/adopt-taiping --force
pnpm story-video adopt short-story ../html-video/.html-video/projects/proj_health-report-600a6b --out tmp/adopt-short-story --force
```

See `docs/requirements.md` for the current product scope and supported flows.

## Packages

- `@story-video/core`: story schema, validation, starter project helpers
- `@story-video/providers`: provider interfaces for AI, TTS, music, music libraries, and image generation
- `@story-video/render-ffmpeg`: FFmpeg planning and QA hooks
- `@story-video/runtime`: agent runtime for Codex CLI and DeepSeek-compatible generation
- `@story-video/cli`: local production commands

## Templates

Templates are story-video style packages, not general rendering engines. Each template describes:

- best-fit story types
- visual language
- image prompt rules
- subtitle style
- motion grammar
- audio mood
- provenance and license notes

```bash
pnpm story-video templates
pnpm story-video inspect-template chinese-folk-horror
```

Create your own template:

```bash
pnpm story-video template init my-folk-style --name "My Folk Style" --class story_style
pnpm story-video template validate templates/my-folk-style
```

Use templates from another local directory:

```bash
pnpm story-video config add-template-dir ../my-story-video-templates
pnpm story-video template dirs
pnpm story-video templates
```

Template classes:

- `story_style`: full visual + motion + subtitle + audio style pack
- `scene_layout`: story beat / scene structure pack
- `subtitle_style`: subtitle-only style
- `audio_style`: narration / BGM mood pack
- `publish_pack`: YouTube title, description, tag, disclosure rules

## Music Library and Providers

The open-source repo starts with metadata-only default music presets, not copyrighted audio files.

```bash
pnpm story-video music list
pnpm story-video music search horror
```

Provider interfaces live in `@story-video/providers`, covering:

- AI text generation
- TTS narration
- music generation
- music library catalogs
- image generation

See `docs/requirements.md` for provider boundaries and extension points.

Built-in templates:

- `chinese-folk-horror`
- `classical-zhiguai`

## Agents

The CLI supports both local agent tools and HTTP API agents:

- `codex`: runs `codex exec --skip-git-repo-check` and sends the prompt via stdin
- `deepseek-api`: calls DeepSeek's OpenAI-compatible chat completions API

DeepSeek can be configured with environment variables:

```bash
export DEEPSEEK_API_KEY=...
export DEEPSEEK_MODEL=deepseek-chat
export DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Or persisted locally in `.story-video/config.json`:

```bash
pnpm story-video config set-deepseek --api-key sk-... --model deepseek-chat
pnpm story-video agents
```

## Token-Aware AI

Loeme is planned as a token-aware production tool. AI calls should use local context packs, prompt compiler templates, generation cache, and scene-scoped defaults instead of long chat history.

See `docs/requirements.md` for the current token and batch-production strategy.

## Studio Prototype

The first Studio structure follows the useful parts of `nexu-io/html-video`: projects on the left, preview in the center, inspector/config on the right, and third-party provider settings in a modal.

The design source of truth is `design.md`, based on the `nexu-io/html-video` Studio token and workbench system.

Open the static prototype:

```text
apps/studio/index.html
```

The current Studio workflow, layout, and interaction boundaries are in `docs/requirements.md`.

## Product Requirements

The current source of truth is:

- `docs/requirements.md`: phase 1 scope, Studio layout, CLI capability, provider boundaries, and acceptance criteria.
- `docs/HARNESS.md`: confirmed decision log from user feedback.

## License

MIT. You can use, copy, modify, distribute, sublicense, and sell copies of the software with minimal restriction under the MIT License.

The built-in music library currently contains metadata presets only. Actual music/audio assets should be generated by the user or supplied from a properly licensed source.

## Current Scope

Phase 1 focuses on manually supplied assets:

- `story.yaml` schema
- project folder generation
- validation
- scene card generation from `script.md`
- scene asset import commands
- `publish.json` / `manifest.json` package preparation
- first-pass FFmpeg render command for scene image + narration audio
- QA hooks

Provider integrations for LLM, TTS, and image generation are intentionally separate from the core data model.
