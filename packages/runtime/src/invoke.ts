import { spawn as spawnChild } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { resolveBin } from "./detect.js";
import type { AgentDef, AgentEvent, AgentInvokeContext } from "./types.js";

export interface InvokeAgentOptions {
  agent: AgentDef;
  prompt: string;
  context: AgentInvokeContext;
  onEvent?: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

export async function invokeAgent(options: InvokeAgentOptions): Promise<{ exitCode: number; text: string }> {
  const { agent, prompt, context, onEvent } = options;
  let text = "";

  const capture = (event: AgentEvent) => {
    if (event.type === "text") text += event.chunk;
    onEvent?.(event);
  };

  if (agent.kind === "http" && agent.httpHandler) {
    const ac = new AbortController();
    options.signal?.addEventListener("abort", () => ac.abort());
    const result = await agent.httpHandler(prompt, context, capture, ac.signal);
    capture({ type: "message_end", reason: result.exitCode === 0 ? "ok" : "error" });
    return { exitCode: result.exitCode, text };
  }

  const bin = await resolveBin(agent.bin);
  if (!bin) {
    capture({ type: "error", message: `${agent.name}: binary "${agent.bin}" not found` });
    return { exitCode: -1, text };
  }

  const child = spawnChild(bin, agent.buildArgs(prompt, context), {
    cwd: context.cwd,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"]
  });

  const outDecoder = new StringDecoder("utf8");
  const errDecoder = new StringDecoder("utf8");
  let stderr = "";

  if (agent.promptViaStdin) {
    child.stdin.write(prompt);
    child.stdin.end();
  }

  child.stdout.on("data", (chunk: Buffer) => {
    const decoded = outDecoder.write(chunk);
    if (decoded) capture({ type: "text", chunk: decoded });
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += errDecoder.write(chunk);
  });

  const result = await new Promise<{ exitCode: number }>((resolve) => {
    child.on("close", (code) => {
      const tail = outDecoder.end();
      if (tail) capture({ type: "text", chunk: tail });
      stderr += errDecoder.end();
      if (code !== 0) {
        capture({ type: "error", message: `agent exit code ${code}${stderr ? `: ${stderr.slice(0, 500)}` : ""}` });
      }
      capture({ type: "message_end", reason: code === 0 ? "ok" : "error" });
      resolve({ exitCode: code ?? 0 });
    });
    child.on("error", (error) => {
      capture({ type: "error", message: error.message });
      capture({ type: "message_end", reason: "error" });
      resolve({ exitCode: -1 });
    });
  });

  return { exitCode: result.exitCode, text };
}

