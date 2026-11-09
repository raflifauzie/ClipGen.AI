export type AspectRatio = '16:9' | '9:16' | '1:1';
export type Resolution = '720p' | '1080p';
export type DurationSeconds = 4 | 6 | 8;

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface MediaFrame {
  /** Base64 payload without the `data:` prefix. */
  data: string;
  mimeType: string;
  fileName: string;
}

export interface GenerationInput {
  prompt: string;
  modelId: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  durationSeconds: DurationSeconds;
  startFrame?: MediaFrame;
  endFrame?: MediaFrame;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  durationSeconds: DurationSeconds;
  createdAt: number;
  /** Object URL created from the stored blob. Valid for the lifetime of the page. */
  videoUrl: string;
}

export interface StoredHistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  durationSeconds: DurationSeconds;
  createdAt: number;
  blob: Blob;
}

export interface LocalProfile {
  displayName: string;
  email: string;
}

export type GenerationPhase = 'idle' | 'submitting' | 'waiting' | 'downloading' | 'done' | 'failed' | 'cancelled';
