import type { AgentDef, AgentInvokeContext } from "../types.js";

const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_BASE = "https://api.deepseek.com";

function resolveDeepSeek(ctx: AgentInvokeContext): { token: string; baseUrl: string; model: string } | null {
  const token = ctx.config?.deepseek?.apiKey || process.env.DEEPSEEK_API_KEY || "";
  if (!token) return null;
  const baseUrl = (ctx.config?.deepseek?.baseUrl || process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  const model = ctx.model || ctx.config?.deepseek?.model || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  return { token, baseUrl, model };
}

export const deepseekApi: AgentDef = {
  id: "deepseek-api",
  name: "DeepSeek API",
  bin: "deepseek-api",
  versionArgs: [],
  buildArgs: () => [],
  streamFormat: "plain",
  kind: "http",
  installUrl: "https://platform.deepseek.com/api_keys",

  async httpProbe(ctx) {
    const auth = resolveDeepSeek(ctx);
    if (!auth) {
      return {
        available: false,
        hint: "Set DEEPSEEK_API_KEY or run: story-video config set-deepseek --api-key <key>"
      };
    }
    return {
      available: true,
      version: `${auth.model} via ${new URL(auth.baseUrl).host}`
    };
  },

  async httpHandler(prompt, ctx, onEvent, signal) {
    const auth = resolveDeepSeek(ctx);
    if (!auth) {
      onEvent({ type: "error", message: "No DeepSeek API key configured" });
      return { exitCode: -1 };
    }

    let res: Response;
    try {
      res = await fetch(`${auth.baseUrl}/v1/chat/completions`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          model: auth.model,
          stream: true,
          max_tokens: 12000,
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch (error) {
      onEvent({ type: "error", message: error instanceof Error ? error.message : String(error) });
      return { exitCode: -1 };
    }

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      onEvent({ type: "error", message: `${res.status} ${res.statusText}${body ? `: ${body.slice(0, 400)}` : ""}` });
      return { exitCode: -1 };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data:"))
          ?.slice(5)
          .trim();
        if (!dataLine || dataLine === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataLine) as {
            choices?: Array<{ delta?: { content?: string } }>;
            error?: { message?: string };
          };
          if (parsed.error?.message) {
            onEvent({ type: "error", message: parsed.error.message });
          }
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            onEvent({ type: "text", chunk });
          }
        } catch {
          // Ignore malformed SSE lines.
        }
      }
    }

    return { exitCode: 0 };
  }
};

