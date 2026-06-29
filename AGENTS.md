# Loeme Loreframe 项目工作区

> 有声故事视频工厂。面向 YouTube 民间怪谈、志怪、神话类频道，批量生成「图片 + 旁白 + 字幕 + 轻动效」的视频发布包。

公开项目名：**Loeme Loreframe**。当前内部工作区和包名暂时仍保留 `story-video-factory` / `@story-video/*`，等 repo 与 npm scope 确认后再统一迁移。

## 角色与边界

- **目标**：从选题 / 古籍原文 / 故事梗概生成可发布的有声图故事视频。
- **优先服务频道**：Chinese folk ghost and monster stories / 民间鬼怪故事。
- **第一阶段形态**：CLI first，先跑通本地批量生产，再做 Studio。
- **不做**：
  - 通用视频编辑器
  - HTML 多引擎 meta-layer
  - CapCut 式时间线精剪
  - 真人 talking head 主线
  - YouTube 自动上传首版

## 产品原则

- 旁白是主时间轴，画面跟随叙事。
- 每条视频必须能追溯来源、素材、provider 与人工审核状态。
- 批量生产不等于低质重复内容；保留人工选题、审稿和发布确认。
- 对「真实怪谈」类标题保持克制，避免把 AI 编造故事包装成确证真实事件。
- Studio / UI 设计以根目录 `design.md` 为准，继承 `nexu-io/html-video` 的 token-first 工作台体系。

## 技术路线

- monorepo：pnpm workspace
- core：schema、manifest、pipeline primitives
- providers：AI / TTS / music / image provider interface + registry
- render-ffmpeg：FFmpeg 合成与 QA
- runtime：agent runtime，支持 Codex CLI 与 DeepSeek API
- cli：命令行入口

## 模板风格

本项目的 template 是故事视频风格包，不是渲染 engine 模板。

每个模板目录：

```text
templates/<id>/
  template.story-video.yaml
  README.md
```

模板 metadata 必须包含：

- `tags` / `best_for` / `not_for`：给 agent 检索
- `visual`：画面、字体、色调、图片 prompt 规则
- `motion`：推拉、转场、颗粒、暗角等轻动效
- `subtitles`：字幕位置、字号、颜色、关键词高亮
- `audio`：旁白与 BGM 氛围
- `provenance`：来源与版权说明

## 本地命令

```bash
pnpm install
pnpm build
pnpm story-video doctor
pnpm story-video agents
pnpm story-video templates
pnpm story-video template init my-folk-style --class story_style
pnpm story-video template validate templates/my-folk-style
pnpm story-video music list
pnpm story-video validate examples/daguchang-ghost-story/story.yaml
pnpm story-video split-scenes examples/daguchang-ghost-story/story.yaml --dry-run
pnpm story-video plan examples/daguchang-ghost-story/story.yaml
```

## Agent 配置

DeepSeek API：

```bash
export DEEPSEEK_API_KEY=...
export DEEPSEEK_MODEL=deepseek-chat
export DEEPSEEK_BASE_URL=https://api.deepseek.com
```

也可以写入本地 `.story-video/config.json`：

```bash
pnpm story-video config set-deepseek --api-key sk-... --model deepseek-chat
```

Codex CLI：

```bash
pnpm story-video agents
pnpm story-video generate-script examples/daguchang-ghost-story/story.yaml --agent codex
```

## 写操作守则

- 不要自动上传 YouTube。
- 不要自动 push / publish / release，除非 Joey 明确要求。
- 公开 README / 对外定位改动前先确认。
- 大体积生成物放到 `outputs/` 或 `workspaces/`，不要默认进 git。
