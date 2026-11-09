import { describe, expect, it, vi } from 'vitest';
import type { GenerateVideosOperation } from '@google/genai';

import { GenerationCancelledError, GenerationFailedError, GenerationTimeoutError } from './errors';
import { buildGenerateRequest, pollVideoOperation } from './videoApi';

function operation(overrides: Partial<GenerateVideosOperation> = {}): GenerateVideosOperation {
  return { done: false, ...overrides } as GenerateVideosOperation;
}

describe('buildGenerateRequest', () => {
  it('sends duration, aspect ratio and resolution', () => {
    const request = buildGenerateRequest({
      prompt: 'a cat surfing',
      modelId: 'veo-3.1-generate-preview',
      resolution: '1080p',
      aspectRatio: '9:16',
      durationSeconds: 6,
    });

    expect(request.model).toBe('veo-3.1-generate-preview');
    expect(request.prompt).toBe('a cat surfing');
    expect(request.config?.durationSeconds).toBe(6);
    expect(request.config?.aspectRatio).toBe('9:16');
    expect(request.config?.resolution).toBe('1080p');
    expect(request.config?.numberOfVideos).toBe(1);
  });

  it('falls back to a default prompt when none is given', () => {
    const request = buildGenerateRequest({
      prompt: '   ',
      modelId: 'veo-3.1-fast-generate-preview',
      resolution: '720p',
      aspectRatio: '16:9',
      durationSeconds: 4,
    });

    expect(request.prompt).toBe('A high quality video');
  });

  it('attaches the start and end frames', () => {
    const request = buildGenerateRequest({
      prompt: 'test',
      modelId: 'veo-3.1-generate-preview',
      resolution: '720p',
      aspectRatio: '16:9',
      durationSeconds: 8,
      startFrame: { data: 'start-bytes', mimeType: 'image/png', fileName: 'a.png' },
      endFrame: { data: 'end-bytes', mimeType: 'image/jpeg', fileName: 'b.jpg' },
    });

    expect(request.image?.imageBytes).toBe('start-bytes');
    expect(request.image?.mimeType).toBe('image/png');
    expect(request.config?.lastFrame?.imageBytes).toBe('end-bytes');
    expect(request.config?.lastFrame?.mimeType).toBe('image/jpeg');
  });
});

describe('pollVideoOperation', () => {
  it('returns the response as soon as the operation is done', async () => {
    const response = { generatedVideos: [] };
    const fetchOperation = vi.fn(async () => operation({ done: true, response }));

    const result = await pollVideoOperation(fetchOperation, operation(), {
      timeoutMs: 1000,
      intervalMs: 1,
      sleep: async () => undefined,
    });

    expect(result).toBe(response);
    expect(fetchOperation).toHaveBeenCalledTimes(1);
  });

  it('keeps polling until the operation finishes', async () => {
    const response = { generatedVideos: [] };
    const fetchOperation = vi
      .fn(async (_running: GenerateVideosOperation): Promise<GenerateVideosOperation> => operation())
      .mockResolvedValueOnce(operation())
      .mockResolvedValueOnce(operation({ done: true, response }));

    const result = await pollVideoOperation(fetchOperation, operation(), {
      timeoutMs: 1000,
      intervalMs: 1,
      sleep: async () => undefined,
    });

    expect(result).toBe(response);
    expect(fetchOperation).toHaveBeenCalledTimes(2);
  });

  it('stops when the timeout is reached', async () => {
    const fetchOperation = vi.fn(async () => operation());

    await expect(
      pollVideoOperation(fetchOperation, operation(), {
        timeoutMs: 0,
        intervalMs: 1,
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(GenerationTimeoutError);
  });

  it('stops when the caller cancels', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchOperation = vi.fn(async () => operation());

    await expect(
      pollVideoOperation(fetchOperation, operation(), {
        signal: controller.signal,
        timeoutMs: 1000,
        intervalMs: 1,
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(GenerationCancelledError);
  });

  it('turns an operation error into a failure', async () => {
    const fetchOperation = vi.fn(async () => operation({ done: true, error: { message: 'quota exceeded' } }));

    await expect(
      pollVideoOperation(fetchOperation, operation(), {
        timeoutMs: 1000,
        intervalMs: 1,
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(GenerationFailedError);
  });
});
