export type ProviderKind = "ai" | "tts" | "music" | "music_library" | "image";

export interface ProviderBase {
  id: string;
  name: string;
  kind: ProviderKind;
  description?: string;
  configureUrl?: string;
}

export interface ProviderStatus {
  available: boolean;
  source: "config" | "env" | "bundled" | "missing";
  detail?: string;
}

export interface MediaLicense {
  spdx?: string;
  name?: string;
  attributionRequired: boolean;
  commercialUse: boolean;
  url?: string;
  notes?: string;
}

export interface MediaProvenance {
  origin: "bundled" | "user_import" | "generated" | "third_party";
  author?: string;
  sourceUrl?: string;
  prompt?: string;
  provider?: string;
}

export interface AudioAssetResult {
  bytes?: Uint8Array;
  path?: string;
  ext: ".mp3" | ".wav" | ".m4a" | ".ogg";
  mimeType: string;
  durationSec?: number;
  providerNote: string;
  license?: MediaLicense;
  provenance?: MediaProvenance;
}

export interface TextGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface TextGenerationResult {
  text: string;
  model?: string;
  providerNote: string;
}

export interface AiTextProvider extends ProviderBase {
  kind: "ai";
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

export interface SpeechRequest {
  text: string;
  voicePreset?: string;
  language?: string;
  speed?: number;
  signal?: AbortSignal;
}

export interface TtsProvider extends ProviderBase {
  kind: "tts";
  generateSpeech(request: SpeechRequest): Promise<AudioAssetResult>;
}

export interface MusicGenerationRequest {
  prompt: string;
  mood?: string;
  durationSec?: number;
  instrumental?: boolean;
  signal?: AbortSignal;
}

export interface MusicGenerationProvider extends ProviderBase {
  kind: "music";
  generateMusic(request: MusicGenerationRequest): Promise<AudioAssetResult>;
}

export interface MusicTrack {
  id: string;
  title: string;
  description: string;
  moods: string[];
  bestFor: string[];
  durationSec?: number;
  bpm?: number;
  loopable: boolean;
  bundled: boolean;
  assetPath?: string;
  generationPrompt?: string;
  license: MediaLicense;
  provenance: MediaProvenance;
}

export interface MusicLibraryProvider extends ProviderBase {
  kind: "music_library";
  listTracks(): Promise<MusicTrack[]>;
  findTrack(id: string): Promise<MusicTrack | null>;
  searchTracks(query: string): Promise<MusicTrack[]>;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  stylePreset?: string;
  signal?: AbortSignal;
}

export interface ImageAssetResult {
  bytes?: Uint8Array;
  path?: string;
  ext: ".png" | ".jpg" | ".webp";
  mimeType: string;
  providerNote: string;
  license?: MediaLicense;
  provenance?: MediaProvenance;
}

export interface ImageGenerationProvider extends ProviderBase {
  kind: "image";
  generateImage(request: ImageGenerationRequest): Promise<ImageAssetResult>;
}

export type StoryVideoProvider =
  | AiTextProvider
  | TtsProvider
  | MusicGenerationProvider
  | MusicLibraryProvider
  | ImageGenerationProvider;

