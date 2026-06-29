export interface AgentInvokeContext {
  cwd: string;
  model?: string;
  config?: RuntimeConfig;
}

export interface RuntimeConfig {
  deepseek?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  defaultAgent?: string;
}

export type AgentEvent =
  | { type: "text"; chunk: string }
  | { type: "message_end"; reason?: string }
  | { type: "error"; message: string };

export interface AgentDef {
  id: string;
  name: string;
  bin: string;
  versionArgs: string[];
  buildArgs(prompt: string, ctx: AgentInvokeContext): string[];
  streamFormat: "plain";
  promptViaStdin?: boolean;
  installUrl?: string;
  kind?: "child" | "http";
  httpProbe?: (ctx: AgentInvokeContext) => Promise<{ available: boolean; version?: string | null; hint?: string }>;
  httpHandler?: (
    prompt: string,
    ctx: AgentInvokeContext,
    onEvent: (event: AgentEvent) => void,
    signal: AbortSignal
  ) => Promise<{ exitCode: number }>;
}

export interface DetectedAgent {
  id: string;
  name: string;
  bin: string;
  available: boolean;
  path?: string;
  version?: string | null;
  installUrl?: string;
  hint?: string;
}

