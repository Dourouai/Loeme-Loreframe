import { codex } from "./defs/codex.js";
import { deepseekApi } from "./defs/deepseek-api.js";
import type { AgentDef } from "./types.js";

export const AGENT_DEFS: AgentDef[] = [deepseekApi, codex];

export function findAgent(id: string): AgentDef | undefined {
  return AGENT_DEFS.find((agent) => agent.id === id);
}

