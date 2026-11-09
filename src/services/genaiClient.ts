import { GoogleGenAI, Modality } from '@google/genai';
import type { GenerateVideosOperation, GenerateVideosParameters, GenerateVideosResponse } from '@google/genai';

import { decodeBase64 } from '../utils/audio';
import { GenerationFailedError } from './errors';

export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

/** Starts a video generation and returns the long running operation. */
export async function startVideoGeneration(
  client: GoogleGenAI,
  request: GenerateVideosParameters,
  signal?: AbortSignal,
): Promise<GenerateVideosOperation> {
  const config: NonNullable<GenerateVideosParameters['config']> = {
    ...request.config,
    abortSignal: signal,
  };
  return client.models.generateVideos({ ...request, config });
}

/** Fetches the current state of a running operation. */
export async function fetchOperation(client: GoogleGenAI, operation: GenerateVideosOperation): Promise<GenerateVideosOperation> {
  return client.operations.getVideosOperation({ operation });
}

export interface DownloadedVideo {
  blob: Blob;
  mimeType: string;
}

/**
 * Turns the API response into a downloadable blob.
 *
 * The API sometimes returns the bytes inline and sometimes a signed URI. For the
 * URI case the key has to travel as a query parameter, which is why a production
 * deployment should put a backend proxy in front of this app.
 */
export async function downloadVideo(
  response: GenerateVideosResponse,
  apiKey: string,
  signal?: AbortSignal,
): Promise<DownloadedVideo> {
  const video = response.generatedVideos?.[0]?.video;
  if (!video) {
    throw new GenerationFailedError('The API finished without returning a video.');
  }

  const mimeType = video.mimeType ?? 'video/mp4';

  if (video.videoBytes) {
    const bytes = decodeBase64(video.videoBytes);
    return { blob: new Blob([bytes], { type: mimeType }), mimeType };
  }

  if (!video.uri) {
    throw new GenerationFailedError('The API returned a video without any data.');
  }

  const separator = video.uri.includes('?') ? '&' : '?';
  const download = await fetch(`${video.uri}${separator}key=${encodeURIComponent(apiKey)}`, { signal });
  if (!download.ok) {
    throw new GenerationFailedError(`Could not download the generated video (HTTP ${download.status}).`);
  }
  const blob = await download.blob();
  return { blob, mimeType: blob.type || mimeType };
}

/** Reads the prompt out loud with the Gemini TTS model. */
export async function synthesizeSpeech(client: GoogleGenAI, text: string): Promise<Uint8Array> {
  const response = await client.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audio) {
    throw new GenerationFailedError('The API returned no audio data.');
  }
  return decodeBase64(audio);
}
