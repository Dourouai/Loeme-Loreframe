---
name: story-video-factory
description: Create narrated image story videos from topics, public-domain texts, scripts, scene images, narration audio, and style templates.
---

# Story Video Factory Skill

Use this skill when the user wants to create, revise, batch-generate, or QA narrated image videos for folk tales, ghost stories, myths, zhiguai, or similar YouTube story channels.

## Core Concepts

- `story.yaml` is the source of truth for one video.
- Templates are style packs under `templates/<id>/template.story-video.yaml`.
- The main timeline follows narration audio.
- Generated files should stay editable before final render.
- Do not present AI-written fiction as verified real events.

## Useful Commands

```bash
pnpm story-video doctor
pnpm story-video agents
pnpm story-video templates
pnpm story-video inspect-template chinese-folk-horror
pnpm story-video validate examples/daguchang-ghost-story/story.yaml
pnpm story-video generate-script examples/daguchang-ghost-story/story.yaml --agent deepseek-api
```

## Workflow

1. Validate `story.yaml`.
2. Pick the closest template using `tags`, `best_for`, and `not_for`.
3. Generate or revise `script.md`.
4. Split the story into scenes.
5. Prepare images and narration audio.
6. Render with FFmpeg.
7. Run QA before publishing.

## Style Rules

- For rural folk horror, keep images restrained, dark, and scene-specific.
- For classical zhiguai, keep the tone literary and old-book-like.
- Subtitles must remain readable and inside the safe area.
- Avoid random modern objects in historical scenes.

