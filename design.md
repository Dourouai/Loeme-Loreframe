# Loeme Loreframe Design

Status: v0.1  
Date: 2026-06-28  
Reference: `nexu-io/html-video` Studio design system

## 1. Purpose

This file is the portable design spec for Loeme Loreframe. Product UI, Studio prototypes, agent-generated UI, screenshots, and future frontend components should follow this document.

Loeme inherits the useful design language from `nexu-io/html-video`:

- token-first CSS
- warm paper workspace
- dense local-production toolbar
- left project rail
- central preview stage
- scene/frame strip
- right inspector
- settings modal with provider configuration
- template/gallery preview before applying
- provenance and license visibility

Loeme adapts that system for narrated image story production. The main entities are not HTML frames and templates; they are projects, scripts, scene cards, voice, image assets, subtitles, music, QA, and publish packages.

## 2. Product Feel

Loeme is a creative production workbench, not a spooky themed app and not a marketing landing page.

The app chrome should feel:

- local-first
- calm
- precise
- open-source friendly
- production-oriented
- easy to scan for missing assets and review states

The story content can carry emotion inside the preview, template thumbnails, image prompts, and generated media. The surrounding interface stays quiet and professional.

## 3. Source Design Inheritance

From html-video, preserve these patterns:

1. **Top toolbar as command surface**
   Project title, template, agent, model/provider settings, render/export, external links, and settings live in one dense row.

2. **Workspace as fixed panes**
   The app is a full-height viewport with bounded panes. Panes scroll internally; the page itself does not scroll.

3. **Preview first**
   The center preview is the largest visual region. All creation and editing flows should keep the render target visible.

4. **Strip below preview**
   html-video uses a frames strip; Loeme uses a scene strip. The strip is the fast navigation layer.

5. **Right-side inspector**
   Detail editing belongs in an inspector, not scattered across random cards.

6. **Settings modal**
   Provider configuration is grouped into a large modal/drawer with left navigation and a right content panel.

7. **Template preview confirm**
   Users should preview a template/style before applying it. The preview modal shows visual result, source/provenance, license, and a clear primary action.

8. **Agent/status visibility**
   Agent availability, provider configuration, export progress, render status, and missing dependencies should be visible as small operational states.

9. **Near-shadowless paper look**
   Use hairline borders, subtle surfaces, and tiny lifts. Avoid heavy SaaS card shadows.

10. **Design specs are obeyed**
    When a `design.md` or similar spec is attached, agents must treat it as a style and motion contract.

## 4. Loeme-Specific Adaptation

Loeme changes the nouns and workflows:

| html-video | Loeme Loreframe |
|---|---|
| Project | Story project |
| Template | Story style / scene layout / audio style / publish pack |
| Frame | Scene card |
| Content graph | Scene plan / script / review graph |
| HTML preview | Narrated video preview |
| Text fields inspector | Scene / Assets / Publish inspector |
| Export MP4 | Render package |
| Audio settings | Voice, TTS, BGM, music library |

Loeme's center of gravity is scene review:

- Is the narration right?
- Is the scene locked?
- Does it have an image?
- Does it have voice?
- Does it have captions?
- Is it approved?
- Does it need disclosure or wording review?

## 5. Color Tokens

Start from html-video's warm paper + mint accent. Add Loeme domain accents only for content/state, not for the whole shell.

```css
:root {
  --bg: #f6f5f1;
  --bg-panel: #ffffff;
  --bg-subtle: #f0efe9;
  --bg-elevated: #ffffff;

  --text: #1a1a1a;
  --text-muted: #6b6b6b;
  --text-faint: #aaaaaa;

  --accent: #3ce6ac;
  --accent-hover: #2fd49c;
  --accent-soft: #d6f7ec;
  --accent-fg: #0b0b0b;

  --story-accent: #a7362f;
  --story-accent-soft: #f2dcda;
  --story-ink: #274f46;

  --border: #e0dfdb;
  --border-strong: #d0cfc9;

  --green: #16a34a;
  --green-bg: #e3f5e8;
  --blue: #2348b8;
  --blue-bg: #e6ecfb;
  --red: #e5484d;
  --red-bg: #fbe7e7;
  --amber: #b26200;
  --amber-bg: #faedc8;

  --selected: #1a1a1a;
  --selected-fg: #ffffff;

  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --shadow-xs: 0 1px 1px rgba(20, 18, 11, 0.03);
  --shadow-sm: 0 1px 3px rgba(20, 18, 11, 0.05);
  --shadow-md: 0 4px 16px rgba(20, 18, 11, 0.07);
  --shadow-lg: 0 18px 48px rgba(20, 18, 11, 0.14);

  --font-sans: Inter, "Noto Sans SC", -apple-system, "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
  --font-serif: "Source Serif 4", Georgia, "Noto Serif SC", serif;
}
```

Dark mode can follow html-video's ink surface:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0a0a;
    --bg-panel: #141414;
    --bg-subtle: #1c1c1c;
    --bg-elevated: #1c1c1c;

    --text: #f4f4f2;
    --text-muted: #9a9a96;
    --text-faint: #555552;

    --accent: #3ce6ac;
    --accent-hover: #54ecb9;
    --accent-soft: #103a2c;
    --accent-fg: #0b0b0b;

    --border: #2a2a28;
    --border-strong: #3a3a36;
  }
}
```

## 6. Typography

Use:

- Sans: Inter + Noto Sans SC fallback
- Mono: JetBrains Mono
- Serif: Source Serif 4 + Noto Serif SC fallback

Rules:

- Body text: 13 to 14px.
- Toolbar labels: 10 to 11px uppercase mono.
- Project and scene row title: 13px medium.
- Inspector section title: 14 to 16px medium.
- Preview/story content may use larger expressive typography inside the video frame only.
- Do not use viewport-width-based font sizes.
- Letter spacing is 0 for normal text; mono uppercase labels can use 0.08 to 0.14em.

## 7. Layout System

Canonical Studio shell:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top toolbar: brand · project · agent · template · render · settings          │
├──────────────┬────────────────────┬──────────────────────────┬──────────────┤
│ Project /    │ Script / Agent     │ Preview                  │ Inspector    │
│ Scene rail   │ creation pane      │ Scene strip · QA         │ Scene/Assets │
│              │                    │                          │ Publish      │
└──────────────┴────────────────────┴──────────────────────────┴──────────────┘
```

Static prototype may temporarily use three columns, but the target production Studio should support four logical regions:

1. Project or scene rail
2. Script/agent creation pane
3. Preview and scene strip
4. Inspector

Recommended dimensions:

- Toolbar height: 56px.
- Project rail: 200 to 240px.
- Script/agent pane: min 320px.
- Preview pane: largest flexible column.
- Inspector pane: 300 to 380px.
- Settings modal: around 880px wide, 620px high, max 92vw/88vh.

Rules:

- The viewport is fixed-height.
- Panes scroll internally.
- The preview stage must not be squeezed below useful size.
- Collapsing side panes is preferred over compressing all panes.
- No nested cards inside cards.
- Use full-height panels and hairline borders instead of floating dashboard sections.

## 8. Component Inventory

### 8.1 Top Toolbar

Contains:

- brand mark
- project title
- agent selector
- model/provider selector if applicable
- template/style selector
- render/export primary action
- settings icon

Rules:

- Keep it dense and operational.
- Primary action uses `--accent`.
- Settings uses icon button with tooltip/label.
- Provider status should be visible without opening settings.

### 8.2 Project / Scene Rail

Modes:

- Project queue mode
- Scene list mode inside a project

Project rows show:

- title
- status
- duration
- template
- last updated or render state

Scene rows show:

- scene number
- title
- duration
- status badge
- missing asset indicators
- risk marker

Rules:

- Rows are compact.
- Active row uses `--accent-soft`.
- Hover state uses `--bg-subtle`.
- Long titles ellipsize.

### 8.3 Script / Agent Pane

Use this pane for:

- initial prompt/source entry
- agent conversation
- script drafting
- option cards
- script split controls

Rules:

- Agent option cards should look like html-video `hv-options`: subtle panel, full-width stacked choices, optional freeform input.
- User messages can use dark selected bubbles.
- System/progress messages use status backgrounds.
- Never hide the preview while the agent is working.

### 8.4 Preview Stage

Contains:

- video frame
- safe-area overlay if useful
- edit/preview toggle
- optional stamp/status label

Rules:

- Preview is the largest visual element.
- Frame uses stable aspect-ratio.
- 16:9, 9:16, and 1:1 must fit without cropping UI.
- Content-specific drama belongs inside the frame, not the shell.
- The preview stage can use darker neutral background to separate video from paper UI.

### 8.5 Scene Strip

Loeme's scene strip inherits html-video's frames strip.

Each chip shows:

- thumbnail or placeholder
- scene index
- short title
- status
- optional enhance/asset badge

Rules:

- Fixed chip width.
- Active scene has accent outline.
- Missing assets are visible.
- Horizontal scroll is acceptable.
- Scene operations must be scoped to selected scene unless explicitly global.

### 8.6 Inspector

Tabs:

- Script
- Scene
- Assets
- Publish

Rules:

- Use one inspector, not separate floating panels.
- Controls in the inspector must show whether they affect one scene or all scenes.
- Avoid large prose. Use field labels, status rows, and compact controls.

Scene inspector fields:

- title
- narration
- image prompt
- negative prompt
- duration
- motion
- lock text
- approve scene
- risk flags

Assets inspector fields:

- scene image
- narration audio
- captions
- BGM
- thumbnail

Publish inspector fields:

- title
- description
- tags
- disclosure state
- source note

### 8.7 Settings Modal

Use html-video's settings pattern:

- modal shell
- left nav
- right panel
- provider cards
- status dots
- save/test/clear actions

Tabs:

- Agent
- Templates
- Media providers
- Output
- About

Rules:

- Secrets are masked.
- Environment-managed config cannot be accidentally overwritten.
- Test actions show inline result.
- Missing providers show clear setup hints.

### 8.8 Template / Style Gallery

Use html-video's gallery pattern:

- grid cards
- 16:9 preview box
- poster fallback
- name and short description
- selected state
- click opens fullscreen preview modal

Fullscreen preview must show:

- large visual preview
- name
- description
- template class
- provenance
- license
- cancel
- use this template

Template apply should be confirmable if it replaces an existing style.

## 9. Status System

Scene states:

| State | Token |
|---|---|
| `draft` | neutral / `--bg-subtle` |
| `locked_text` | blue / `--blue-bg` |
| `image_ready` | green / `--green-bg` |
| `audio_ready` | green / `--green-bg` |
| `caption_ready` | blue / `--blue-bg` |
| `needs_review` | amber / `--amber-bg` |
| `approved` | green / `--green-bg` |
| `rendered` | selected dark / `--selected` |

Operational states:

- missing provider: faint neutral
- configured provider: green
- render running: blue
- render failed: red
- QA warning: amber
- QA pass: green

Use compact badges. Avoid full-card color fills except for active selection.

## 10. Icon Rules

Use Lucide-style line icons when available.

Icon-only buttons should have:

- 32 to 36px hit target
- 16 to 20px icon
- tooltip or `aria-label`

Expected actions:

- new project: plus
- settings: gear
- render/export: download or play
- lock text: lock
- rewrite: refresh or wand
- generate image: image
- generate voice: mic
- captions: subtitles
- approve: check
- warning: triangle
- missing asset: circle alert

Do not use text-only pills when a familiar icon communicates the action better.

## 11. Motion and Interaction

Motion should be modest:

- hover transitions: 120 to 160ms
- pane collapse: about 180ms
- progress pulse only for active render/generation
- no decorative background blobs
- no heavy animated chrome

Inside the preview video, templates can have richer motion.

For product interaction boundaries, command scope, feedback surfaces, and canvas/output responsibility, follow `docs/requirements.md`.

## 12. Accessibility and Fit

Rules:

- Text must not overflow buttons, tabs, or rows.
- Long project titles and scene names ellipsize.
- Text areas can resize vertically only when it does not break layout.
- All controls need visible focus states.
- Use semantic buttons, labels, and `aria-label` for icon buttons.
- Contrast must remain readable in light and dark mode.
- Do not rely on color alone for critical status.

## 13. Agent-Generated UI Rules

When an agent builds or modifies Loeme UI:

1. Read and follow this `design.md`.
2. Use the tokens above instead of inventing a new palette.
3. Keep app chrome professional and quiet.
4. Put story atmosphere inside preview/template content only.
5. Preserve the Studio shell: toolbar, rail, preview, strip, inspector, settings.
6. Make scope visible for every command: scene-level, story-level, global, render, or publish.
7. Prefer compact controls and status rows over decorative cards.
8. Do not silently introduce a generic SaaS dashboard look.

## 14. Current Studio Prototype

The current `apps/studio` static prototype is the active Studio layout reference for Phase 1.

Current structure:

- Top toolbar uses compact template, Agent, settings, docs, and preview/export controls.
- Left pane shows the project list, create action, delete confirmation, and collapse state.
- Project chat is project-scoped and can collapse.
- Center workspace uses video preview, a collapsible global Audio/Music card, and a collapsible chapter directory.
- Right pane shows the selected chapter detail, image prompt, narration text, and chapter-level actions.
- Settings modal separates Agent, Audio, Music, Template, and Output configuration.
- Status badges and compact row states should remain quiet and operational.
- The next implementation gap is to connect the static UI to file-backed project APIs.

## 15. Implementation Notes

Recommended next steps:

1. Create or refactor `apps/studio/styles.css` around these tokens.
2. Update static HTML class names to match the component inventory.
3. Add status badge classes.
4. Replace symbolic controls with icon-ready button classes.
5. Add scene rail styling.
6. Add settings provider card styling.
7. Verify at desktop and mobile-ish widths.

This design system intentionally stays framework-neutral. A future React/shadcn implementation should preserve the same tokens, layout, and component semantics.

Interaction details live in `docs/requirements.md`. Treat that file as the behavior contract for Studio controls.
