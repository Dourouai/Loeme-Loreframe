import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RuntimeConfig } from "@story-video/runtime";

export interface AppConfig extends RuntimeConfig {
  defaultTemplate?: string;
  templateDirs?: string[];
}

export class ConfigStore {
  readonly dir: string;
  readonly path: string;

  constructor(root: string) {
    this.dir = join(root, ".story-video");
    this.path = join(this.dir, "config.json");
  }

  read(): AppConfig {
    if (!existsSync(this.path)) return {};
    try {
      return JSON.parse(readFileSync(this.path, "utf8")) as AppConfig;
    } catch {
      return {};
    }
  }

  write(config: AppConfig): void {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.path, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  setDeepSeek(input: { apiKey?: string; baseUrl?: string; model?: string }): void {
    const config = this.read();
    config.deepseek = {
      ...(config.deepseek ?? {}),
      ...(input.apiKey !== undefined && { apiKey: input.apiKey.trim() }),
      ...(input.baseUrl !== undefined && { baseUrl: input.baseUrl.trim() }),
      ...(input.model !== undefined && { model: input.model.trim() })
    };
    this.write(config);
  }

  addTemplateDir(dir: string): void {
    const config = this.read();
    const dirs = new Set(config.templateDirs ?? []);
    dirs.add(dir);
    config.templateDirs = [...dirs];
    this.write(config);
  }

  removeTemplateDir(dir: string): void {
    const config = this.read();
    config.templateDirs = (config.templateDirs ?? []).filter((item) => item !== dir);
    this.write(config);
  }
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
