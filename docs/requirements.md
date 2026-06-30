# Loeme Loreframe Requirements

Date: 2026-06-29
Status: current phase 1 source of truth

## 1. Product Positioning

Loeme Loreframe is an open-source, local-first studio for narrated image story videos.

The first useful product is not a general video editor, and not an HTML-video multi-engine layer. It focuses on one repeatable production shape:

```text
story/script -> chapters -> image + narration + captions + music -> MP4 + publish package
```

Primary content types:

- Short folk horror stories.
- Taiping Guangji / classical zhiguai long stories.
- Similar narrated mythology and story channels.

Target channel reference:

```text
https://www.youtube.com/@chinese-folk-ghost-stories/videos
```

## 2. Phase 1 Goal

Phase 1 supports the current short-story and Taiping Guangji production flow with a simpler Studio:

1. Create a project from a template.
2. Use project-scoped chat to confirm or rewrite the script.
3. Split the script into chapters.
4. Review each chapter's title, narration, image prompt, image state, and narration state.
5. Configure global narration and music once per video.
6. Generate or import missing image and narration assets.
7. Preview the video.
8. Export MP4 or a local package.

The product should feel usable before it becomes fully automatic. Manual confirmation and local files are allowed in Phase 1.

## 3. Current Source Of Truth

Keep only two product requirement documents:

- `docs/requirements.md`: current product scope, workflow, UI layout, and technical boundary.
- `docs/HARNESS.md`: confirmed decision log from user feedback.

Design language stays in:

- `design.md`: visual style, component density, and html-video inspired Studio aesthetics.

All old exploratory requirement notes should be merged here or deleted once their useful decisions are captured.

## 3.1 Reference

Loeme Loreframe references Open Design's `html-video` Studio for interaction structure:

- Dense top toolbar.
- Template-aware creation flow.
- Left project rail.
- Center preview-first workbench.
- Right inspector/detail panel.
- Settings modal for Agent and provider configuration.
- Local-first open-source workflow.

Loeme does not copy `html-video`'s product positioning. It is not an HTML-to-video multi-engine layer; it is a narrated image story production tool.

## 4. Product Boundaries

### In Scope

- Local project model based on `story.yaml`, `script.md`, chapters, assets, and manifests.
- Studio with project list, project chat, video preview, chapter list, current chapter details, global audio/music configuration, settings modal, and export entry.
- Template selection during project creation.
- Two built-in template directions:
  - Chinese folk horror short vertical story.
  - Classical zhiguai / Taiping Guangji long story.
- Codex CLI and DeepSeek API as supported agent choices.
- Tencent Cloud TTS configuration as the first cloud narration provider.
- Local music library metadata and BGM selection.
- FFmpeg-based render path for image + narration videos.
- Existing project adoption for current html-video short-story and Taiping outputs.

### Out Of Scope For Phase 1

- CapCut-style timeline editor.
- General-purpose video editing.
- YouTube auto-upload.
- Remote render queue.
- Multi-user collaboration.
- Provider marketplace.
- Complex template visual editor.
- Full desktop packaging.
- Fully autonomous batch publishing.
- Switching the template of an existing project from the top toolbar.

## 5. Core User Workflow

### 5.1 New Project

The user starts from `+ 新建`.

New project modal:

- Choose template.
- Enter project name.
- Choose video type, for example short story or long story.
- Create project.

Template selection is part of creation. The top template control opens the new-project/template modal; it does not switch the current project's template.

Creating a project only creates an empty project shell and its own chat thread. It must not preload demo chapters, default images, default narration text, or template sample content. Script, chapter list, image prompts, generated images, and narration tasks appear only after the user starts generation through the project chat.

Before generated content exists:

- The video preview shows a waiting-for-content state.
- The chapter list shows `0 章 · 等待对话生成`.
- The right chapter panel shows that no chapter is selected yet.

### 5.2 Project Chat

Every project has its own chat thread.

Chat responsibilities:

- Confirm story direction.
- Rewrite script.
- Split or re-split chapters.
- Improve the selected chapter.
- Regenerate image prompt or image.
- Generate chapter narration.
- Change music or narration instructions.

Chat is the primary operation layer. Avoid duplicating every action as big shortcut buttons in the chat panel.

When the user switches projects:

- Chat history changes to that project.
- Draft input changes to that project.
- Current task context follows that project.
- Main preview and chapter details follow that project.

### 5.3 Chapter Flow

After script confirmation, the app creates chapters.

Each chapter has:

- Chapter id.
- Chapter title.
- Time range.
- Narration text.
- Image prompt.
- Image asset state.
- Narration asset state.
- Optional captions state.
- Review state.

The chapter list is for navigation and status review. It should not become an operation-heavy board.

Chapter-level operations belong in the middle current-content detail panel or project chat:

- Optimize text.
- Generate image.
- Generate narration.

### 5.4 Preview Flow

The preview area always shows the current video or selected chapter.

Preview rules:

- The canvas/template defines output size and aspect ratio.
- Export follows the canvas/template spec, not a separate Settings output size.
- Preview controls are minimal: play and pause.
- Additional export or render settings should not crowd the preview stage.

### 5.5 Audio And Music Flow

Audio and Music are global video-level settings, not chapter-level repeated settings.

They live in one card:

```text
全片声音与音乐
  Audio - 全片配音
  Music - 全片配乐
```

Outer card behavior:

- The whole card can collapse.
- Collapsed state only shows the card title, summary, and global status.
- Collapsed state does not show the Audio and Music section rows.

Audio section owns:

- Narration provider.
- Project voice.
- Provider-specific voice type.
- Speed.
- Emotion.
- Narration volume.

Music section owns:

- Music source.
- BGM choice.
- Music mix volume.

Chapter cards only show narration/image state. They do not show BGM controls.

## 6. Studio Layout

The current Studio has four columns:

```text
Project list | Project chat | Production workspace | Chapter navigation
```

### 6.1 Top Bar

Top bar contains:

- Brand.
- Current template button.
- Agent selector.
- Links such as GitHub and Docs.
- Settings.
- Preview/export button.

Top bar does not contain a project name input. Current project identity is handled by the project list and chat context.

Agent selector supports only:

- Codex CLI.
- DeepSeek API.

### 6.2 Project List

Left sidebar shows:

- `+ 新建`.
- Project cards.
- Project delete action with confirmation modal.
- Collapse control.

Project cards show:

- Title.
- Type.
- Duration.
- Status.

Project persistence rules:

- Default projects are first-run seed data only.
- User-created projects persist across refresh.
- Deleted projects, including default seed projects, must not reappear after refresh.
- Project deletion also removes the project's local chat thread and draft state.
- The list may be empty; the Studio should show an empty state and guide the user to create a new project.

### 6.3 Project Chat

Project chat shows:

- Current task.
- User and assistant messages.
- Input box.
- Compose scope chips if useful, such as script, current chapter, image, music, narration.

The chat panel can collapse.

### 6.4 Production Workspace

Middle workspace is a single scrollable content column. It should have one subtle vertical scrollbar and avoid nested scrolling where possible.

Middle workspace order:

1. Video preview.
2. Global Audio/Music card.
3. Current content detail.

Current content detail includes:

- Current selected chapter title.
- Image preview and image prompt.
- Chapter title field.
- Narration text field.
- Chapter actions:
  - Optimize text.
  - Generate image.
  - Generate narration.

### 6.5 Chapter Navigation Panel

Right panel shows the chapter directory for navigation and status review.

- It shows chapter title, time range, image state, and narration state.
- It is used to select the current chapter.
- It can collapse; collapsed state keeps title and summary only.
- It does not show BGM controls or chapter operation buttons.

Global audio and music controls do not live here.

## 7. Settings Modal

Settings is for service connection and system-level configuration. It is not for current project creative choices.

### Agent

Agent settings show:

- Codex CLI status and detection.
- DeepSeek API configuration.

DeepSeek configuration supports:

- API key.
- Base URL.
- Model preset or model id.
- Temperature.
- Save config.
- Test connection.

### Audio

Audio settings show Tencent Cloud TTS connection details:

- SecretId.
- SecretKey.
- Region.

Audio settings do not store default voice or default speed. Those belong to the project Audio section.

### Music

Music settings show music source/library connection:

- Local library or third-party music source.
- Library path or source settings.

Music settings do not store current project BGM or preview volume. Those belong to the project Music section.

### Templates

Template settings can expose template directories and validation later. Phase 1 only needs template selection in new-project flow.

### Output

Output settings should stay minimal. Output dimensions come from the selected template/canvas.

## 8. CLI Current Capability

Current commands to preserve:

```bash
pnpm story-video doctor
pnpm story-video init <id> --title <title>
pnpm story-video validate <story.yaml>
pnpm story-video templates
pnpm story-video inspect-template <id>
pnpm story-video template init <id>
pnpm story-video template validate <path>
pnpm story-video agents
pnpm story-video config show
pnpm story-video config set-deepseek --api-key <key>
pnpm story-video generate-script <story.yaml> --agent codex|deepseek-api
pnpm story-video split-scenes <story.yaml>
pnpm story-video import-image <story.yaml> <scene-id> <path>
pnpm story-video import-voice <story.yaml> <scene-id> <path>
pnpm story-video import-captions <story.yaml> <scene-id> <path>
pnpm story-video music list
pnpm story-video music search <query>
pnpm story-video package <story.yaml>
pnpm story-video plan <story.yaml>
pnpm story-video render <story.yaml>
pnpm story-video adopt taiping <legacy-dir>
pnpm story-video adopt short-story <json-or-dir>
```

Phase 1 Studio should eventually call these commands or equivalent APIs. The current static Studio prototype may simulate behavior until file-backed integration is ready.

## 9. Local Project Structure

Preferred project shape:

```text
project/
  story.yaml
  script.md
  scenes.json
  assets/
    images/
    voice/
    captions/
    music/
  outputs/
    final.mp4
    manifest.json
    publish.json
```

`story.yaml` remains the primary structured project file.

Required `story.yaml` concepts:

- id.
- title.
- type.
- duration.
- aspect ratio.
- language.
- source.
- style.
- scenes.
- publish metadata.

## 10. Template And Extension Model

Templates are style packs, not render engines.

A template may define:

- Visual tone.
- Canvas aspect ratio.
- Typography.
- Subtitle style.
- Image prompt rules.
- Motion grammar.
- Audio mood.
- BGM mood.
- Publish hints.
- License and provenance.

User extensibility:

- Users can add template directories later.
- Template metadata must be validateable.
- Templates cannot store secrets.
- Templates cannot call providers by themselves.

## 11. Providers And Agents

Provider types:

- AI text generation.
- TTS narration.
- Image generation.
- Music generation.
- Music library catalog.

Phase 1 priority:

1. Codex CLI for local file and script tasks.
2. DeepSeek API for text/script/chapter/image prompt tasks.
3. Tencent Cloud TTS for narration.
4. Local music library for BGM metadata.

Provider configuration should be isolated from project creative settings.

## 12. Token And Batch Strategy

The product should reduce token usage by default:

- Project files are the source of truth.
- Chat history is not the only context.
- Scene-scoped operations are preferred.
- Whole-story regeneration is explicit.
- Context packs can be generated later from local files.
- Cache generation results where practical.
- Keep prompts short and task-specific.

This is a product requirement, but token dashboards and advanced cost views are not Phase 1 UI.

## 13. Current Implementation Status

Implemented or started:

- Monorepo skeleton.
- Core story schema and validator.
- Template registry and validation.
- Provider interfaces.
- Codex CLI and DeepSeek runtime detection/invocation layer.
- Music library metadata.
- CLI commands for init, validate, split, import, package, plan, render, adopt.
- Static Studio prototype at `apps/studio/index.html`.
- Current Studio layout and interaction direction.

Not yet production-ready:

- File-backed Studio API.
- Studio actions writing real project files.
- Fully verified MP4 render on this machine.
- Tencent TTS implementation wired into generation flow.
- Image provider implementation.
- Subtitle generation.
- Real batch queue.
- Desktop packaging.

## 14. Acceptance Criteria For First Usable Build

The first usable build is ready when a user can:

1. Create or adopt a project.
2. Validate `story.yaml`.
3. Confirm or edit `script.md`.
4. Split chapters into scene cards.
5. Import or generate image and voice assets.
6. Configure one global voice and one global BGM.
7. Render a playable MP4 locally.
8. Produce `manifest.json` and `publish.json`.
9. Reopen the project in Studio and see the same state.

Minimum command-level acceptance:

```bash
pnpm build
pnpm story-video validate examples/daguchang-ghost-story/story.yaml
pnpm story-video split-scenes examples/daguchang-ghost-story/story.yaml --dry-run
pnpm story-video plan examples/daguchang-ghost-story/story.yaml
```

Minimum Studio acceptance:

- Project list works.
- Project chat is project-scoped.
- New project opens template selection.
- Template button opens new project/template modal.
- Project delete asks for confirmation.
- Video preview is visible.
- Global Audio/Music card is one card and can collapse.
- Middle workspace scrolls as one complete content column.
- Chapter directory lives in the right panel and can collapse.
- Current content detail follows selected chapter in the middle workspace.
- Settings separates Agent, Audio, Music, Template, and Output.

## 15. Cleanup Rules

Delete or avoid adding:

- Historical one-off layout prototypes once the current `apps/studio/index.html` replaces them.
- Duplicate requirement documents that restate this file.
- Generated `dist` and `*.tsbuildinfo` files unless needed for a local run.
- Large generated media in source directories.

Keep:

- Source TypeScript in `packages/*/src`.
- Current Studio source in `apps/studio/index.html`, `app.js`, and `styles.css`.
- `docs/HARNESS.md` as confirmed decision history.
- `design.md` as visual design contract.
