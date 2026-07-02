import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const studioRoot = resolve(__dirname);
const workspaceRoot = resolve(studioRoot, "../..");
const host = process.env.STUDIO_HOST || "127.0.0.1";
const port = Number(process.env.PORT || process.env.STUDIO_PORT || 3091);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const chatSystemPrompt = `你是 Loeme Loreframe Studio 的创作对话 Agent。

产品定位：
- Loeme Loreframe 用来批量制作有声图 / 图文叙事视频。
- 用户主要通过对话定义项目、优化已有模板、整理素材、编排单期视频。
- 如果已有模板适合，优先优化当前模板；只有没有合适模板时才建议新建或派生模板。
- 素材管理很重要：图片、音频、字幕、BGM、参考资料、外部生成素材都需要能被归档、预览、标记状态并关联到项目 / 单期 / 章节。

工作边界：
- 这是 Studio 对话调用。除非用户明确要求修改文件、运行命令或生成落地文件，否则只输出建议、方案、结构化草案或下一步操作。
- 不要声称已经生成图片、音频或视频文件；只能说“建议生成 / 可以排队 / 待接入”。
- 回复用中文，短而具体，优先给可执行结果。`;

const workIntentPattern =
  /(开始|执行|生成|创建|新建|优化|修改|改写|整理|导入|检查|应用|写入|更新|切分|分章|分镜|配音|旁白|图片|素材|模板|项目|章节|文案|音乐|BGM|导出|预览|渲染|帮我做|按当前|这个项目|当前章节)/i;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        rejectRead(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolveRead(body ? JSON.parse(body) : {});
      } catch {
        rejectRead(new Error("Invalid JSON body"));
      }
    });
    req.on("error", rejectRead);
  });
}

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildStudioPrompt(input) {
  const context = input.context || {};
  const project = context.project || {};
  const template = context.template || {};
  const imageSize = template.imageSize || {};
  const chapter = context.activeChapter || null;
  const chapters = Array.isArray(context.chapters) ? context.chapters : [];
  const messages = Array.isArray(context.recentMessages) ? context.recentMessages : [];
  const materials = Array.isArray(context.materials) ? context.materials : [];

  const chapterLines = chapters
    .slice(0, 12)
    .map((item, index) => {
      return `${index + 1}. ${item.title || "未命名"}｜${item.time || "未定"}｜图片:${item.imageState || "未知"}｜配音:${item.voiceState || "未知"}`;
    })
    .join("\n");
  const messageLines = messages
    .slice(-8)
    .map((item) => `${item.role === "user" ? "用户" : "助手"}：${item.text || ""}`)
    .join("\n");
  const materialLines = materials
    .slice(0, 12)
    .map((item) => `${item.type || "素材"}｜${item.status || "未知"}｜${item.target || "未关联"}｜${item.name || item.path || ""}`)
    .join("\n");

  return `${chatSystemPrompt}

本轮模式：工作模式。你可以参考下面的项目、模板、章节和素材上下文，但不要声称已经写入文件或完成生成。
如果用户要求生成、切分或重分章节，请在自然语言说明后追加一个机器可读代码块，格式必须是：
\`\`\`json loeme-chapters
[
  {
    "title": "章节标题",
    "time": "00:00-00:18",
    "text": "旁白文案",
    "prompt": "图片生成提示词"
  }
]
\`\`\`
章节数组应覆盖本次要展示在分镜目录里的所有章节。
如果用户要求生成图片或图片 Prompt，必须使用当前模板的画布尺寸和比例；如果没有真实图片生成 provider，只输出可用于外部工具的最终 Prompt，不要声称图片文件已经生成。最终 Prompt 尽量放在非 JSON 代码块中，便于 Studio 写回当前章节。

当前上下文：
- 项目：${project.title || "未命名项目"}（${project.type || "未设置类型"}，状态：${project.status || "未知"}）
- 当前模板：${template.title || "未选择"}（${template.canvas || "未知画布"}，${template.subtitle || "无描述"}）
- 当前图片尺寸：${imageSize.label || template.canvas || "未知"}
- 当前作用域：${context.composeLabel || context.composeMode || "文案"}
- 当前章节：${chapter ? `${chapter.id || ""} ${chapter.title || ""} ${chapter.time || ""}` : "暂无章节"}
- 全片声音：${context.audio?.voice || "未设置"}
- 全片配乐：${context.audio?.bgm || "未设置"}

章节状态：
${chapterLines || "暂无章节，等待对话生成或导入。"}

素材状态：
${materialLines || "暂无素材记录。"}

最近对话：
${messageLines || "暂无。"}

用户本次请求：
${input.prompt || ""}

请直接回复给用户。`;
}

function buildLightStudioPrompt(input) {
  const context = input.context || {};
  const project = context.project || {};
  const template = context.template || {};
  return `${chatSystemPrompt}

本轮模式：轻量对话。不要检查或展开项目背景，不要假设已经读取章节、素材、模板细节。
只基于用户这句话进行回复；如果需要开始修改、生成、整理或检查当前项目，请明确告诉用户“开始工作时我再读取当前项目上下文”。

最小上下文：
- 当前项目：${project.title || "未命名项目"}
- 当前模板：${template.title || "未选择"}

用户本次请求：
${input.prompt || ""}

请直接回复给用户。`;
}

function shouldUseFullContext(input) {
  if (input.contextMode === "full") return true;
  if (input.contextMode === "light") return false;
  return workIntentPattern.test(input.prompt || "");
}

function buildAgentPrompt(input) {
  return shouldUseFullContext(input) ? buildStudioPrompt(input) : buildLightStudioPrompt(input);
}

async function invokeDeepSeek(input) {
  const config = input.config?.deepseek || {};
  const apiKey = safeString(config.apiKey, process.env.DEEPSEEK_API_KEY || "");
  if (!apiKey) {
    throw new Error("DeepSeek API key 未配置。请在 Settings > Agent 中填写 API Key，或设置 DEEPSEEK_API_KEY。");
  }

  const baseUrl = safeString(config.baseUrl, process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = safeString(config.model, process.env.DEEPSEEK_MODEL || "deepseek-chat");
  const temperature = Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : 0.7;
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 4096,
      messages: [{ role: "user", content: buildAgentPrompt(input) }]
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`DeepSeek 调用失败：${response.status} ${response.statusText}${body ? ` · ${body.slice(0, 300)}` : ""}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

function invokeCodex(input) {
  return new Promise((resolveInvoke, rejectInvoke) => {
    const child = spawn("codex", ["exec", "--skip-git-repo-check"], {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      rejectInvoke(new Error("Codex CLI 调用超时。"));
    }, 180_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      if (error.code === "ENOENT") {
        rejectInvoke(new Error("Codex CLI 未安装或不在 PATH 中。"));
        return;
      }
      rejectInvoke(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        rejectInvoke(new Error(`Codex CLI 退出码 ${code}${stderr ? `：${stderr.slice(0, 500)}` : ""}`));
        return;
      }
      resolveInvoke(stdout.trim());
    });
    child.stdin.end(buildAgentPrompt(input));
  });
}

function probeCommand(command, args = []) {
  return new Promise((resolveProbe) => {
    const child = spawn(command, args, { cwd: workspaceRoot, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolveProbe({ available: false, hint: "timeout" });
    }, 5000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolveProbe({ available: false, hint: error.code === "ENOENT" ? "not installed" : error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolveProbe({
        available: code === 0,
        version: stdout.trim().split("\n")[0] || undefined,
        hint: code === 0 ? undefined : stderr.trim().slice(0, 160)
      });
    });
  });
}

async function handleAgents(_req, res) {
  const codex = await probeCommand("codex", ["--version"]);
  sendJson(res, 200, {
    ok: true,
    agents: [
      {
        id: "codex",
        name: "Codex CLI",
        ...codex
      },
      {
        id: "deepseek-api",
        name: "DeepSeek API",
        available: Boolean(process.env.DEEPSEEK_API_KEY),
        hint: process.env.DEEPSEEK_API_KEY ? "configured from environment" : "configure in Studio settings or DEEPSEEK_API_KEY"
      }
    ]
  });
}

async function handleChat(req, res) {
  try {
    const input = await readJson(req);
    const agent = input.agent === "deepseek" ? "deepseek-api" : input.agent || "codex";
    const prompt = safeString(input.prompt);
    if (!prompt) {
      sendJson(res, 400, { ok: false, error: "Prompt is required." });
      return;
    }

    const text = agent === "deepseek-api" ? await invokeDeepSeek(input) : await invokeCodex(input);
    sendJson(res, 200, {
      ok: true,
      agent,
      contextMode: shouldUseFullContext(input) ? "full" : "light",
      text: text || "Agent 没有返回内容。"
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = normalize(join(studioRoot, requested));
  if (relative(studioRoot, filePath).startsWith("..")) {
    sendText(res, 403, "Forbidden");
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }
  res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "loeme-studio" });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/agents") {
    void handleAgents(req, res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/chat") {
    void handleChat(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  sendText(res, 405, "Method not allowed");
});

server.listen(port, host, () => {
  console.log(`Loeme Loreframe Studio: http://${host}:${port}/`);
});
