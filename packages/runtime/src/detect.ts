import { accessSync, constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AGENT_DEFS } from "./registry.js";
import type { AgentDef, AgentInvokeContext, DetectedAgent } from "./types.js";

const exec = promisify(execFile);
const WHICH_CMD = process.platform === "win32" ? "where" : "which";

export async function detectAgents(ctx: AgentInvokeContext): Promise<DetectedAgent[]> {
  return Promise.all(AGENT_DEFS.map((agent) => detectOne(agent, ctx)));
}

export async function detectOne(agent: AgentDef, ctx: AgentInvokeContext): Promise<DetectedAgent> {
  if (agent.kind === "http") {
    const probe = agent.httpProbe ? await agent.httpProbe(ctx) : { available: false };
    return {
      id: agent.id,
      name: agent.name,
      bin: agent.bin,
      available: probe.available,
      ...(probe.version !== undefined && { version: probe.version }),
      ...(probe.hint !== undefined && { hint: probe.hint }),
      ...(agent.installUrl !== undefined && { installUrl: agent.installUrl })
    };
  }

  const path = await resolveBin(agent.bin);
  if (!path) {
    return {
      id: agent.id,
      name: agent.name,
      bin: agent.bin,
      available: false,
      ...(agent.installUrl !== undefined && { installUrl: agent.installUrl })
    };
  }

  return {
    id: agent.id,
    name: agent.name,
    bin: agent.bin,
    available: true,
    path,
    version: await probeVersion(path, agent.versionArgs),
    ...(agent.installUrl !== undefined && { installUrl: agent.installUrl })
  };
}

export async function resolveBin(bin: string): Promise<string | null> {
  try {
    const { stdout } = await exec(WHICH_CMD, [bin], { timeout: 8000 });
    const first = stdout.trim().split(/\r?\n/)[0]?.trim();
    if (!first) return null;
    accessSync(first, constants.X_OK);
    return first;
  } catch {
    return null;
  }
}

async function probeVersion(bin: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await exec(bin, args, { timeout: 5000 });
    return stdout.trim().split("\n")[0] ?? null;
  } catch {
    return null;
  }
}

