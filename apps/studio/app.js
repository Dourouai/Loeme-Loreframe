const PROJECTS_STORAGE_KEY = "loeme.projects.v1";
const PROJECT_THREADS_STORAGE_KEY = "loeme.projectThreads.v1";
const ACTIVE_PROJECT_STORAGE_KEY = "loeme.activeProjectId.v1";

const defaultProjects = [
  {
    id: "daguchang",
    title: "零几年农村真实怪谈：打谷场",
    type: "短故事",
    status: "制作中",
    duration: "4:04",
    chapters: "4 / 8",
    template: "folk"
  },
  {
    id: "taiping-guangchengzi",
    title: "太平广记：广成子",
    type: "长视频",
    status: "脚本稿",
    duration: "17:18",
    chapters: "10 / 10",
    template: "taiping"
  },
  {
    id: "health-report",
    title: "体检报告出来后",
    type: "短故事",
    status: "可导出",
    duration: "0:38",
    chapters: "10 / 10",
    template: "quote"
  }
];

const defaultProjectThreads = {
  daguchang: {
    composeMode: "image",
    draft: "",
    messages: [
      {
        role: "assistant",
        title: "当前任务",
        text: "已经选中《零几年农村真实怪谈：打谷场》。你可以确认文案、重分章节、补图片或生成配音。"
      },
      {
        role: "user",
        title: "你",
        text: "把草垛后的笑声这一章图片做得更压抑一点。"
      },
      {
        role: "assistant",
        title: "任务已排队",
        text: "我会重写当前章节图片 Prompt，并只重生成 CH-02 的画面。"
      }
    ]
  },
  "taiping-guangchengzi": {
    composeMode: "script",
    draft: "",
    messages: [
      {
        role: "assistant",
        title: "当前任务",
        text: "《太平广记：广成子》还在脚本稿阶段。建议先确认故事主线，再按长视频节奏拆分章节。"
      },
      {
        role: "user",
        title: "你",
        text: "先把这篇整理成适合长视频的分章结构。"
      },
      {
        role: "assistant",
        title: "任务已排队",
        text: "我会保留志怪原文气质，整理成可旁白的章节大纲。"
      }
    ]
  },
  "health-report": {
    composeMode: "voice",
    draft: "",
    messages: [
      {
        role: "assistant",
        title: "当前任务",
        text: "《体检报告出来后》已接近可导出。现在重点是确认配音、配乐和最终预览。"
      },
      {
        role: "user",
        title: "你",
        text: "先检查这条短故事的配音节奏。"
      },
      {
        role: "assistant",
        title: "任务已排队",
        text: "我会按全片 Audio 配置复核每章配音状态。"
      }
    ]
  }
};

const templates = [
  {
    id: "folk",
    title: "民间怪谈竖屏",
    subtitle: "低饱和夜景、底部字幕、安全恐怖感",
    canvas: "1080×1920 · 9:16",
    tags: ["shorts", "folk", "horror"],
    thumb: "folk"
  },
  {
    id: "taiping",
    title: "太平广记长卷",
    subtitle: "横版古籍叙事，适合长视频章节",
    canvas: "1920×1080 · 16:9",
    tags: ["longform", "zhiguai", "scroll"],
    thumb: "taiping"
  },
  {
    id: "quote",
    title: "有声图语录",
    subtitle: "单图慢推、中心文字、适合短故事金句",
    canvas: "1080×1920 · 9:16",
    tags: ["quote", "voice", "image"],
    thumb: "quote"
  }
];

function templateCanvasSpec(templateId = activeTemplate) {
  const template = templates.find((item) => item.id === templateId) || templates[0];
  const resolution = template.canvas.match(/\d+\s*×\s*\d+/)?.[0]?.replace(/\s/g, "") || "1080×1920";
  const aspectRatio = template.canvas.match(/\d+\s*:\s*\d+/)?.[0]?.replace(/\s/g, "") || "9:16";
  const [width, height] = resolution.split("×").map((value) => Number(value) || 0);
  return {
    resolution,
    aspectRatio,
    width,
    height,
    label: `${resolution} · ${aspectRatio}`,
    templateTitle: template.title
  };
}

const templateLooks = {
  folk: {
    kicker: "民间怪谈",
    summary: "民间怪谈竖屏 · 1080×1920 · 9:16",
    accent: "#d7b66d",
    background: "linear-gradient(155deg, #2b2722 0%, #151412 56%, #060606 100%)"
  },
  taiping: {
    kicker: "太平广记",
    summary: "太平广记长卷 · 1920×1080 · 16:9",
    accent: "#caa56b",
    background: "linear-gradient(155deg, #2c261d 0%, #17120d 58%, #060605 100%)"
  },
  quote: {
    kicker: "有声图",
    summary: "有声图语录 · 1080×1920 · 9:16",
    accent: "#d9a78b",
    background: "linear-gradient(155deg, #2a1c18 0%, #130d0c 56%, #050505 100%)"
  }
};

const demoChapters = [
  {
    id: "ch-01",
    title: "村口打谷场",
    time: "00:00-00:18",
    imageState: "图片已生成",
    voiceState: "配音已生成",
    musicCue: "Low Drone 01",
    voice: "腾讯云 · 云希",
    text: "村口那片空地，白天热闹，夜里却没人敢靠近。",
    prompt: "零几年中国农村夜晚，空荡打谷场，远处老槐树，昏黄月光，中式民俗恐怖，低饱和，远景。",
    thumb: "field",
    state: "ready"
  },
  {
    id: "ch-02",
    title: "草垛后的笑声",
    time: "00:18-00:40",
    imageState: "图片待复核",
    voiceState: "等待配音",
    musicCue: "Low Drone 01",
    voice: "腾讯云 · 云希",
    text: "老张的妻子抱着孩子，从打谷场旁边经过时，忽然听见草垛后面传来一阵笑声。",
    prompt: "农村女人抱着孩子走夜路，草垛阴影里似乎有人影，悬疑气氛，不露正脸，电影感。",
    thumb: "straw",
    state: "active"
  },
  {
    id: "ch-03",
    title: "没有眼睛的孩子",
    time: "00:40-01:08",
    imageState: "缺图片",
    voiceState: "等待配音",
    musicCue: "Low Drone 01",
    voice: "腾讯云 · 云希",
    text: "她回头看了一眼，只看见两个孩子站在草垛边，脸上黑洞洞的，看不清眼睛。",
    prompt: "草垛旁两个模糊孩子身影，远景，低饱和，脸部保持暗影，民俗恐怖，禁止血腥。",
    thumb: "kids",
    state: "warning"
  },
  {
    id: "ch-04",
    title: "第二天的真相",
    time: "03:32-04:04",
    imageState: "提示词草稿",
    voiceState: "未生成",
    musicCue: "Empty Field",
    voice: "腾讯云 · 云希",
    text: "第二天，村民在草堆下面翻出的东西，让全村人再也不敢半夜经过那里。",
    prompt: "清晨农村打谷场，村民围在草堆旁，压抑纪实感，悬疑结尾，避免直接展示恐怖主体。",
    thumb: "morning",
    state: "draft"
  }
];

const composeModes = {
  script: {
    label: "文案",
    placeholder: "确认文案、压缩成短视频旁白，或重新生成开头悬念。",
    queued: "文案修改已排队",
    done: "文案草稿已更新"
  },
  chapter: {
    label: "当前章",
    placeholder: "只改当前章节：重写旁白、改标题、调整时长。",
    queued: "当前章节修改已排队",
    done: "当前章节已更新"
  },
  image: {
    label: "图片",
    placeholder: "修改当前章节图片：换画面主体、统一风格、补提示词。",
    queued: "图片任务已排队",
    done: "图片提示词已更新"
  },
  music: {
    label: "音乐",
    placeholder: "描述音乐：更压抑、更空旷、去掉鼓点、音量降低。",
    queued: "音乐修改已排队",
    done: "音乐方案已更新"
  },
  voice: {
    label: "配音",
    placeholder: "描述配音：换音色、放慢语速、降低情绪。",
    queued: "配音任务已排队",
    done: "配音设置已更新"
  }
};

const deepseekModelPresets = [
  {
    value: "deepseek-chat",
    label: "deepseek-chat · 日常创作",
    hint: "文案确认、章节拆分、图片 Prompt 改写"
  },
  {
    value: "deepseek-reasoner",
    label: "deepseek-reasoner · 复杂规划",
    hint: "长文结构、复杂分章、批量改写决策"
  }
];

function resolveDeepseekPreset(model) {
  const value = model || "deepseek-chat";
  return deepseekModelPresets.some((preset) => preset.value === value) ? value : "custom";
}

function renderDeepseekModelOptions(model) {
  const selected = resolveDeepseekPreset(model);
  return deepseekModelPresets.map((preset) => `<option value="${preset.value}"${selectedAttr(selected, preset.value)}>${preset.label}</option>`).join("") + `<option value="custom"${selectedAttr(selected, "custom")}>自定义模型 / 网关模型</option>`;
}

function deepseekModelHint(model) {
  const preset = deepseekModelPresets.find((item) => item.value === resolveDeepseekPreset(model));
  return preset ? preset.hint : "用于兼容 DeepSeek 网关、代理服务或未来模型别名。";
}

function deepseekCustomModelValue(model) {
  return resolveDeepseekPreset(model) === "custom" ? model : "";
}

const providerConfigs = {
  deepseek: loadProviderConfig("loeme.deepseek.config"),
  tencentTts: loadProviderConfig("loeme.tencentTts.config"),
  music: loadProviderConfig("loeme.music.config")
};

const settingsTemplates = {
  agents: () => `
    <div class="settings-panel">
      <h3 class="section-title">Agent</h3>
      <div class="provider-grid integration-list">
        <div class="provider-card selected"><div class="provider-icon">CX</div><div><strong>Codex CLI</strong><span>本地项目、脚本、渲染、文件写入</span></div><span class="status-badge ready">ready</span><button type="button" data-config-action="test-codex">检测</button></div>
        <section class="integration-card" data-config-provider="deepseek">
          <div class="integration-head">
            <div class="provider-icon">DS</div>
            <div><strong>DeepSeek API</strong><span>用于文案、分章、提示词和改写任务</span></div>
            <span class="status-badge ${providerStatus(providerConfigs.deepseek, ["apiKey", "model"]).className}">${providerStatus(providerConfigs.deepseek, ["apiKey", "model"]).label}</span>
          </div>
          <div class="settings-form-grid deepseek-config-grid">
            <label class="field"><span>API Key</span><input type="password" data-config-field="apiKey" placeholder="sk-..." value="${escapeAttr(providerConfigs.deepseek.apiKey)}" /></label>
            <label class="field"><span>Base URL</span><input data-config-field="baseUrl" value="${escapeAttr(providerConfigs.deepseek.baseUrl || "https://api.deepseek.com")}" /></label>
            <label class="field"><span>模型预设</span><select data-config-field="modelPreset">${renderDeepseekModelOptions(providerConfigs.deepseek.model)}</select></label>
            <label class="field"><span>自定义模型</span><input data-config-field="model" placeholder="选择自定义时填写" value="${escapeAttr(deepseekCustomModelValue(providerConfigs.deepseek.model))}" /></label>
            <label class="field"><span>Temperature</span><input data-config-field="temperature" value="${escapeAttr(providerConfigs.deepseek.temperature || "0.7")}" /></label>
          </div>
          <div class="config-note">当前预设：${deepseekModelHint(providerConfigs.deepseek.model)}。配置会保存到当前浏览器本地，用于后续接入后端任务调用。</div>
          <div class="action-row">
            <button type="button" data-config-action="save-deepseek">保存配置</button>
            <button type="button" data-config-action="test-deepseek">检测连接</button>
          </div>
        </section>
      </div>
    </div>
  `,
  audio: () => `
    <div class="settings-panel">
      <h3 class="section-title">Audio</h3>
      <div class="provider-grid integration-list">
        <section class="integration-card" data-config-provider="tencent">
          <div class="integration-head">
            <div class="provider-icon">TX</div>
            <div><strong>腾讯云 TTS</strong><span>只配置接入凭据；音色、语速和音量跟随项目选择</span></div>
            <span class="status-badge ${providerStatus(providerConfigs.tencentTts, ["secretId", "secretKey"]).className}">${providerStatus(providerConfigs.tencentTts, ["secretId", "secretKey"]).label}</span>
          </div>
          <div class="settings-form-grid">
            <label class="field"><span>SecretId</span><input data-config-field="secretId" placeholder="AKID..." value="${escapeAttr(providerConfigs.tencentTts.secretId)}" /></label>
            <label class="field"><span>SecretKey</span><input type="password" data-config-field="secretKey" placeholder="Tencent Cloud SecretKey" value="${escapeAttr(providerConfigs.tencentTts.secretKey)}" /></label>
            <label class="field"><span>Region</span><input data-config-field="region" value="${escapeAttr(providerConfigs.tencentTts.region || "ap-guangzhou")}" /></label>
          </div>
          <div class="config-note">音色、语速、情绪和旁白音量属于项目级声音方案，在工作区或项目设置中选择，不写入默认接入配置。</div>
          <div class="action-row">
            <button type="button" data-config-action="save-tencent">保存 Audio 配置</button>
            <button type="button" data-config-action="test-tencent">检测连接</button>
          </div>
        </section>
      </div>
    </div>
  `,
  music: () => `
    <div class="settings-panel">
      <h3 class="section-title">Music</h3>
      <div class="provider-grid integration-list">
        <section class="integration-card" data-config-provider="music">
          <div class="integration-head">
            <div class="provider-icon">MU</div>
            <div><strong>音乐库接入</strong><span>只配置音乐资产来源，BGM 和音量跟随项目</span></div>
            <span class="status-badge ready">local</span>
          </div>
          <div class="settings-form-grid">
            <label class="field"><span>Library source</span><select data-config-field="librarySource"><option value="local"${selectedAttr(providerConfigs.music.librarySource || "local", "local")}>Local library</option><option value="third-party"${selectedAttr(providerConfigs.music.librarySource, "third-party")}>Third-party connector</option><option value="ai-draft"${selectedAttr(providerConfigs.music.librarySource, "ai-draft")}>AI music draft</option></select></label>
            <label class="field"><span>Library path</span><input data-config-field="libraryPath" value="${escapeAttr(providerConfigs.music.libraryPath || "assets/music")}" /></label>
          </div>
          <div class="config-note">Settings 的 Music 只负责音乐库接入；当前视频使用哪个 BGM、试听音量和混音音量，都在项目工作台的 Music 段里选择。</div>
          <div class="action-row">
            <button type="button" data-config-action="save-music">保存 Music 配置</button>
            <button type="button" data-config-action="open-music">打开音乐库</button>
          </div>
        </section>
      </div>
    </div>
  `,
  templates: `
    <div class="settings-panel">
      <h3 class="section-title">模板</h3>
      <div class="inherit-card"><div><strong>模板只在新建项目时选择</strong><span>进入工作台后不直接展示模板区。</span></div><span class="status-badge ready">clean</span></div>
    </div>
  `,
  output: `
    <div class="settings-panel">
      <h3 class="section-title">输出</h3>
      <label class="field"><span>Export directory</span><input value="projects/daguchang/renders" /></label>
      <label class="field"><span>Render engine</span><input value="ffmpeg · image + voice + burned captions" /></label>
    </div>
  `
};

const voiceLabels = {
  yunxi: "云希 · 悬疑男声",
  yunmu: "云沐 · 温和男声",
  yunye: "云叶 · 叙事女声"
};

const videoAudioDefaults = {
  language: "中文旁白",
  bgm: "Low Drone 01"
};

function currentVideoVoiceLabel() {
  return voiceLabels[providerConfigs.tencentTts.voice] || voiceLabels.yunxi;
}

function currentVideoBgmLabel() {
  return videoAudioDefaults.bgm;
}

const agentOptions = {
  codex: {
    label: "Codex CLI",
    status: "ready",
    avatar: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.25 5.25 5.95 8l-2.7 2.75"/><path d="M7.15 10.75h5.1"/></svg>`,
    tone: "codex",
    toast: ["Codex CLI 已选择", "本地项目、脚本和渲染任务会走 Codex。"]
  },
  deepseek: {
    label: "DeepSeek API",
    status: "config needed",
    avatar: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2h3.2c2.6 0 4.4 1.55 4.4 3.8s-1.8 3.8-4.4 3.8H4.2z"/><path d="M4.2 4.2v7.6"/><path d="M8.95 6.25c.52-.62 1.2-.92 2.02-.92.82 0 1.48.24 2.02.72"/></svg>`,
    tone: "deepseek",
    toast: ["DeepSeek API 已选择", "文案、分章和提示词任务会走 API 配置。"]
  }
};

let activeProjectId = "daguchang";
let activeTemplate = "folk";
let activeChapterIndex = 1;
let activeComposeMode = "script";
let selectedNewTemplate = "folk";
let currentSettingsTab = "agents";
let selectedAgent = "codex";
let globalConfigCollapsed = false;
let audioPanelCollapsed = false;
let musicPanelCollapsed = false;
let chapterPanelCollapsed = false;
let chatCollapsed = false;
let projectCollapsed = false;
let pendingDeleteProjectId = null;
let chatRequestInFlight = false;
let previewTimeSec = 0;
let previewPlaying = false;
let previewTimerId = null;
let previewScrubbing = false;
let previewStatusText = "ready";

let projects = loadProjects();
let projectThreads = loadProjectThreads(projects);
activeProjectId = resolveInitialActiveProjectId();
activeTemplate = currentProject()?.template || activeTemplate;

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJsonStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeProject(project) {
  if (!project || typeof project !== "object" || !project.id) return null;
  const template = templates.some((item) => item.id === project.template) ? project.template : "folk";
  const id = String(project.id);
  const isDefaultProject = defaultProjects.some((item) => item.id === id);
  const contentStatus = project.contentStatus === "generated" || isDefaultProject ? "generated" : "empty";
  const chapterList = Array.isArray(project.chaptersData) ? project.chaptersData.map(normalizeChapter).filter(Boolean) : [];
  const hasStoredChapters = chapterList.length > 0;
  return {
    id,
    title: String(project.title || "未命名项目"),
    type: String(project.type || "短故事"),
    status: String(project.status || "草稿"),
    duration: String(project.duration || "0:00"),
    chapters: String(project.chapters || "0 / 0"),
    template,
    contentStatus,
    chaptersData: contentStatus === "generated" && (!isDefaultProject || hasStoredChapters) ? chapterList : []
  };
}

function normalizeChapter(chapter, index) {
  if (!chapter || typeof chapter !== "object") return null;
  const id = String(chapter.id || `ch-${String(index + 1).padStart(2, "0")}`);
  return {
    id,
    title: String(chapter.title || "未命名章节"),
    time: String(chapter.time || "00:00-00:00"),
    imageState: String(chapter.imageState || "待生成图片"),
    voiceState: String(chapter.voiceState || "待生成配音"),
    musicCue: String(chapter.musicCue || "Low Drone 01"),
    voice: String(chapter.voice || "腾讯云 · 云希"),
    text: String(chapter.text || ""),
    prompt: String(chapter.prompt || ""),
    thumb: String(chapter.thumb || "field"),
    state: String(chapter.state || "draft")
  };
}

function normalizeGeneratedChapter(chapter, index) {
  const normalized = normalizeChapter({
    ...chapter,
    id: chapter.id || `ch-${String(index + 1).padStart(2, "0")}`,
    time: chapter.time || defaultChapterTime(index),
    imageState: chapter.imageState || "图片待生成",
    voiceState: chapter.voiceState || "等待配音",
    thumb: chapter.thumb || generatedThumb(index),
    state: index === 0 ? "active" : "draft"
  }, index);
  return normalized && (normalized.title || normalized.text || normalized.prompt) ? normalized : null;
}

function defaultChapterTime(index) {
  const start = index * 18;
  return `${secondsToTime(start)}-${secondsToTime(start + 18)}`;
}

function generatedThumb(index) {
  return ["field", "straw", "kids", "morning"][index % 4];
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function chapterVisualBackground(chapter, look = templateLooks[activeTemplate] || templateLooks.folk) {
  const text = `${chapter?.title || ""} ${chapter?.text || ""} ${chapter?.prompt || ""}`.toLowerCase();
  const seed = hashString(text);
  const lightX = 18 + (seed % 65);
  const lightY = 12 + ((seed >> 5) % 34);
  const base = chapterVisualPalette(text, look);
  const motif = chapterVisualMotif(text, seed);
  const atmosphere = /雨|rain|storm|湿|mud|泥|水/.test(text)
    ? "repeating-linear-gradient(104deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 9px)"
    : /纸|paper|lantern|灯笼|符|香|烛/.test(text)
      ? "repeating-linear-gradient(0deg, rgba(245,222,176,0.055) 0 2px, transparent 2px 20px)"
      : "radial-gradient(ellipse at 35% 48%, rgba(255,255,255,0.035), transparent 32%)";
  return [
    "linear-gradient(180deg, rgba(18,16,14,0.1), rgba(18,16,14,0.94))",
    atmosphere,
    motif,
    `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(236,207,140,0.42), transparent 15%)`,
    `linear-gradient(155deg, ${base.top} 0%, ${base.mid} 55%, ${base.bottom} 100%)`
  ].join(", ");
}

function chapterVisualPalette(text, look) {
  if (/雨|rain|湿|泥|水|河|井/.test(text)) return { top: "#273037", mid: "#15191a", bottom: "#060707" };
  if (/灯|lamp|lantern|烛|火|oil/.test(text)) return { top: "#3b2d1c", mid: "#1a1510", bottom: "#060504" };
  if (/纸|paper|白|丧|灵|grave|坟/.test(text)) return { top: "#2e2b25", mid: "#171512", bottom: "#060605" };
  if (/树|forest|林|槐|柳|wood|木/.test(text)) return { top: "#273024", mid: "#121711", bottom: "#050605" };
  if (/庙|temple|神|祠|院|门/.test(text)) return { top: "#32261b", mid: "#17100b", bottom: "#050403" };
  return {
    top: look?.background?.match(/#[0-9a-f]{6}/i)?.[0] || "#2b2722",
    mid: "#151412",
    bottom: "#060606"
  };
}

function chapterVisualMotif(text, seed) {
  const x = 26 + (seed % 46);
  if (/木匣|box|匣|柜|桌|counter/.test(text)) {
    return [
      `linear-gradient(90deg, transparent 0 ${Math.max(22, x - 18)}%, rgba(70,42,22,0.72) ${Math.max(24, x - 16)}% ${Math.min(82, x + 18)}%, transparent ${Math.min(84, x + 20)}% 100%)`,
      "linear-gradient(0deg, transparent 0 58%, rgba(10,7,5,0.52) 59% 74%, transparent 75% 100%)"
    ].join(", ");
  }
  if (/女|girl|woman|孩子|child|人影|figure|影/.test(text)) {
    return `radial-gradient(ellipse at ${x}% 72%, rgba(0,0,0,0.72) 0 7%, transparent 8%)`;
  }
  if (/门|door|院|屋|room|house/.test(text)) {
    return `linear-gradient(90deg, transparent 0 ${x - 7}%, rgba(0,0,0,0.58) ${x - 6}% ${x + 8}%, transparent ${x + 9}% 100%)`;
  }
  if (/树|tree|forest|林|槐|柳/.test(text)) {
    return [
      `linear-gradient(90deg, transparent 0 ${x - 2}%, rgba(0,0,0,0.58) ${x - 1}% ${x + 2}%, transparent ${x + 3}% 100%)`,
      `radial-gradient(ellipse at ${x}% 56%, rgba(0,0,0,0.5) 0 10%, transparent 11%)`
    ].join(", ");
  }
  if (/纸|paper|灯笼|lantern/.test(text)) {
    return "linear-gradient(90deg, transparent 0 18%, rgba(231,211,167,0.09) 19% 28%, transparent 29% 44%, rgba(231,211,167,0.08) 45% 54%, transparent 55% 100%)";
  }
  return `radial-gradient(ellipse at ${x}% 70%, rgba(0,0,0,0.45) 0 12%, transparent 13%)`;
}

function chapterVisualStyleAttr(chapter) {
  return `style="${escapeAttr(`background: ${chapterVisualBackground(chapter)};`)}"`;
}

function chapterVisualLabel(chapter) {
  const text = `${chapter?.title || ""} ${chapter?.text || ""} ${chapter?.prompt || ""}`.toLowerCase();
  const labels = [];
  if (/木匣|box|匣/.test(text)) labels.push("木匣");
  if (/灯|lamp|lantern|烛|oil/.test(text)) labels.push("灯火");
  if (/雨|rain|湿|泥|水/.test(text)) labels.push("雨夜");
  if (/纸|paper|灯笼|符|香/.test(text)) labels.push("纸铺");
  if (/女|girl|woman/.test(text)) labels.push("女子");
  if (/孩子|child/.test(text)) labels.push("孩子");
  if (/树|tree|forest|林|槐|柳/.test(text)) labels.push("树影");
  if (/庙|temple|神|祠/.test(text)) labels.push("古庙");
  if (/门|door|屋|room|house/.test(text)) labels.push("门屋");
  return labels.slice(0, 3).join(" · ") || "Prompt 预览";
}

function secondsToTime(totalSeconds) {
  const normalizedSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(normalizedSeconds / 60);
  const seconds = normalizedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function extractGeneratedChapters(reply = "") {
  return extractChaptersFromJson(reply) || extractChaptersFromMarkdownTable(reply) || extractChaptersFromMarkdownSections(reply) || [];
}

function extractChaptersFromJson(reply = "") {
  const blocks = [...reply.matchAll(/```(?:json)?[^\n]*(?:loeme-chapters|chapters)[^\n]*\n([\s\S]*?)```/gi)]
    .map((match) => match[1].trim());
  const genericJsonBlocks = [...reply.matchAll(/```json[^\n]*\n([\s\S]*?)```/gi)].map((match) => match[1].trim());
  for (const block of [...blocks, ...genericJsonBlocks]) {
    try {
      const parsed = JSON.parse(block);
      const chapters = Array.isArray(parsed) ? parsed : Array.isArray(parsed.chapters) ? parsed.chapters : null;
      if (!chapters) continue;
      const normalized = chapters.map(normalizeGeneratedChapter).filter(Boolean);
      if (normalized.length) return normalized;
    } catch {
      // Continue to Markdown fallbacks.
    }
  }
  return null;
}

function extractChaptersFromMarkdownTable(reply = "") {
  const lines = String(reply).replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isMarkdownTableRow(lines[index]) || !isMarkdownTableDivider(lines[index + 1])) continue;
    const headers = splitMarkdownTableRow(lines[index]).map((cell) => cell.toLowerCase());
    const titleIndex = findHeaderIndex(headers, ["标题", "章节", "title", "chapter"]);
    const textIndex = findHeaderIndex(headers, ["旁白", "文案", "narration", "text"]);
    const promptIndex = findHeaderIndex(headers, ["prompt", "提示词", "画面", "图片"]);
    const timeIndex = findHeaderIndex(headers, ["时间", "time", "时长"]);
    if (titleIndex < 0 || textIndex < 0) continue;

    const chapters = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isMarkdownTableRow(lines[rowIndex]) && lines[rowIndex].trim()) {
      const cells = splitMarkdownTableRow(lines[rowIndex]);
      chapters.push({
        title: cells[titleIndex] || `章节 ${chapters.length + 1}`,
        text: cells[textIndex] || "",
        prompt: promptIndex >= 0 ? cells[promptIndex] || "" : "",
        time: timeIndex >= 0 ? cells[timeIndex] || "" : ""
      });
      rowIndex += 1;
    }
    const normalized = chapters.map(normalizeGeneratedChapter).filter(Boolean);
    if (normalized.length) return normalized;
  }
  return null;
}

function findHeaderIndex(headers, keywords) {
  return headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword.toLowerCase())));
}

function extractChaptersFromMarkdownSections(reply = "") {
  const text = String(reply).replace(/\r\n/g, "\n");
  const sectionPattern = /(?:^|\n)(?:#{1,4}\s*)?(?:(?:CH|Scene|Chapter)[-\s]?(\d+)|第\s*([\d一二三四五六七八九十]+)\s*[章节]|(\d+)[.、])\s*(?:[：:·\-]\s*)?([^\n]*)\n([\s\S]*?)(?=\n(?:#{1,4}\s*)?(?:(?:CH|Scene|Chapter)[-\s]?\d+|第\s*[\d一二三四五六七八九十]+\s*[章节]|\d+[.、])|$)/gi;
  const chapters = [];
  for (const match of text.matchAll(sectionPattern)) {
    const body = match[5] || "";
    const title = cleanMarkdownLabel(match[4]) || captureField(body, ["标题", "章节标题", "title"]) || `章节 ${chapters.length + 1}`;
    const chapterText = captureField(body, ["旁白", "旁白文案", "文案", "narration", "text"]) || firstMeaningfulLine(body);
    const prompt = captureField(body, ["图片 Prompt", "图片提示词", "Prompt", "画面", "图片"]);
    const time = captureField(body, ["时间", "Time", "时长"]);
    if (!chapterText && !prompt) continue;
    chapters.push({ title, text: chapterText, prompt, time });
  }
  const normalized = chapters.map(normalizeGeneratedChapter).filter(Boolean);
  return normalized.length ? normalized : null;
}

function captureField(body, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s*[：:]\\s*([^\\n]+)`, "i");
    const match = body.match(pattern);
    if (match) return cleanMarkdownLabel(match[1]);
  }
  return "";
}

function firstMeaningfulLine(body) {
  const line = body.split("\n").map(cleanMarkdownLabel).find((item) => item && !/^(时间|图片|prompt|标题)\s*[：:]/i.test(item));
  return line || "";
}

function cleanMarkdownLabel(value = "") {
  return String(value).replace(/^[-*\s]+/, "").replace(/\*\*/g, "").replace(/`/g, "").trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function loadProjects() {
  const stored = readJsonStorage(PROJECTS_STORAGE_KEY, null);
  if (!Array.isArray(stored)) return cloneData(defaultProjects);
  return stored.map(normalizeProject).filter(Boolean);
}

function normalizeThread(thread, project) {
  if (!thread || typeof thread !== "object") return createProjectThread(project);
  const messages = Array.isArray(thread.messages) ? thread.messages : [];
  return {
    composeMode: composeModes[thread.composeMode] ? thread.composeMode : "script",
    draft: String(thread.draft || ""),
    messages: messages.map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      title: String(message.title || (message.role === "user" ? "你" : "任务")),
      text: String(message.text || "")
    }))
  };
}

function loadProjectThreads(projectList) {
  const stored = readJsonStorage(PROJECT_THREADS_STORAGE_KEY, null);
  const source = stored && typeof stored === "object" ? stored : cloneData(defaultProjectThreads);
  return projectList.reduce((threads, project) => {
    threads[project.id] = normalizeThread(source[project.id], project);
    return threads;
  }, {});
}

function resolveInitialActiveProjectId() {
  const storedId = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
  if (projects.some((project) => project.id === storedId)) return storedId;
  return projects[0]?.id || null;
}

function persistProjectState() {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  window.localStorage.setItem(PROJECT_THREADS_STORAGE_KEY, JSON.stringify(projectThreads));
  if (activeProjectId) {
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId);
  } else {
    window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
  }
}

function renderWorkspaceState() {
  syncTopbarControls();
  renderProjects();
  restoreCurrentThreadState();
  renderChapters();
  updatePreview();
  renderInspector();
}

function currentProject() {
  return projects.find((project) => project.id === activeProjectId) || null;
}

function currentProjectChapters() {
  const project = currentProject();
  if (!project) return [];
  if (Array.isArray(project.chaptersData) && project.chaptersData.length) return project.chaptersData;
  if (defaultProjects.some((item) => item.id === project.id)) return demoChapters;
  return [];
}

function ensureEditableProjectChapters() {
  const project = currentProject();
  if (!project) return [];
  if (!Array.isArray(project.chaptersData) || !project.chaptersData.length) {
    const source = defaultProjects.some((item) => item.id === project.id) ? demoChapters : currentProjectChapters();
    project.chaptersData = source.map((chapter, index) => normalizeChapter(cloneData(chapter), index)).filter(Boolean);
    if (project.chaptersData.length) {
      project.contentStatus = "generated";
      project.chapters = `${project.chaptersData.length} / ${project.chaptersData.length}`;
    }
  }
  return project.chaptersData || [];
}

function selectedEditableChapter() {
  const chapters = ensureEditableProjectChapters();
  if (!chapters.length) return null;
  activeChapterIndex = Math.max(0, Math.min(activeChapterIndex, chapters.length - 1));
  return chapters[activeChapterIndex];
}

function createProjectThread(project) {
  return {
    composeMode: "script",
    draft: "",
    messages: [
      {
        role: "assistant",
        title: "当前任务",
        text: "已创建《" + project.title + "》。先从文案确认开始，也可以直接粘贴故事素材或参考链接。"
      }
    ]
  };
}

function currentThread() {
  const project = currentProject();
  if (!project) {
    return {
      composeMode: "script",
      draft: "",
      messages: [
        {
          role: "assistant",
          title: "当前任务",
          text: "还没有项目。点击左侧“+ 新建”选择模板后开始创作。"
        }
      ]
    };
  }
  if (!projectThreads[project.id]) projectThreads[project.id] = createProjectThread(project);
  return projectThreads[project.id];
}

function saveCurrentThreadState() {
  if (!currentProject()) return;
  const input = document.querySelector("#prompt-input");
  const thread = currentThread();
  thread.composeMode = activeComposeMode;
  if (input) thread.draft = input.value;
  persistProjectState();
}

function restoreCurrentThreadState() {
  const thread = currentThread();
  activeComposeMode = thread.composeMode || "script";
  renderConversation();
  setComposeMode(activeComposeMode, { silent: true });
  const input = document.querySelector("#prompt-input");
  if (input) input.value = thread.draft || "";
}

function switchProject(projectId, options = {}) {
  const nextProject = projects.find((project) => project.id === projectId);
  if (!nextProject || (nextProject.id === activeProjectId && !options.force)) return;
  saveCurrentThreadState();
  activeProjectId = nextProject.id;
  activeTemplate = nextProject.template;
  activeChapterIndex = 0;
  resetPreviewPlayback();
  persistProjectState();
  syncTopbarControls();
  renderProjects();
  updatePreview();
  restoreCurrentThreadState();
  renderInspector();
  if (!options.silent) showToast("项目已切换", nextProject.title, "ok");
}

function renderProjects() {
  const list = document.querySelector("#project-list");
  if (!projects.length) {
    list.innerHTML = `
      <div class="project-empty-state">
        <strong>还没有项目</strong>
        <span>点击“+ 新建”选择模板后开始。</span>
      </div>
    `;
    return;
  }
  list.innerHTML = projects.map((project) => `
    <article class="project-row ${project.id === activeProjectId ? "active" : ""}" data-project-row="${escapeAttr(project.id)}">
      <button class="project-open" type="button" data-project="${escapeAttr(project.id)}">
        <strong>${escapeHtml(project.title)}</strong>
        <span>${escapeHtml(project.type)} · ${escapeHtml(project.duration)} · ${escapeHtml(project.status)}</span>
      </button>
      <button class="project-delete" type="button" data-delete-project="${escapeAttr(project.id)}" aria-label="删除项目 ${escapeAttr(project.title)}" title="删除项目">×</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", () => switchProject(button.dataset.project));
  });
  list.querySelectorAll("[data-delete-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openDeleteProjectModal(button.dataset.deleteProject);
    });
  });
}

function openDeleteProjectModal(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  pendingDeleteProjectId = projectId;
  const modal = document.querySelector("#delete-project-modal");
  const name = document.querySelector("#delete-project-name");
  if (name) name.textContent = "《" + project.title + "》";
  if (modal) modal.hidden = false;
}

function closeDeleteProjectModal() {
  pendingDeleteProjectId = null;
  const modal = document.querySelector("#delete-project-modal");
  if (modal) modal.hidden = true;
}

function confirmDeleteProject() {
  if (!pendingDeleteProjectId) return;
  const index = projects.findIndex((project) => project.id === pendingDeleteProjectId);
  if (index < 0) {
    closeDeleteProjectModal();
    return;
  }
  const [removed] = projects.splice(index, 1);
  delete projectThreads[removed.id];
  const deletedActiveProject = removed.id === activeProjectId;
  closeDeleteProjectModal();

  if (deletedActiveProject) {
    const nextProject = projects[Math.min(index, projects.length - 1)] || null;
    activeProjectId = nextProject?.id || null;
    activeTemplate = nextProject?.template || selectedNewTemplate;
    activeChapterIndex = 0;
    resetPreviewPlayback();
    persistProjectState();
    renderWorkspaceState();
  } else {
    persistProjectState();
    renderProjects();
  }
  showToast("项目已删除", removed.title, "work");
}

function renderConversation() {
  const list = document.querySelector("#chat-messages");
  const thread = currentThread();
  const messages = thread.messages || [];
  list.innerHTML = messages.map((message) => `
    <article class="chat-message ${escapeAttr(message.role)}">
      <strong class="chat-message-title">${escapeHtml(message.title)}</strong>
      <div class="chat-message-body">${renderMarkdown(displayMessageText(message))}</div>
    </article>
  `).join("");
  list.scrollTop = list.scrollHeight;
}

function displayMessageText(message) {
  if (!message || message.role !== "assistant") return message?.text || "";
  return String(message.text || "").replace(/\n{4,}/g, "\n\n\n").trim();
}

function renderNewProjectTemplates() {
  const grid = document.querySelector("#new-template-grid");
  grid.innerHTML = templates.map((template) => `
    <button class="template-card ${template.id === selectedNewTemplate ? "active" : ""}" type="button" data-new-template="${template.id}">
      <div class="template-thumb ${template.thumb}">
        <span>${template.canvas}</span>
      </div>
      <div class="template-copy">
        <strong>${template.title}</strong>
        <p>${template.subtitle}</p>
        <div>${template.tags.map((tag) => `<small>${tag}</small>`).join("")}</div>
      </div>
    </button>
  `).join("");

  grid.querySelectorAll("[data-new-template]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedNewTemplate = button.dataset.newTemplate;
      renderNewProjectTemplates();
      renderNewProjectPreview();
    });
  });
  renderNewProjectPreview();
}

function renderNewProjectPreview() {
  const template = templates.find((item) => item.id === selectedNewTemplate);
  const look = templateLooks[selectedNewTemplate];
  document.querySelector("#new-project-template-summary").textContent = look.summary;
  document.querySelector("#new-project-preview").innerHTML = `
    <div class="template-thumb ${template.thumb}">
      <span>${template.canvas}</span>
    </div>
    <div>
      <strong>${template.title}</strong>
      <span>${template.subtitle}</span>
    </div>
  `;
}

function renderChapters() {
  const list = document.querySelector("#chapter-list");
  const summary = document.querySelector("#chapter-summary");
  const project = currentProject();
  if (!project) {
    if (summary) summary.textContent = "0 章 · 等待新建项目";
    list.innerHTML = `
      <div class="content-empty-state">
        <strong>暂无章节</strong>
        <span>新建项目后，分章目录会显示在这里。</span>
      </div>
    `;
    return;
  }
  const projectChapters = currentProjectChapters();
  if (!projectChapters.length) {
    if (summary) summary.textContent = "0 章 · 等待对话生成";
    list.innerHTML = `
      <div class="content-empty-state project-content-empty">
        <strong>等待对话生成章节</strong>
        <span>在左侧对话中粘贴故事、文案或参考链接，生成后这里会出现分镜目录、图片状态和配音状态。</span>
      </div>
    `;
    return;
  }
  activeChapterIndex = Math.max(0, Math.min(activeChapterIndex, projectChapters.length - 1));
  if (summary) {
    const missingImages = projectChapters.filter((chapter) => /缺|待/.test(chapter.imageState)).length;
    const pendingVoice = projectChapters.filter((chapter) => /待|未/.test(chapter.voiceState)).length;
    summary.textContent = `${projectChapters.length} 章 · ${missingImages} 张图待处理 · ${pendingVoice} 段配音待生成`;
  }
  list.innerHTML = projectChapters.map((chapter, index) => `
    <article class="chapter-card ${index === activeChapterIndex ? "active" : ""} ${chapter.state}">
      <button class="chapter-open" type="button" data-chapter="${index}">
        <div class="chapter-thumb ${chapter.thumb}" ${chapterVisualStyleAttr(chapter)}><span>${String(index + 1).padStart(2, "0")}</span></div>
        <div class="chapter-copy">
          <div class="chapter-title-row">
            <strong>${chapter.title}</strong>
            <small>${chapter.time}</small>
          </div>
          <p>${chapter.text}</p>
          <div class="chapter-meta">
            <span>${chapter.imageState}</span>
            <span>${chapter.voiceState}</span>
          </div>
        </div>
      </button>
    </article>
  `).join("");

  list.querySelectorAll("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () => setActiveChapter(Number(button.dataset.chapter)));
  });
}

function setActiveChapter(index, options = {}) {
  const projectChapters = currentProjectChapters();
  if (!currentProject() || !projectChapters.length) return;
  activeChapterIndex = Math.max(0, Math.min(projectChapters.length - 1, index));
  if (!options.preserveTime) {
    previewTimeSec = chapterStartSec(projectChapters[activeChapterIndex]);
    previewStatusText = previewPlaying ? previewStatusText : "paused";
  }
  renderChapters();
  updatePreview({ preserveTime: true });
  renderInspector();
  syncPreviewTimeline();
}

function updatePreview(options = {}) {
  const project = currentProject();
  const look = templateLooks[activeTemplate] || templateLooks.folk;
  applyCanvasRatio(activeTemplate);
  if (!project) {
    document.querySelector("#preview-kicker").textContent = "Loeme Loreframe";
    document.querySelector("#preview-title").textContent = "新建项目开始";
    document.querySelector("#preview-subtitle").textContent = "选择模板后，通过项目对话确认文案、分章、图片和配音。";
    document.querySelector("#subtitle-line").textContent = "左侧点击“+ 新建”，创建第一个短故事或太平广记项目。";
    document.querySelector("#preview-meta").textContent = "No project";
    resetPreviewPlayback();
    document.querySelector(".scene-art").style.background = `
      linear-gradient(180deg, rgba(18, 16, 14, 0.12), rgba(18, 16, 14, 0.96)),
      ${templateLooks[selectedNewTemplate]?.background || templateLooks.folk.background}
    `;
    document.querySelector("#preview-kicker").style.color = templateLooks[selectedNewTemplate]?.accent || templateLooks.folk.accent;
    document.querySelector("#inspector-title").textContent = "未选择项目";
    return;
  }
  const projectChapters = currentProjectChapters();
  if (!projectChapters.length) {
    document.querySelector("#preview-kicker").textContent = `${look.kicker} · Draft`;
    document.querySelector("#preview-title").textContent = "等待生成内容";
    document.querySelector("#preview-subtitle").textContent = "通过左侧对话确认故事文案后，再自动分章、生成图片 Prompt 和配音任务。";
    document.querySelector("#subtitle-line").textContent = "先输入故事梗概、原文、YouTube 参考链接，或直接说“帮我生成一个民间怪谈短视频”。";
    document.querySelector("#preview-meta").textContent = "No chapters";
    resetPreviewPlayback();
    document.querySelector(".scene-art").style.background = `
      linear-gradient(180deg, rgba(18, 16, 14, 0.12), rgba(18, 16, 14, 0.96)),
      ${look.background}
    `;
    document.querySelector("#preview-kicker").style.color = look.accent;
    document.querySelector("#inspector-title").textContent = "等待生成";
    return;
  }
  activeChapterIndex = Math.max(0, Math.min(activeChapterIndex, projectChapters.length - 1));
  const chapter = projectChapters[activeChapterIndex];
  const chapterStart = chapterStartSec(chapter);
  const chapterEnd = chapterEndSec(chapter);
  if (!options.preserveTime && (previewTimeSec < chapterStart || previewTimeSec > chapterEnd)) {
    previewTimeSec = chapterStart;
  }
  document.querySelector("#preview-kicker").textContent = `${look.kicker} · ${chapter.id.toUpperCase()}`;
  document.querySelector("#preview-title").textContent = chapter.title;
  document.querySelector("#preview-subtitle").textContent = chapter.prompt;
  document.querySelector("#subtitle-line").textContent = chapter.text;
  document.querySelector("#preview-meta").textContent = `${chapter.id.toUpperCase()} · ${chapter.time}`;
  syncPreviewTimeline();
  syncPreviewPlaybackUi();
  document.querySelector(".scene-art").style.background = chapterVisualBackground(chapter, look);
  document.querySelector("#preview-kicker").style.color = look.accent;
  document.querySelector("#inspector-title").textContent = `${chapter.id.toUpperCase()} · ${chapter.title}`;
}

function applyCanvasRatio(templateId = activeTemplate) {
  const canvas = templateCanvasSpec(templateId);
  const isLandscape = canvas.width > canvas.height;
  const frame = document.querySelector(".video-frame");
  const panel = document.querySelector(".preview-panel");
  if (frame) {
    frame.style.setProperty("--canvas-aspect", `${canvas.width || 9} / ${canvas.height || 16}`);
    frame.classList.toggle("canvas-landscape", isLandscape);
    frame.classList.toggle("canvas-portrait", !isLandscape);
  }
  if (panel) {
    panel.classList.toggle("canvas-landscape", isLandscape);
    panel.classList.toggle("canvas-portrait", !isLandscape);
  }
}

function chapterTimeParts(chapter) {
  const [start = "00:00", end = "00:00"] = String(chapter?.time || "").split("-");
  return { start, end };
}

function chapterStartSec(chapter) {
  return timeToSeconds(chapterTimeParts(chapter).start || "00:00");
}

function chapterEndSec(chapter) {
  const start = chapterStartSec(chapter);
  const end = timeToSeconds(chapterTimeParts(chapter).end || "00:00");
  return Math.max(start + 1, end);
}

function currentProjectDurationSec() {
  const projectChapters = currentProjectChapters();
  if (!projectChapters.length) return 0;
  return Math.max(...projectChapters.map(chapterEndSec), 0);
}

function clampPreviewTime(seconds) {
  const totalSec = currentProjectDurationSec();
  if (!totalSec) return 0;
  return Math.max(0, Math.min(Number(seconds) || 0, totalSec));
}

function chapterIndexAtTime(seconds) {
  const projectChapters = currentProjectChapters();
  if (!projectChapters.length) return -1;
  const time = clampPreviewTime(seconds);
  const index = projectChapters.findIndex((chapter) => time >= chapterStartSec(chapter) && time < chapterEndSec(chapter));
  if (index >= 0) return index;
  return time >= chapterEndSec(projectChapters[projectChapters.length - 1]) ? projectChapters.length - 1 : 0;
}

function setPreviewTime(seconds, options = {}) {
  const projectChapters = currentProjectChapters();
  if (!currentProject() || !projectChapters.length) {
    resetPreviewPlayback();
    return;
  }
  previewTimeSec = clampPreviewTime(seconds);
  const nextIndex = chapterIndexAtTime(previewTimeSec);
  if (nextIndex >= 0 && nextIndex !== activeChapterIndex) {
    setActiveChapter(nextIndex, { preserveTime: true });
    return;
  }
  if (!options.skipUi) syncPreviewTimeline();
}

function startPreviewPlayback() {
  const projectChapters = currentProjectChapters();
  if (!currentProject() || !projectChapters.length) {
    showToast("暂无可播放内容", "先通过对话生成文案、分章和图片", "work");
    return;
  }
  const totalSec = currentProjectDurationSec();
  if (!totalSec) {
    showToast("暂无可播放内容", "当前项目还没有有效时间线", "work");
    return;
  }
  if (previewTimeSec <= 0 || previewTimeSec >= totalSec) {
    previewTimeSec = chapterStartSec(projectChapters[activeChapterIndex] || projectChapters[0]);
  }
  stopPreviewTimer();
  previewPlaying = true;
  syncPreviewPlaybackUi("ready");
  syncPreviewTimeline();
  previewTimerId = window.setInterval(() => {
    const total = currentProjectDurationSec();
    const nextTime = previewTimeSec + 0.25;
    if (!total || nextTime >= total) {
      setPreviewTime(total || 0);
      pausePreviewPlayback({ status: "ready", silent: true });
      showToast("预览结束", "已到达视频末尾", "ok");
      return;
    }
    setPreviewTime(nextTime);
  }, 250);
  showToast("开始播放", projectChapters[activeChapterIndex].title, "ok");
}

function pausePreviewPlayback(options = {}) {
  const projectChapters = currentProjectChapters();
  if (!options.silent && (!currentProject() || !projectChapters.length)) {
    showToast("暂无可暂停内容", "先通过对话生成章节", "work");
    return;
  }
  stopPreviewTimer();
  previewPlaying = false;
  syncPreviewPlaybackUi(options.status || "paused");
  syncPreviewTimeline();
  if (!options.silent && projectChapters.length) {
    showToast("已暂停", projectChapters[activeChapterIndex]?.title || "当前章节", "work");
  }
}

function resetPreviewPlayback() {
  stopPreviewTimer();
  previewPlaying = false;
  previewTimeSec = 0;
  syncPreviewPlaybackUi("ready");
  syncPreviewTimeline();
}

function stopPreviewTimer() {
  if (previewTimerId) {
    window.clearInterval(previewTimerId);
    previewTimerId = null;
  }
}

function syncPreviewPlaybackUi(statusText) {
  if (statusText) previewStatusText = statusText;
  const badge = document.querySelector("#preview-status");
  if (badge) {
    badge.className = previewPlaying ? "status-badge warning" : "status-badge ready";
    badge.textContent = previewPlaying ? "playing" : previewStatusText;
  }
  const actions = document.querySelector(".playback-actions");
  if (actions) actions.classList.toggle("is-playing", previewPlaying);
}

function syncPreviewTimeline() {
  const totalSec = currentProjectDurationSec();
  previewTimeSec = clampPreviewTime(previewTimeSec);
  const progress = totalSec ? Math.max(0, Math.min(1, previewTimeSec / totalSec)) : 0;
  const currentNode = document.querySelector("#player-current-time");
  const durationNode = document.querySelector("#player-duration");
  const progressNode = document.querySelector("#preview-progress");
  const trackNode = document.querySelector("#player-track");
  if (currentNode) currentNode.textContent = secondsToTime(previewTimeSec);
  if (durationNode) durationNode.textContent = secondsToTime(totalSec);
  if (progressNode) progressNode.style.width = `${Math.round(progress * 1000) / 10}%`;
  if (trackNode) {
    trackNode.setAttribute("aria-valuemax", String(Math.floor(totalSec)));
    trackNode.setAttribute("aria-valuenow", String(Math.floor(previewTimeSec)));
    trackNode.setAttribute("aria-valuetext", `${secondsToTime(previewTimeSec)} / ${secondsToTime(totalSec)}`);
  }
}

function seekPreviewFromPointer(event) {
  const track = document.querySelector("#player-track");
  const totalSec = currentProjectDurationSec();
  if (!track || !totalSec) return;
  const rect = track.getBoundingClientRect();
  const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
  setPreviewTime(Math.max(0, Math.min(1, ratio)) * totalSec);
  if (!previewPlaying) syncPreviewPlaybackUi("paused");
}

function seekPreviewByStep(stepSeconds) {
  const totalSec = currentProjectDurationSec();
  if (!totalSec) return;
  setPreviewTime(previewTimeSec + stepSeconds);
  if (!previewPlaying) syncPreviewPlaybackUi("paused");
}

function timeToSeconds(value) {
  const parts = value.split(":").map((part) => Number(part) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

function buildInspectorAgentInstruction(action, chapter) {
  const project = currentProject();
  const template = templates.find((item) => item.id === activeTemplate) || templates[0];
  const canvas = templateCanvasSpec(activeTemplate);
  const chapterLabel = `${chapter.id.toUpperCase()}「${chapter.title}」`;
  if (action === "image") {
    return [
      "[loeme-task:image-prompt]",
      `为当前章节 ${chapterLabel} 生成图片提示词，并准备图片生成任务。`,
      `必须严格跟随当前模板「${template.title}」的画布规格：${canvas.resolution}，比例 ${canvas.aspectRatio}。不要改成其他尺寸或比例。`,
      `项目：${project?.title || "未命名项目"}`,
      `章节时间：${chapter.time}`,
      `旁白文案：${chapter.text || "暂无"}`,
      `已有图片 Prompt：${chapter.prompt || "暂无"}`,
      "请只输出一版可直接用于生图工具的最终 Prompt，包含主体、场景、镜头、光线、风格、负面约束和尺寸说明；如果当前还没有真实图片 provider，请不要声称已经生成图片文件，不要输出章节 JSON 或新的章节目录。"
    ].join("\n");
  }
  if (action === "voice") {
    return [
      `为当前章节 ${chapterLabel} 生成配音任务。`,
      `全片默认音色：${currentVideoVoiceLabel()}；配乐：${currentVideoBgmLabel()}。`,
      `旁白文案：${chapter.text || "暂无"}`,
      "请检查这段旁白是否适合当前音色，并给出配音生成建议；如果还没有真实 TTS 文件，请不要声称已经生成音频文件。"
    ].join("\n");
  }
  return [
    `优化当前章节 ${chapterLabel} 的文案。`,
    `当前模板：${template.title}（${canvas.label}）`,
    `章节标题：${chapter.title}`,
    `旁白文案：${chapter.text || "暂无"}`,
    "请保留故事信息，优化成更适合短视频旁白的版本，并给出可同步更新的图片 Prompt。"
  ].join("\n");
}

function handleInspectorAction(action) {
  if (action === "open") {
    showToast("素材管理待接入", "后续会打开当前章节素材目录", "work");
    return;
  }
  if (chatRequestInFlight) {
    showToast("Agent 正在回复", "等当前任务完成后再生成", "work");
    return;
  }
  const chapter = selectedEditableChapter();
  if (!chapter) {
    showToast("还没有章节", "先通过左侧对话生成分镜目录", "work");
    return;
  }
  const mode = action === "voice" ? "voice" : action === "image" ? "image" : "chapter";
  const instruction = buildInspectorAgentInstruction(action, chapter);
  if (action === "image") {
    chapter.imageState = "本地预览生成中";
    chapter.state = "active";
  } else if (action === "voice") {
    chapter.voiceState = "配音任务已排队";
  } else {
    chapter.state = "active";
  }
  setComposeMode(mode, { silent: true });
  const input = document.querySelector("#prompt-input");
  const thread = currentThread();
  if (input) input.value = instruction;
  thread.draft = instruction;
  thread.composeMode = mode;
  persistProjectState();
  renderProjects();
  renderChapters();
  updatePreview();
  renderInspector();
  showToast(action === "image" ? "图片生成任务已发送" : "任务已发送", chapter.title, "work");
  void submitPrompt();
}

function renderInspector() {
  const project = currentProject();
  if (!project) {
    document.querySelector("#inspector-title").textContent = "未选择项目";
    document.querySelector("#inspector-content").innerHTML = `
      <section class="inspector-block chapter-detail-block">
        <div class="block-title-row">
          <div>
            <div class="section-kicker">项目</div>
            <strong>等待新建</strong>
          </div>
          <span class="status-badge warning">empty</span>
        </div>
        <p class="empty-copy">左侧点击“+ 新建”选择模板后，当前章节的图文、图片 Prompt 和配音操作会显示在这里。</p>
      </section>
    `;
    return;
  }
  const projectChapters = currentProjectChapters();
  if (!projectChapters.length) {
    document.querySelector("#inspector-title").textContent = "等待生成";
    document.querySelector("#inspector-content").innerHTML = `
      <section class="inspector-block chapter-detail-block">
        <div class="block-title-row">
          <div>
            <div class="section-kicker">项目内容</div>
            <strong>还没有章节</strong>
          </div>
          <span class="status-badge warning">draft</span>
        </div>
        <p class="empty-copy">这个项目还没有通过对话生成文案和分镜。先在左侧输入故事方向或粘贴素材，生成后这里会显示选中章节的图片、Prompt、标题和旁白。</p>
      </section>
    `;
    return;
  }
  activeChapterIndex = Math.max(0, Math.min(activeChapterIndex, projectChapters.length - 1));
  const chapter = projectChapters[activeChapterIndex];
  const canvas = templateCanvasSpec(activeTemplate);
  const canvasClass = canvas.width > canvas.height ? "canvas-landscape" : "canvas-portrait";
  document.querySelector("#inspector-title").textContent = `${chapter.id.toUpperCase()} · ${chapter.title}`;
  document.querySelector("#inspector-content").innerHTML = `
    <section class="inspector-block chapter-detail-block">
      <div class="block-title-row">
        <div>
          <div class="section-kicker">章节内容</div>
          <strong>画面与文案</strong>
        </div>
        <span class="status-badge warning">${chapter.imageState}</span>
      </div>
      <p class="empty-copy">图片尺寸跟随模板：${canvas.label}</p>
      <div class="asset-preview ${chapter.thumb} ${canvasClass}" ${chapterVisualStyleAttr(chapter)}><span>${chapter.imageState}</span><em>${chapterVisualLabel(chapter)}</em></div>
      <label class="field"><span>图片 Prompt</span><textarea rows="5">${chapter.prompt}</textarea></label>
      <div class="action-row">
        <button type="button" data-inspector-action="image">图片生成</button>
        <button type="button" data-inspector-action="open">打开素材</button>
      </div>
      <div class="detail-divider"></div>
      <label class="field"><span>章节标题</span><input value="${chapter.title}" /></label>
      <label class="field"><span>旁白文案</span><textarea rows="5">${chapter.text}</textarea></label>
      <div class="action-row">
        <button type="button" data-inspector-action="rewrite">优化文案</button>
        <button type="button" data-inspector-action="voice">配音生成</button>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-inspector-action]").forEach((button) => {
    button.addEventListener("click", () => handleInspectorAction(button.dataset.inspectorAction));
  });
}

function setAudioPanelCollapsed(collapsed) {
  audioPanelCollapsed = collapsed;
  const panel = document.querySelector("#global-audio-panel");
  const detail = document.querySelector("#global-audio-detail");
  const toggle = document.querySelector("#audio-panel-toggle");
  const caret = document.querySelector("#audio-panel-caret");
  if (!panel || !detail || !toggle) return;
  panel.classList.toggle("is-collapsed", collapsed);
  detail.hidden = collapsed;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  if (caret) caret.textContent = collapsed ? "⌄" : "⌃";
}

function setGlobalConfigCollapsed(collapsed) {
  globalConfigCollapsed = collapsed;
  const production = document.querySelector(".production-pane");
  const stack = document.querySelector(".global-config-stack");
  const body = document.querySelector(".global-config-body");
  const toggle = document.querySelector("#global-config-toggle");
  const caret = document.querySelector("#global-config-caret");
  if (!production || !stack || !body || !toggle) return;
  production.classList.toggle("sound-collapsed", collapsed);
  stack.classList.toggle("is-collapsed", collapsed);
  body.hidden = collapsed;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.title = collapsed ? "展开全片声音与音乐" : "收起全片声音与音乐";
  if (caret) caret.textContent = collapsed ? "⌄" : "⌃";
  if (!collapsed) {
    setAudioPanelCollapsed(false);
    setMusicPanelCollapsed(false);
  }
}

function setMusicPanelCollapsed(collapsed) {
  musicPanelCollapsed = collapsed;
  const panel = document.querySelector("#global-music-panel");
  const detail = document.querySelector("#global-music-detail");
  const toggle = document.querySelector("#music-panel-toggle");
  const caret = document.querySelector("#music-panel-caret");
  if (!panel || !detail || !toggle) return;
  panel.classList.toggle("is-collapsed", collapsed);
  detail.hidden = collapsed;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  if (caret) caret.textContent = collapsed ? "⌄" : "⌃";
}

function setChapterPanelCollapsed(collapsed) {
  chapterPanelCollapsed = collapsed;
  const workspace = document.querySelector(".workspace");
  const panel = document.querySelector(".chapters-panel");
  const list = document.querySelector("#chapter-list");
  const toggle = document.querySelector("#chapter-panel-toggle");
  const caret = document.querySelector("#chapter-panel-caret");
  if (!workspace || !panel || !list || !toggle) return;
  workspace.classList.toggle("chapters-collapsed", collapsed);
  panel.classList.toggle("is-collapsed", collapsed);
  list.hidden = collapsed;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.title = collapsed ? "展开章节目录" : "收起章节目录";
  if (caret) caret.textContent = collapsed ? "‹" : "›";
}

function syncTopbarControls() {
  const template = templates.find((item) => item.id === activeTemplate) || templates[0];
  const templateLabel = document.querySelector("#template-current-label");
  if (templateLabel) templateLabel.textContent = template.title;
  syncAgentTrigger();
}

function syncAgentTrigger() {
  const option = agentOptions[selectedAgent] || agentOptions.codex;
  const label = document.querySelector("#agent-current-label");
  const trigger = document.querySelector("#agent-trigger");
  const avatar = trigger ? trigger.querySelector(".agent-avatar") : null;
  const dot = trigger ? trigger.querySelector(".agent-dot") : null;
  const isReady = selectedAgent === "deepseek"
    ? Boolean(providerConfigs.deepseek?.apiKey)
    : option.status === "ready";
  if (label) label.textContent = option.label;
  if (avatar) {
    avatar.className = "agent-avatar " + option.tone;
    avatar.innerHTML = option.avatar;
  }
  if (dot) {
    dot.className = "agent-dot " + (isReady ? "ready" : "muted");
  }
  document.querySelectorAll(".agent-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.agent === selectedAgent);
    const optionDot = button.querySelector(".agent-dot");
    if (optionDot) {
      const ready = button.dataset.agent === "deepseek" ? Boolean(providerConfigs.deepseek?.apiKey) : true;
      optionDot.className = "agent-dot " + (ready ? "ready" : "muted");
    }
    const small = button.querySelector("small");
    if (small && button.dataset.agent === "deepseek") {
      small.textContent = providerConfigs.deepseek?.apiKey ? "configured" : "config needed";
    }
  });
}

function toggleAgentMenu() {
  const menu = document.querySelector("#agent-menu");
  const trigger = document.querySelector("#agent-trigger");
  const expanded = menu && !menu.hidden;
  if (!menu || !trigger) return;
  menu.hidden = expanded;
  trigger.setAttribute("aria-expanded", String(!expanded));
}

function closeAgentMenu() {
  const menu = document.querySelector("#agent-menu");
  const trigger = document.querySelector("#agent-trigger");
  if (!menu || !trigger) return;
  menu.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function selectAgent(agentId) {
  selectedAgent = agentOptions[agentId] ? agentId : "codex";
  syncAgentTrigger();
  closeAgentMenu();
  const toast = agentOptions[selectedAgent].toast;
  showToast(toast[0], toast[1], agentOptions[selectedAgent].status === "ready" ? "ok" : "work");
}

function openNewProjectModal(templateId = activeTemplate) {
  selectedNewTemplate = templates.some((item) => item.id === templateId) ? templateId : "folk";
  const modal = document.querySelector("#new-project-modal");
  const name = document.querySelector("#new-project-name");
  if (name) name.value = "未命名短故事";
  renderNewProjectTemplates();
  if (modal) modal.hidden = false;
}

function renderSettings(tab = currentSettingsTab) {
  currentSettingsTab = tab;
  const content = document.querySelector("#settings-content");
  const template = settingsTemplates[tab] || settingsTemplates.agents;
  document.querySelectorAll("[data-settings]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settings === tab);
  });
  if (content) content.innerHTML = typeof template === "function" ? template() : template;

  document.querySelectorAll("[data-config-action]").forEach((button) => {
    button.addEventListener("click", () => handleSettingsAction(button.dataset.configAction));
  });

  const preset = document.querySelector('[data-config-provider="deepseek"] [data-config-field="modelPreset"]');
  if (preset) {
    preset.addEventListener("change", () => {
      const custom = document.querySelector('[data-config-provider="deepseek"] [data-config-field="model"]');
      if (custom) {
        custom.disabled = preset.value !== "custom";
        custom.placeholder = preset.value === "custom" ? "deepseek-chat 或网关模型名" : "使用上方预设";
      }
    });
    preset.dispatchEvent(new Event("change"));
  }
}

function readConfigFields(root) {
  const config = {};
  if (!root) return config;
  root.querySelectorAll("[data-config-field]").forEach((input) => {
    const field = input.dataset.configField;
    if (field === "modelPreset") return;
    config[field] = input.value.trim();
  });
  const preset = root.querySelector('[data-config-field="modelPreset"]');
  const customModel = root.querySelector('[data-config-field="model"]');
  if (preset) {
    config.model = preset.value === "custom" ? (customModel ? customModel.value.trim() : "") : preset.value;
  }
  return config;
}

function handleSettingsAction(action) {
  if (action === "save-deepseek") {
    providerConfigs.deepseek = readConfigFields(document.querySelector('[data-config-provider="deepseek"]'));
    window.localStorage.setItem("loeme.deepseek.config", JSON.stringify(providerConfigs.deepseek));
    renderSettings("agents");
    syncAgentTrigger();
    showToast("DeepSeek 配置已保存", providerConfigs.deepseek.model || "deepseek-chat", "ok");
    return;
  }
  if (action === "save-tencent") {
    providerConfigs.tencentTts = readConfigFields(document.querySelector('[data-config-provider="tencent"]'));
    window.localStorage.setItem("loeme.tencentTts.config", JSON.stringify(providerConfigs.tencentTts));
    renderSettings("audio");
    showToast("Audio 配置已保存", "腾讯云 TTS", "ok");
    return;
  }
  if (action === "save-music") {
    providerConfigs.music = readConfigFields(document.querySelector('[data-config-provider="music"]'));
    window.localStorage.setItem("loeme.music.config", JSON.stringify(providerConfigs.music));
    renderSettings("music");
    showToast("Music 配置已保存", providerConfigs.music.libraryPath || "本地音乐库", "ok");
    return;
  }
  showToast("配置动作已记录", action || "settings", "work");
}

function setProjectPaneCollapsed(collapsed) {
  projectCollapsed = collapsed;
  const workspace = document.querySelector(".workspace");
  const button = document.querySelector("#toggle-projects-pane");
  if (!workspace || !button) return;
  workspace.classList.toggle("projects-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.textContent = collapsed ? "›" : "‹";
  button.title = collapsed ? "展开项目栏" : "收起项目栏";
}

function setChatPaneCollapsed(collapsed) {
  chatCollapsed = collapsed;
  const workspace = document.querySelector(".workspace");
  const button = document.querySelector("#toggle-chat-pane");
  if (!workspace || !button) return;
  workspace.classList.toggle("chat-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.textContent = collapsed ? "›" : "‹";
  button.title = collapsed ? "展开创作对话" : "收起创作对话";
}

function setComposeMode(mode, options = {}) {
  activeComposeMode = composeModes[mode] ? mode : "script";
  const thread = currentThread();
  thread.composeMode = activeComposeMode;
  const config = composeModes[activeComposeMode];
  const input = document.querySelector("#prompt-input");
  const scope = document.querySelector("#chat-scope-label");
  const status = document.querySelector("#composer-status");
  if (input) input.placeholder = config.placeholder;
  const project = currentProject();
  if (scope) scope.textContent = project ? "项目对话：" + project.title + " · 当前作用域：" + config.label : "还没有项目 · 先新建项目";
  if (status) status.textContent = config.label + " · Cmd / Ctrl + Enter";
  if (project) persistProjectState();
  if (!options.silent) showToast("指令作用域已切换", config.label, "work");
}

function selectedAgentRuntimeId() {
  return selectedAgent === "deepseek" ? "deepseek-api" : "codex";
}

function currentAgentLabel() {
  return (agentOptions[selectedAgent] || agentOptions.codex).label;
}

function buildChatMaterials(projectChapters) {
  return projectChapters.flatMap((chapter) => [
    {
      type: "image",
      name: chapter.title,
      status: chapter.imageState,
      target: chapter.id,
      path: chapter.prompt
    },
    {
      type: "narration",
      name: chapter.title,
      status: chapter.voiceState,
      target: chapter.id,
      path: chapter.voice
    }
  ]);
}

const workIntentPattern = /(开始|执行|生成|创建|新建|优化|修改|改写|整理|导入|检查|应用|写入|更新|切分|分章|分镜|配音|旁白|图片|素材|模板|项目|章节|文案|音乐|BGM|导出|预览|渲染|帮我做|按当前|这个项目|当前章节)/i;
const chapterGenerationIntentPattern = /(切分|分章|分镜|章节目录|分镜目录|拆成\s*\d+\s*(?:个|段|章|节)?|生成\s*\d+\s*(?:个|段|章|节)?\s*(?:章节|分镜|镜头|场景)|生成.*(?:章节|分镜|镜头|场景)|(?:章节|分镜).*(?:生成|整理|规划)|整理章节|按.*章节|按.*分镜)/i;
const imageGenerationIntentPattern = /(图片生成|生成图片|生图|图片\s*Prompt|图片提示词|最终\s*Prompt|画面提示词|当前章节.*图片|当前章节.*画面)/i;

function shouldUseProjectContext(prompt) {
  return workIntentPattern.test(prompt || "");
}

function shouldApplyGeneratedChapters(prompt, reply) {
  const combined = `${prompt || ""}\n${reply || ""}`;
  if (!chapterGenerationIntentPattern.test(prompt || "")) return false;
  if (imageGenerationIntentPattern.test(prompt || "") && !/(分章|分镜|章节|分镜目录|章节目录|切分)/i.test(prompt || "")) return false;
  return /(?:```(?:json)?[^\n]*(?:loeme-chapters|chapters)|```json|\|.*(?:章节|标题|旁白)|(?:^|\n)(?:#{1,4}\s*)?(?:CH|Scene|Chapter|第\s*[\d一二三四五六七八九十]+))/i.test(combined);
}

function shouldApplyImagePrompt(prompt, reply) {
  return imageGenerationIntentPattern.test(`${prompt || ""}\n${reply || ""}`);
}

function buildLightChatContext(project) {
  const template = templates.find((item) => item.id === activeTemplate) || templates[0];
  const imageSize = templateCanvasSpec(activeTemplate);
  const mode = composeModes[activeComposeMode] || composeModes.script;
  return {
    project: {
      id: project.id,
      title: project.title,
      type: project.type,
      status: project.status
    },
    template: {
      id: template.id,
      title: template.title,
      canvas: template.canvas,
      imageSize
    },
    composeMode: activeComposeMode,
    composeLabel: mode.label
  };
}

function buildChatContext(project, prompt) {
  const projectChapters = currentProjectChapters();
  const template = templates.find((item) => item.id === activeTemplate) || templates[0];
  const imageSize = templateCanvasSpec(activeTemplate);
  const mode = composeModes[activeComposeMode] || composeModes.script;
  const activeChapter = projectChapters[activeChapterIndex] || null;
  const thread = currentThread();
  return {
    prompt,
    project: {
      id: project.id,
      title: project.title,
      type: project.type,
      status: project.status,
      duration: project.duration
    },
    template: {
      id: template.id,
      title: template.title,
      subtitle: template.subtitle,
      canvas: template.canvas,
      imageSize,
      tags: template.tags
    },
    composeMode: activeComposeMode,
    composeLabel: mode.label,
    activeChapter,
    chapters: projectChapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      time: chapter.time,
      text: chapter.text,
      prompt: chapter.prompt,
      imageState: chapter.imageState,
      voiceState: chapter.voiceState
    })),
    materials: buildChatMaterials(projectChapters),
    audio: {
      voice: currentVideoVoiceLabel(),
      bgm: currentVideoBgmLabel()
    },
    recentMessages: (thread.messages || []).slice(-8)
  };
}

function buildAgentConfig() {
  const deepseek = providerConfigs.deepseek || {};
  return {
    deepseek: {
      apiKey: deepseek.apiKey || "",
      baseUrl: deepseek.baseUrl || "https://api.deepseek.com",
      model: deepseek.model || "deepseek-chat",
      temperature: deepseek.temperature || "0.7"
    }
  };
}

function applyGeneratedChaptersFromReply(reply, prompt) {
  if (!currentProject()) return 0;
  if (!shouldApplyGeneratedChapters(prompt, reply)) return 0;
  const chapters = extractGeneratedChapters(reply);
  if (!chapters.length) return 0;
  const project = currentProject();
  project.chaptersData = chapters;
  project.contentStatus = "generated";
  project.chapters = `${chapters.length} / ${chapters.length}`;
  project.status = "制作中";
  project.duration = chapters[chapters.length - 1]?.time?.split("-")[1] || project.duration || "0:00";
  activeChapterIndex = 0;
  previewTimeSec = 0;
  pausePreviewPlayback({ status: "ready", silent: true });
  persistProjectState();
  renderProjects();
  renderChapters();
  updatePreview();
  renderInspector();
  return chapters.length;
}

function applyImagePromptFromReply(reply, prompt, context) {
  if (!currentProject()) return false;
  if (!shouldApplyImagePrompt(prompt, reply)) return false;
  const imagePrompt = extractImagePromptFromReply(reply);
  if (!imagePrompt) return false;
  const chapters = ensureEditableProjectChapters();
  if (!chapters.length) return false;
  const targetId = context?.activeChapter?.id;
  const chapter = chapters.find((item) => targetId && item.id === targetId) || chapters[activeChapterIndex] || chapters[0];
  if (!chapter) return false;
  chapter.prompt = imagePrompt;
  chapter.imageState = "本地预览已生成";
  chapter.state = "active";
  activeChapterIndex = Math.max(0, chapters.findIndex((item) => item.id === chapter.id));
  persistProjectState();
  renderProjects();
  renderChapters();
  updatePreview();
  renderInspector();
  return true;
}

function extractImagePromptFromReply(reply = "") {
  const raw = String(reply);
  const fencedBlocks = [...raw.matchAll(/```(?!json\b)[^\n]*\n([\s\S]*?)```/gi)]
    .map((match) => cleanImagePromptText(match[1]))
    .filter((block) => block.length > 24);
  if (fencedBlocks.length) {
    return fencedBlocks.sort((a, b) => b.length - a.length)[0];
  }

  const text = stripMachineBlocksForDisplay(raw);
  const markerMatch = text.match(/(?:最终(?:生图|图片)?\s*Prompt|图片\s*Prompt|Prompt\s*如下|最终提示词|生图提示词)[^\n:：]*[:：]?\s*([\s\S]+)/i);
  if (markerMatch) {
    const section = markerMatch[1].split(/\n\s*(?:建议|说明|任务标记|状态|注意|如果当前|当前只准备|不要声称)/)[0];
    const cleaned = cleanImagePromptText(section);
    if (cleaned.length > 24) return cleaned;
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map(cleanImagePromptText)
    .filter((item) => item.length > 40 && /[，,、]/.test(item) && !/已经生成|不会声称|任务标记/.test(item));
  return paragraphs[0] || "";
}

function cleanImagePromptText(value = "") {
  return String(value)
    .replace(/^[-*\s#>]+/gm, "")
    .replace(/^(?:最终(?:生图|图片)?\s*Prompt|图片\s*Prompt|Prompt|生图提示词|最终提示词)\s*[：:]\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1400);
}

async function requestAgentChat(prompt, context, contextMode) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agent: selectedAgentRuntimeId(),
      prompt,
      contextMode,
      context,
      config: buildAgentConfig()
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Agent request failed: ${response.status}`);
  }
  return data.text || "";
}

async function submitPrompt() {
  const input = document.querySelector("#prompt-input");
  if (!input) return;
  if (chatRequestInFlight) {
    showToast("Agent 正在回复", "等当前对话完成后再发送下一条", "work");
    return;
  }
  const project = currentProject();
  if (!project) {
    const status = document.querySelector("#composer-status");
    if (status) status.textContent = "请先新建项目";
    showToast("请先新建项目", "项目对话会跟随项目保存", "work");
    return;
  }
  const value = input.value.trim();
  const status = document.querySelector("#composer-status");
  if (!value) {
    if (status) status.textContent = "先输入一条修改指令";
    return;
  }
  if (chapterGenerationIntentPattern.test(value)) {
    setComposeMode("script", { silent: true });
  }
  const config = composeModes[activeComposeMode] || composeModes.script;
  const thread = currentThread();
  const contextMode = shouldUseProjectContext(value) ? "full" : "light";
  const context = contextMode === "full" ? buildChatContext(project, value) : buildLightChatContext(project);
  thread.messages.push({ role: "user", title: "你", text: value });
  const pendingIndex = thread.messages.push({
    role: "assistant",
    title: currentAgentLabel() + " 正在处理",
    text: contextMode === "full" ? "正在读取当前项目、模板、章节和素材状态..." : "轻量对话中，暂不展开项目背景。"
  }) - 1;
  thread.draft = "";
  thread.composeMode = activeComposeMode;
  persistProjectState();
  renderConversation();
  input.value = "";
  input.disabled = true;
  chatRequestInFlight = true;
  if (status) status.textContent = currentAgentLabel() + (contextMode === "full" ? " · 正在读取上下文" : " · 轻量对话");
  showToast("已发送给 " + currentAgentLabel(), value.slice(0, 42), "work");
  try {
    const reply = await requestAgentChat(value, context, contextMode);
    thread.messages[pendingIndex] = {
      role: "assistant",
      title: currentAgentLabel(),
      text: reply || "Agent 没有返回内容。"
    };
    const chapterCount = applyGeneratedChaptersFromReply(reply, value);
    const imagePromptUpdated = chapterCount ? false : applyImagePromptFromReply(reply, value, context);
    if (status) status.textContent = config.done;
    showToast(
      chapterCount ? "章节目录已生成" : imagePromptUpdated ? "图片 Prompt 已替换" : "Agent 回复完成",
      chapterCount ? `${chapterCount} 章已写入当前项目` : imagePromptUpdated ? "当前章节已更新" : currentAgentLabel(),
      "ok"
    );
  } catch (error) {
    thread.messages[pendingIndex] = {
      role: "assistant",
      title: currentAgentLabel() + " 调用失败",
      text: error instanceof Error ? error.message : String(error)
    };
    if (status) status.textContent = "Agent 调用失败";
    showToast("Agent 调用失败", currentAgentLabel(), "work");
  } finally {
    input.disabled = false;
    chatRequestInFlight = false;
    persistProjectState();
    renderConversation();
    input.focus();
  }
}

function bindEvents() {
  const settingsModal = document.querySelector("#settings-modal");
  const newProjectModal = document.querySelector("#new-project-modal");
  const deleteProjectModal = document.querySelector("#delete-project-modal");

  document.querySelector("#agent-trigger").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAgentMenu();
  });
  document.querySelectorAll("[data-agent]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectAgent(button.dataset.agent);
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#agent-picker")) closeAgentMenu();
  });

  document.querySelector("#settings-btn").addEventListener("click", () => {
    renderSettings("agents");
    settingsModal.hidden = false;
  });
  document.querySelector("#settings-close").addEventListener("click", () => {
    settingsModal.hidden = true;
  });
  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) settingsModal.hidden = true;
  });
  document.querySelectorAll("[data-settings]").forEach((button) => {
    button.addEventListener("click", () => renderSettings(button.dataset.settings));
  });

  document.querySelector("#new-project").addEventListener("click", () => openNewProjectModal(activeTemplate));
  document.querySelector("#template-trigger").addEventListener("click", () => openNewProjectModal(activeTemplate));
  document.querySelector("#new-project-close").addEventListener("click", () => {
    newProjectModal.hidden = true;
  });
  newProjectModal.addEventListener("click", (event) => {
    if (event.target === newProjectModal) newProjectModal.hidden = true;
  });
  document.querySelector("#delete-project-close").addEventListener("click", closeDeleteProjectModal);
  document.querySelector("#delete-project-cancel").addEventListener("click", closeDeleteProjectModal);
  document.querySelector("#delete-project-confirm").addEventListener("click", confirmDeleteProject);
  deleteProjectModal.addEventListener("click", (event) => {
    if (event.target === deleteProjectModal) closeDeleteProjectModal();
  });
  document.querySelector("#create-project").addEventListener("click", () => {
    const name = document.querySelector("#new-project-name").value.trim() || "未命名项目";
    const type = document.querySelector("#new-project-type").value;
    const id = "project-" + Date.now();
    projects.unshift({ id, title: name, type, status: "草稿", duration: "0:00", chapters: "0 / 0", template: selectedNewTemplate, contentStatus: "empty", chaptersData: [] });
    projectThreads[id] = createProjectThread({ id, title: name });
    activeProjectId = id;
    activeTemplate = selectedNewTemplate;
    activeChapterIndex = 0;
    resetPreviewPlayback();
    persistProjectState();
    renderWorkspaceState();
    newProjectModal.hidden = true;
    const template = templates.find((item) => item.id === selectedNewTemplate) || templates[0];
    showToast("项目已创建", template.title, "ok");
  });

  document.querySelector("#toggle-projects-pane").addEventListener("click", () => setProjectPaneCollapsed(!projectCollapsed));
  document.querySelector("#toggle-chat-pane").addEventListener("click", () => setChatPaneCollapsed(!chatCollapsed));
  document.querySelector("#global-config-toggle").addEventListener("click", () => {
    setGlobalConfigCollapsed(!globalConfigCollapsed);
    showToast(globalConfigCollapsed ? "已收起全片声音与音乐" : "已展开全片声音与音乐", "全片配置", "work");
  });
  document.querySelector("#audio-panel-toggle").addEventListener("click", () => {
    setAudioPanelCollapsed(!audioPanelCollapsed);
    showToast(audioPanelCollapsed ? "已收起 Audio" : "已展开 Audio", "全片配音", "work");
  });
  document.querySelector("#music-panel-toggle").addEventListener("click", () => {
    setMusicPanelCollapsed(!musicPanelCollapsed);
    showToast(musicPanelCollapsed ? "已收起 Music" : "已展开 Music", "全片配乐", "work");
  });
  document.querySelector("#chapter-panel-toggle").addEventListener("click", () => {
    setChapterPanelCollapsed(!chapterPanelCollapsed);
    showToast(chapterPanelCollapsed ? "已收起章节目录" : "已展开章节目录", "章节目录", "work");
  });

  document.querySelector("#preview-play").addEventListener("click", startPreviewPlayback);
  document.querySelector("#preview-pause").addEventListener("click", () => pausePreviewPlayback({ status: "paused" }));
  const playerTrack = document.querySelector("#player-track");
  playerTrack.addEventListener("click", seekPreviewFromPointer);
  playerTrack.addEventListener("pointerdown", (event) => {
    if (!currentProjectDurationSec()) return;
    previewScrubbing = true;
    playerTrack.setPointerCapture?.(event.pointerId);
    seekPreviewFromPointer(event);
  });
  playerTrack.addEventListener("pointermove", (event) => {
    if (previewScrubbing) seekPreviewFromPointer(event);
  });
  playerTrack.addEventListener("pointerup", (event) => {
    previewScrubbing = false;
    playerTrack.releasePointerCapture?.(event.pointerId);
  });
  playerTrack.addEventListener("pointercancel", () => {
    previewScrubbing = false;
  });
  playerTrack.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekPreviewByStep(event.shiftKey ? -5 : -1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekPreviewByStep(event.shiftKey ? 5 : 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setPreviewTime(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setPreviewTime(currentProjectDurationSec());
    }
  });
  document.querySelector("#render-btn").addEventListener("click", () => {
    const badge = document.querySelector("#preview-status");
    const template = templates.find((item) => item.id === activeTemplate) || templates[0];
    badge.className = "status-badge warning";
    badge.textContent = "rendering";
    showToast("本地预览任务已开始", template.canvas, "work");
    window.setTimeout(() => {
      badge.className = "status-badge ready";
      badge.textContent = "ready";
      showToast("预览已生成", "可以继续调整", "ok");
    }, 900);
  });

  document.querySelector("#send-prompt").addEventListener("click", submitPrompt);
  document.querySelector("#prompt-input").addEventListener("input", (event) => {
    if (!currentProject()) return;
    currentThread().draft = event.target.value;
    persistProjectState();
  });
  document.querySelector("#prompt-input").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submitPrompt();
    }
  });
}

function showToast(title, message, tone = "work") {
  const stack = document.querySelector("#feedback-stack");
  const toast = document.createElement("div");
  const titleElement = document.createElement("strong");
  const messageElement = document.createElement("span");
  toast.className = `toast ${tone}`;
  titleElement.textContent = title;
  messageElement.textContent = message;
  toast.append(titleElement, messageElement);
  stack.appendChild(toast);
  window.setTimeout(() => toast.classList.add("visible"), 20);
  window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => toast.remove(), 180);
  }, 2400);
}

function loadProviderConfig(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function providerStatus(config, requiredFields) {
  const ready = requiredFields.every((field) => String(config[field] || "").trim());
  return { className: ready ? "ready" : "warning", label: ready ? "configured" : "key needed" };
}

function stripMachineBlocksForDisplay(value = "") {
  const text = String(value);
  return text
    .replace(/```(?:json)?[^\n]*(?:loeme-chapters|chapters)[^\n]*\n[\s\S]*?```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderMarkdown(value = "") {
  const lines = String(value).replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let listType = null;
  let inCode = false;
  let codeInfo = "";
  let codeBuffer = [];
  let paragraphBuffer = [];

  const closeList = () => {
    if (!listType) return;
    html += `</${listType}>`;
    listType = null;
  };
  const openList = (type) => {
    if (listType === type) return;
    flushParagraph();
    closeList();
    listType = type;
    html += `<${type}>`;
  };
  const flushCode = () => {
    html += renderCodeBlock(codeBuffer.join("\n"), codeInfo);
    codeInfo = "";
    codeBuffer = [];
  };
  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    html += `<p>${renderInlineMarkdown(paragraphBuffer.join(" "))}</p>`;
    paragraphBuffer = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```\s*(.*)$/);
    if (fence) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        inCode = true;
        codeInfo = fence[1] || "";
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const table = readMarkdownTable(lines, index);
    if (table) {
      flushParagraph();
      closeList();
      html += table.html;
      index = table.nextIndex;
      continue;
    }

    const divider = line.match(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/);
    if (divider) {
      flushParagraph();
      closeList();
      html += "<hr />";
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length + 2;
      html += `<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`;
      continue;
    }

    const unordered = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (unordered) {
      openList("ul");
      html += `<li class="md-indent-${markdownIndentLevel(unordered[1])}">${renderInlineMarkdown(unordered[2])}</li>`;
      continue;
    }

    const ordered = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (ordered) {
      openList("ol");
      html += `<li class="md-indent-${markdownIndentLevel(ordered[1])}">${renderInlineMarkdown(ordered[2])}</li>`;
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html += `<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`;
      continue;
    }

    closeList();
    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  closeList();
  if (inCode) flushCode();
  return html || "<p></p>";
}

function renderCodeBlock(code = "", info = "") {
  const cleanInfo = String(info || "").trim();
  const cleanCode = String(code || "").trimEnd();
  if (shouldCollapseCodeBlock(cleanCode, cleanInfo)) {
    const label = codeBlockSummary(cleanCode, cleanInfo);
    return `<details class="md-code-details md-machine-block"><summary><span>${escapeHtml(label)}</span><em>展开查看全部</em></summary><pre><code>${escapeHtml(cleanCode)}</code></pre></details>`;
  }
  const infoLabel = cleanInfo ? `<span class="md-code-lang">${escapeHtml(cleanInfo)}</span>` : "";
  return `<pre class="md-code-block">${infoLabel}<code>${escapeHtml(cleanCode)}</code></pre>`;
}

function shouldCollapseCodeBlock(code = "", info = "") {
  const normalizedInfo = String(info || "").toLowerCase();
  if (/(json|loeme-chapters|chapters|yaml|yml)/i.test(normalizedInfo)) return true;
  if (looksLikeStructuredData(code)) return true;
  return String(code || "").length > 520;
}

function codeBlockSummary(code = "", info = "") {
  const normalizedInfo = String(info || "").toLowerCase();
  if (/loeme-chapters|chapters/.test(normalizedInfo) || looksLikeChapterJson(code)) return "章节结构数据";
  if (/json/.test(normalizedInfo) || looksLikeStructuredData(code)) return "结构化数据";
  if (/ya?ml/.test(normalizedInfo)) return "配置数据";
  return "长文本内容";
}

function looksLikeStructuredData(code = "") {
  const trimmed = String(code || "").trim();
  if (!trimmed || !/^[\[{]/.test(trimmed)) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function looksLikeChapterJson(code = "") {
  const trimmed = String(code || "").trim();
  try {
    const parsed = JSON.parse(trimmed);
    const chapters = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.chapters) ? parsed.chapters : [];
    return chapters.some((item) => item && typeof item === "object" && ("title" in item || "text" in item || "prompt" in item));
  } catch {
    return /"title"\s*:|"prompt"\s*:|"text"\s*:|"time"\s*:/.test(trimmed);
  }
}

function markdownIndentLevel(spaces = "") {
  return Math.min(3, Math.floor(spaces.length / 2));
}

function readMarkdownTable(lines, startIndex) {
  const header = lines[startIndex];
  const divider = lines[startIndex + 1];
  if (!isMarkdownTableRow(header) || !isMarkdownTableDivider(divider)) return null;

  const headers = splitMarkdownTableRow(header);
  const rows = [];
  let index = startIndex + 2;
  while (index < lines.length && isMarkdownTableRow(lines[index]) && lines[index].trim()) {
    rows.push(splitMarkdownTableRow(lines[index]));
    index += 1;
  }

  const headerHtml = headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("");
  const bodyHtml = rows.map((row) => {
    const cells = headers.map((_, cellIndex) => `<td>${renderInlineMarkdown(row[cellIndex] || "")}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return {
    html: `<div class="md-table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
    nextIndex: index - 1
  };
}

function isMarkdownTableRow(line = "") {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1);
}

function isMarkdownTableDivider(line = "") {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitMarkdownTableRow(line = "") {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function renderInlineMarkdown(value = "") {
  const codeTokens = [];
  let text = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });
  text = text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2" target="_blank" rel="noreferrer">$1</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>");
  codeTokens.forEach((code, index) => {
    text = text.replace(`@@CODE${index}@@`, code);
  });
  return text;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function selectedAttr(current, value) {
  return (current || "yunxi") === value ? " selected" : "";
}

renderProjects();
syncTopbarControls();
restoreCurrentThreadState();
renderChapters();
updatePreview();
renderInspector();
setGlobalConfigCollapsed(globalConfigCollapsed);
setAudioPanelCollapsed(audioPanelCollapsed);
setMusicPanelCollapsed(musicPanelCollapsed);
setChapterPanelCollapsed(chapterPanelCollapsed);
renderSettings();
bindEvents();
