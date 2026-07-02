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

Phase 1 supports the current short-story and Taiping Guangji production flow with a simpler Studio.

The product model is now two-level:

```text
Project / Series
  Long-running content system, for example 老沈短视频 or 太平广记.
  Owns project positioning, default voice, default music, template defaults,
  writing rules, visual rules, output rules, and publish requirements.

Episode / Video
  One concrete video under a project.
  Owns script, chapters, image prompts, image assets, narration assets,
  captions, preview, render output, and publish package.
```

The first usable workflow:

1. Create a project / series from a template or workflow preset.
2. Configure project defaults such as positioning, voice, music, visual style, output rules, and publish requirements.
3. Create an episode under the project.
4. Use episode-scoped chat to write, paste, confirm, or rewrite the script.
5. Split the script into chapters.
6. Review each chapter's title, narration, image prompt, image state, and narration state.
7. Configure episode-level narration and music only when it needs to override project defaults.
8. Generate or import missing image and narration assets.
9. Preview the video.
10. Export MP4 or a local package for that episode.

Image generation and image prompts must inherit the selected template's canvas size and aspect ratio. For example, a vertical folk horror template generates `1080×1920 · 9:16` image tasks, while a long horizontal template generates `1920×1080 · 16:9` image tasks.

Until a real image provider is connected, the Studio treats chapter image generation as local prompt-preview generation: the selected chapter prompt is replaced, the chapter visual preview is refreshed from that prompt, and the chapter list must remain intact.

Phase 1 preview is a chapter-synced local preview. Play / pause, progress seeking, and active chapter switching must work against the episode timeline, but this does not yet imply a full rendered media timeline with real image/audio/subtitle tracks. A later track view can reuse the same playhead and chapter-time model.

The product should feel usable before it becomes fully automatic. Manual confirmation and local files are allowed in Phase 1.

The Studio should not force the user through a rigid wizard. Conversation is the primary control surface: users may define a project, define a template, paste a script, import assets, or ask for chapter planning in any order. The interface should reflect the current state and missing assets rather than enforce a single path.

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

- Local series project model with episodes based on project defaults, `story.yaml` / episode manifests, scripts, chapters, assets, and output manifests.
- Studio with project list, episode list, episode chat, video preview, chapter list, current chapter details, project/episode audio/music configuration, settings modal, and export entry.
- Template selection during project creation.
- Project templates / workflow presets for current real production lines, especially 老沈短视频 and 太平广记.
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

### 5.1 Product Objects

#### Project / Series

A project is a long-running content series, not a single video.

Examples:

- 老沈短视频
- 太平广记
- A future custom narrated story channel

A project owns:

- Project positioning and audience.
- Writing tone and narrative rules.
- Default video template.
- Default voice and TTS provider preference.
- Default BGM / music mood.
- Default image style and prompt rules.
- Default chapter splitting rules.
- Output aspect ratio and publish package expectations.
- Series-level notes, references, and constraints.

#### Episode / Video

An episode is one concrete video under a project.

An episode owns:

- Episode title.
- Source text, pasted script, generated script, or reference link.
- Confirmed script.
- Chapters / storyboard.
- Image prompts.
- Imported or generated images.
- Narration audio.
- Captions.
- Episode-level overrides for voice, music, template, or output.
- Preview state.
- Rendered MP4 and publish package.

#### Template

A template is a starter and style pack. It may provide default project positioning, but the final positioning is copied into the project at creation time and becomes editable project-owned data.

Templates may provide:

- Recommended project positioning.
- Recommended writing and chapter rules.
- Visual style and canvas.
- Subtitle and layout rules.
- Audio / music mood suggestions.
- Output format defaults.

Templates do not remain the single source of truth after project creation. A project inherits and can modify the copied defaults.

Templates can also be refined through conversation. A user should be able to say, for example, "把老沈短视频模板优化得更口语悬疑" or "把太平广记模板调整成长视频叙事", and the Studio should turn that into structured template notes, material requirements, visual rules, audio suggestions, and output rules. If no existing template fits, the Studio may create or fork a new template variant.

#### Workflow Preset

A workflow preset describes how a type of series should be produced.

Phase 1 presets:

- 老沈短视频：short video, fast hook, folk horror / everyday story tone, external image import allowed.
- 太平广记：longer classical zhiguai workflow, chaptered narration, more structured source adaptation.

### 5.2 New Project

The user starts from `+ 新建`.

New project modal:

- Choose template.
- Enter project name.
- Choose workflow preset, for example 老沈短视频, 太平广记, or custom.
- Review or edit copied project defaults.
- Create project.

Template selection is part of creation. The top template control opens the new-project/template modal; it does not switch the current project's template.

Creating a project creates a series-level shell and default rules. It does not create a video episode unless the user explicitly creates the first episode.

Project creation must not preload demo chapters, default images, default narration text, or template sample content into an episode. Script, chapter list, image prompts, generated images, and narration tasks appear only after the user creates an episode and starts generation through episode chat.

Before generated content exists:

- The video preview shows a waiting-for-content state.
- The chapter list shows `0 章 · 等待对话生成`.
- The right chapter panel shows that no chapter is selected yet.

### 5.3 New Episode

Inside a project, the user creates episodes.

Episode creation should support:

- Blank episode.
- Paste source text / script.
- Ask the agent to write a script from an idea.
- Adopt/import an existing production folder.

Each episode has an independent output folder and production state. It inherits project defaults, but can override:

- Video template.
- Voice / voice type.
- Speed, emotion, narration volume.
- BGM and music volume.
- Chapter splitting rule.
- Image style prompt.
- Output title and publish metadata.

### 5.4 Conversation-First Creation

Conversation is not a mandatory step-by-step wizard. It is the user's flexible production interface.

Conversation can operate on:

- Project positioning.
- Template selection and refinement.
- Template creation only when no suitable template exists.
- Episode script drafting or pasted text.
- Chapter planning.
- Image prompt generation.
- Imported material organization.
- Voice/music choices.
- Preview/export instructions.

The chat response should update visible state when possible, but it should also be acceptable for the user to provide assets or decisions out of order.

### 5.5 Project And Episode Chat

Every project has project-level notes and defaults. Every episode has its own production chat thread.

Chat responsibilities:

- Refine the selected template from natural language.
- Create or fork a template only when no existing template fits.
- Define project positioning and production rules.
- Confirm story direction.
- Rewrite script.
- Split or re-split chapters.
- Improve the selected chapter.
- Regenerate image prompt or image.
- Generate chapter narration.
- Change music or narration instructions.
- Organize imported images, audio, captions, music, and reference material.

Chat is the primary operation layer. Avoid duplicating every action as big shortcut buttons in the chat panel.

When the user switches projects:

- The project default rules and episode list change.
- The active episode chat changes to that episode.
- Draft input changes to that episode.
- Current task context follows that project and episode.
- Main preview and chapter details follow the selected episode.

### 5.6 Material Management Flow

Material management is a first-class part of the product.

Material types:

- Source text or references.
- Chapter images.
- Generated image prompts.
- Narration audio.
- Captions/subtitles.
- BGM/music files.
- Cover and publish assets.

Material records should show:

- Preview or filename.
- Type.
- Source, for example imported, generated, external tool, local library.
- Usage target, for example project, episode, chapter, template.
- Status, for example missing, ready, needs review, replaced.
- Path or reference.

The user may choose to generate images inside Loeme later, or generate them in another tool and import them. The Studio should make both flows feel natural.

### 5.7 Chapter Flow

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

### 5.8 Preview Flow

The preview area always shows the current video or selected chapter.

Preview rules:

- The canvas/template defines output size and aspect ratio.
- Export follows the canvas/template spec, not a separate Settings output size.
- Preview controls are minimal: play and pause.
- Additional export or render settings should not crowd the preview stage.

### 5.9 Audio And Music Flow

Audio and Music have two layers:

- Project defaults: the series' default voice, TTS style, BGM mood, and music source.
- Episode overrides: per-video voice/music settings when a specific episode needs a different sound.

Audio and Music are not chapter-level repeated settings.

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
- Project or episode voice.
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
- GitHub link.
- Settings.
- Preview/export button.

Top bar does not contain a project name input. Current project identity is handled by the project list and chat context.

Agent selector supports only:

- Codex CLI.
- DeepSeek API.

### 6.2 Project / Series List

Left sidebar shows:

- `+ 新建`.
- Project / series cards.
- Project delete action with confirmation modal.
- Collapse control.

Project cards show:

- Title.
- Workflow preset / content type.
- Episode count.
- Status.

Project persistence rules:

- Default projects are first-run seed data only.
- User-created projects persist across refresh.
- Deleted projects, including default seed projects, must not reappear after refresh.
- Project deletion also removes the project's local chat thread and draft state.
- The list may be empty; the Studio should show an empty state and guide the user to create a new project.

### 6.3 Episode List

After selecting a project, the Studio must expose the episodes under that project.

The first implementation can show episode cards in the chat pane or production workspace before a dedicated nested sidebar is built.

Episode cards show:

- Episode title.
- Script / chapter / asset / render status.
- Duration if known.
- Last updated time if available.
- Output state, for example draft, ready to render, rendered.

Selecting an episode changes:

- Chat thread.
- Preview.
- Chapter navigation.
- Current content detail.
- Audio/Music override state.

### 6.4 Project And Episode Chat

Chat shows:

- Current task.
- User and assistant messages.
- Input box.
- Compose scope chips if useful, such as script, current chapter, image, music, narration.

Project-level chat can edit project defaults and positioning. Episode-level chat drives script, chapters, image prompts, asset import, narration, preview, and export.

The chat panel can collapse.

### 6.5 Production Workspace

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

### 6.6 Chapter Navigation Panel

Right panel shows the chapter directory for navigation and status review.

- It shows chapter title, time range, image state, and narration state.
- It is used to select the current chapter.
- It can collapse sideways into a narrow rail, not downward.
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

Preferred series project shape:

```text
projects/
  laoshen/
    project.yaml
    project.md
    references/
    episodes/
      2026-07-episode-001/
        episode.yaml
        script.md
        chapters.json
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

`project.yaml` is the series-level source of truth. `episode.yaml` or `story.yaml` is the single episode source of truth. Existing `story.yaml` support should remain for backward compatibility and can map to an episode.

Required `project.yaml` concepts:

- id.
- name.
- workflow preset.
- positioning.
- audience.
- writing rules.
- default template.
- default audio settings.
- default music settings.
- default image style.
- output rules.
- publish rules.
- extension notes.

Required episode concepts:

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
- override settings.

## 10. Template And Extension Model

Templates are style packs and project starters, not render engines.

A template may define:

- Recommended project positioning.
- Recommended project defaults.
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

Template inheritance rule:

- At project creation time, template defaults are copied into the project.
- After creation, the project owns those values.
- Updating a template must not silently change existing project positioning or defaults.
- An episode inherits from the project, then may override settings for that one video.

Template lifecycle rule:

- If an existing template already matches the production type, the user flow should optimize that template instead of creating a new one.
- Template optimization may adjust positioning notes, prompt rules, asset requirements, typography, layout, motion, audio mood, and publish hints.
- When optimization would break an existing stable workflow, the Studio should offer to fork/copy the template into a new variant.
- New template creation is reserved for genuinely new formats that do not fit the current library.

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

- Project and episode files are the source of truth.
- Chat history is not the only context.
- Scene-scoped operations are preferred.
- Whole-story regeneration is explicit.
- Context packs can be generated later from local files.
- Cache generation results where practical.
- Keep prompts short and task-specific.
- Project defaults should be compiled into short context packs so repeated episodes do not resend long positioning documents every time.

This is a product requirement, but token dashboards and advanced cost views are not Phase 1 UI.

## 13. Development Plan

Development should proceed in small visible increments. Each step must have a Studio-visible outcome and a short manual test.

### Milestone 1: Conversation-Editable Project And Template Notes

Goal: use chat to define and optimize the selected project's positioning and template rules without forcing a guided wizard.

Deliverables:

- Add project-level notes for positioning, audience, tone, visual rules, material requirements, and output rules.
- Add selected-template notes that can be refined from chat.
- Existing templates can be optimized; new templates are created only when no current template fits.
- Chat updates should be visible in the project/template summary.

Manual test:

- Select the `老沈短视频` project.
- Ask chat to optimize the current template for a more suspenseful oral-history style.
- Confirm the template notes change without creating a duplicate template.

### Milestone 2: Material Library And Display

Goal: make Loeme useful as the organizer for images, audio, music, references, subtitles, and generated prompts.

Deliverables:

- Add material records with type, source, status, preview/path, and usage target.
- Show material groups for project, episode, and selected chapter.
- Support imported/external assets before internal generation is complete.
- Link chapter images, narration, subtitles, and BGM to visible material records.

Manual test:

- Import or register one external image and one audio file.
- Link the image to a chapter or pending chapter.
- Confirm the material is visible and its status is not lost after refresh.

### Milestone 3: Series Project And Episode Model

Goal: support long-running projects with multiple independently produced episodes.

Deliverables:

- Left sidebar represents long-running projects / series.
- Each project has an episode list.
- Add create/delete project and create/delete episode.
- Each episode has independent chat, script state, chapter state, asset state, and output state.
- Switching episodes switches preview, chat, chapter list, and current content.

Manual test:

- Create `老沈短视频` and `太平广记` as projects.
- Under `老沈短视频`, create two episodes.
- Delete one project and confirm deleted default/demo data does not return after refresh.

### Milestone 4: Chat-Assisted Script And Chapter Planning

Goal: cover the user's current script-first workflow.

Deliverables:

- Paste script or ask agent to write script.
- Confirm script.
- Generate chapter split with title, narration, image prompt, and estimated time.
- Allow the user to decide whether images will be generated inside Loeme or imported from another tool.
- Allow the user to skip script-first flow and start from assets or references.

Manual test:

- Paste a short story draft.
- Generate 3-6 chapters.
- Edit one chapter prompt through chat and confirm only that chapter changes.

### Milestone 5: Audio / Music Defaults And Overrides

Goal: project has defaults; each episode may override.

Deliverables:

- Project-level Audio/Music defaults.
- Episode-level Audio/Music override UI.
- Clear inherited vs overridden state.

Manual test:

- Set project default voice and BGM.
- Override BGM for one episode.
- Confirm another episode still uses the project default.

### Milestone 6: Preview And Export Package

Goal: produce an inspectable local output package before full automation.

Deliverables:

- Preview from current episode data.
- Generate output folder with MP4 placeholder or actual render, manifest, publish metadata, and asset references.
- Clearly mark unsupported provider/render steps as not yet connected.

Manual test:

- Create an episode with script, chapters, one imported image, and one narration asset.
- Run package/export.
- Confirm output folder is isolated under that episode.

## 14. Current Implementation Status

Implemented or started:

- Monorepo skeleton.
- Core story schema and validator.
- Template registry and validation.
- Provider interfaces.
- Codex CLI and DeepSeek runtime detection/invocation layer.
- Music library metadata.
- CLI commands for init, validate, split, import, package, plan, render, adopt.
- Local Studio service at `apps/studio/server.mjs`, serving the workspace and `/api/chat`.
- Studio chat can call Codex CLI or DeepSeek API through the selected Agent.
- Current Studio layout and interaction direction.

Not yet production-ready:

- Series project / episode two-level file model.
- File-backed Studio API.
- Studio actions writing real project files from Agent responses.
- Fully verified MP4 render on this machine.
- Tencent TTS implementation wired into generation flow.
- Image provider implementation.
- Subtitle generation.
- Real batch queue.
- Desktop packaging.

## 15. Acceptance Criteria For First Usable Build

The first usable build is ready when a user can:

1. Create or adopt a series project, such as 老沈短视频 or 太平广记.
2. Create at least one episode under that project.
3. Validate the project and episode data.
4. Confirm or edit the episode script.
5. Split chapters into scene cards.
6. Import or generate image and voice assets.
7. Configure project default voice/BGM and optionally override them per episode.
8. Render a playable MP4 locally or produce a clearly marked export package if render is not yet connected.
9. Produce `manifest.json` and `publish.json` for the episode.
10. Reopen the project in Studio and see the same project, episode, chat, chapter, and asset state.

Minimum command-level acceptance:

```bash
pnpm build
pnpm story-video validate examples/daguchang-ghost-story/story.yaml
pnpm story-video split-scenes examples/daguchang-ghost-story/story.yaml --dry-run
pnpm story-video plan examples/daguchang-ghost-story/story.yaml
```

Minimum Studio acceptance:

- Project list works.
- Project defaults and episode chat are scoped correctly.
- Episode list exists under the selected project.
- New project opens template selection.
- Template button opens new project/template modal.
- Project delete asks for confirmation.
- Video preview is visible.
- Global Audio/Music card is one card and can collapse.
- Middle workspace scrolls as one complete content column.
- Chapter directory lives in the right panel and can collapse.
- Current content detail follows selected chapter in the middle workspace.
- Settings separates Agent, Audio, Music, Template, and Output.

## 16. Cleanup Rules

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
