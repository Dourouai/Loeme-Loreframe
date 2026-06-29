import { DefaultMusicLibraryProvider } from "./default-music.js";
import type { ProviderKind, StoryVideoProvider } from "./types.js";

export class ProviderRegistry {
  private providers = new Map<string, StoryVideoProvider>();

  constructor(providers: StoryVideoProvider[] = []) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  register(provider: StoryVideoProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Duplicate provider id: ${provider.id}`);
    }
    this.providers.set(provider.id, provider);
  }

  list(kind?: ProviderKind): StoryVideoProvider[] {
    const providers = [...this.providers.values()];
    return kind ? providers.filter((provider) => provider.kind === kind) : providers;
  }

  get(id: string): StoryVideoProvider | null {
    return this.providers.get(id) ?? null;
  }
}

export function createDefaultProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry([new DefaultMusicLibraryProvider()]);
}

