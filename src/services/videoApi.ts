import type { GenerateVideosOperation, GenerateVideosParameters, GenerateVideosResponse } from '@google/genai';

import type { GenerationInput } from '../types';
import { GenerationCancelledError, GenerationFailedError, GenerationTimeoutError } from './errors';

type VideoConfig = NonNullable<GenerateVideosParameters['config']>;

/**
 * Builds the request payload for the video API. Kept pure so it can be unit tested.
 */
export function buildGenerateRequest(input: GenerationInput): GenerateVideosParameters {
  const config: VideoConfig = {
    numberOfVideos: 1,
    resolution: input.resolution,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
  };

  if (input.endFrame) {
    config.lastFrame = {
      imageBytes: input.endFrame.data,
      mimeType: input.endFrame.mimeType,
    };
  }

  const request: GenerateVideosParameters = {
    model: input.modelId,
    prompt: input.prompt.trim() || 'A high quality video',
    config,
  };

  if (input.startFrame) {
    request.image = {
      imageBytes: input.startFrame.data,
      mimeType: input.startFrame.mimeType,
    };
  }

  return request;
}

export type OperationFetcher = (operation: GenerateVideosOperation) => Promise<GenerateVideosOperation>;

export interface PollOptions {
  signal?: AbortSignal;
  timeoutMs: number;
  intervalMs: number;
  /** Injected in tests so the polling loop does not really wait. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

export function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      reject(new GenerationCancelledError());
    }

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(new GenerationCancelledError());
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Polls a long running operation until it is done, with a hard timeout and
 * cancellation support. The old implementation looped forever without a limit.
 */
export async function pollVideoOperation(
  fetchOperation: OperationFetcher,
  initialOperation: GenerateVideosOperation,
  options: PollOptions,
): Promise<GenerateVideosResponse> {
  const sleep = options.sleep ?? defaultSleep;
  const deadline = Date.now() + options.timeoutMs;
  let operation = initialOperation;

  while (!operation.done) {
    if (options.signal?.aborted) {
      throw new GenerationCancelledError();
    }
    if (Date.now() >= deadline) {
      throw new GenerationTimeoutError(options.timeoutMs);
    }

    await sleep(options.intervalMs, options.signal);

    if (options.signal?.aborted) {
      throw new GenerationCancelledError();
    }
    operation = await fetchOperation(operation);
  }

  if (operation.error) {
    const message = operation.error.message;
    throw new GenerationFailedError(typeof message === 'string' ? message : 'The API reported an error.');
  }

  if (!operation.response) {
    throw new GenerationFailedError('The API finished without returning a video.');
  }

  return operation.response;
}
