import type { MusicLibraryProvider, MusicTrack } from "./types.js";

export const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "low-drone-folk-horror",
    title: "Low Drone Folk Horror",
    description: "Slow, dark drone bed for rural suspense narration.",
    moods: ["dark", "suspense", "folk_horror", "low_drone"],
    bestFor: ["农村怪谈", "夜路", "祠堂", "荒宅", "打谷场"],
    durationSec: 180,
    loopable: true,
    bundled: false,
    generationPrompt:
      "instrumental low dark drone, restrained Chinese folk horror atmosphere, no vocals, sparse wind texture, slow tension",
    license: {
      name: "Generated or user-supplied asset required",
      attributionRequired: false,
      commercialUse: true,
      notes: "Metadata preset only. No audio file is bundled yet."
    },
    provenance: {
      origin: "generated",
      provider: "preset",
      prompt:
        "instrumental low dark drone, restrained Chinese folk horror atmosphere, no vocals, sparse wind texture, slow tension"
    }
  },
  {
    id: "guqin-dark-ambient",
    title: "Guqin Dark Ambient",
    description: "Sparse guqin-like ambient bed for classical zhiguai stories.",
    moods: ["classical", "zhiguai", "dark_ambient", "guqin"],
    bestFor: ["聊斋", "太平广记", "古籍志怪", "寺庙", "书斋"],
    durationSec: 240,
    loopable: true,
    bundled: false,
    generationPrompt:
      "instrumental dark ambient with sparse guqin-like plucks, ancient Chinese supernatural story, no vocals, slow and literary",
    license: {
      name: "Generated or user-supplied asset required",
      attributionRequired: false,
      commercialUse: true,
      notes: "Metadata preset only. No audio file is bundled yet."
    },
    provenance: {
      origin: "generated",
      provider: "preset",
      prompt:
        "instrumental dark ambient with sparse guqin-like plucks, ancient Chinese supernatural story, no vocals, slow and literary"
    }
  },
  {
    id: "temple-bell-night",
    title: "Temple Bell Night",
    description: "Soft bell and night ambience cue for transitions and chapter openings.",
    moods: ["temple", "bell", "night", "transition"],
    bestFor: ["章节开头", "转场", "异僧", "山寺"],
    durationSec: 45,
    loopable: false,
    bundled: false,
    generationPrompt:
      "short instrumental transition cue, distant temple bell at night, subtle wind, no melody, no vocals",
    license: {
      name: "Generated or user-supplied asset required",
      attributionRequired: false,
      commercialUse: true,
      notes: "Metadata preset only. No audio file is bundled yet."
    },
    provenance: {
      origin: "generated",
      provider: "preset",
      prompt:
        "short instrumental transition cue, distant temple bell at night, subtle wind, no melody, no vocals"
    }
  }
];

export class DefaultMusicLibraryProvider implements MusicLibraryProvider {
  id = "default-music-library";
  name = "Default Music Library";
  kind = "music_library" as const;
  description = "Built-in open metadata presets for story-video background music.";

  async listTracks(): Promise<MusicTrack[]> {
    return DEFAULT_MUSIC_TRACKS;
  }

  async findTrack(id: string): Promise<MusicTrack | null> {
    return DEFAULT_MUSIC_TRACKS.find((track) => track.id === id) ?? null;
  }

  async searchTracks(query: string): Promise<MusicTrack[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DEFAULT_MUSIC_TRACKS;

    return DEFAULT_MUSIC_TRACKS.filter((track) => {
      const haystack = [
        track.id,
        track.title,
        track.description,
        ...track.moods,
        ...track.bestFor,
        track.generationPrompt ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }
}

