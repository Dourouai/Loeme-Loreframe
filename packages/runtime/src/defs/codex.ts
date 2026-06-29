import type { AgentDef } from "../types.js";

export const codex: AgentDef = {
  id: "codex",
  name: "Codex CLI",
  bin: "codex",
  versionArgs: ["--version"],
  buildArgs() {
    return ["exec", "--skip-git-repo-check"];
  },
  streamFormat: "plain",
  promptViaStdin: true,
  installUrl: "https://developers.openai.com/codex/cli"
};

