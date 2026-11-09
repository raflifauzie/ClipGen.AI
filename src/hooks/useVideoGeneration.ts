import { useCallback, useRef, useState } from 'react';

import { GENERATION_TIMEOUT_MS, LOADING_STEPS, POLL_INTERVAL_MS } from '../constants';
import { isCancellation, toDisplayMessage } from '../services/errors';
import { buildGenerateRequest, pollVideoOperation } from '../services/videoApi';
import type { GenerationInput, GenerationPhase } from '../types';

export interface GenerationOutcome {
  blob: Blob;
  mimeType: string;
}

export interface VideoGenerationState {
  phase: GenerationPhase;
  stepIndex: number;
  error: string;
  isRunning: boolean;
  generate: (input: GenerationInput) => Promise<GenerationOutcome | null>;
  cancel: () => void;
  resetError: () => void;
}

export function useVideoGeneration(apiKey: string | null): VideoGenerationState {
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const abortController = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortController.current?.abort();
  }, []);

  const resetError = useCallback(() => setError(''), []);

  const generate = useCallback(
    async (input: GenerationInput): Promise<GenerationOutcome | null> => {
      if (!apiKey) {
        setError('Add your Google AI API key before generating a video.');
        setPhase('failed');
        return null;
      }

      const controller = new AbortController();
      abortController.current = controller;

      setError('');
      setStepIndex(0);
      setPhase('submitting');

      try {
        // The SDK is heavy, so it is only downloaded when a generation starts.
        const { createClient, downloadVideo, fetchOperation, startVideoGeneration } = await import('../services/genaiClient');

        const client = createClient(apiKey);
        const request = buildGenerateRequest(input);
        const operation = await startVideoGeneration(client, request, controller.signal);

        setPhase('waiting');
        const response = await pollVideoOperation(
          (running) => {
            setStepIndex((current) => Math.min(current + 1, LOADING_STEPS.length - 2));
            return fetchOperation(client, running);
          },
          operation,
          {
            signal: controller.signal,
            timeoutMs: GENERATION_TIMEOUT_MS,
            intervalMs: POLL_INTERVAL_MS,
          },
        );

        setPhase('downloading');
        const video = await downloadVideo(response, apiKey, controller.signal);
        setPhase('done');
        return video;
      } catch (caught) {
        if (isCancellation(caught)) {
          setPhase('cancelled');
          setError('The generation was cancelled.');
        } else {
          setPhase('failed');
          setError(toDisplayMessage(caught));
        }
        return null;
      } finally {
        abortController.current = null;
      }
    },
    [apiKey],
  );

  return {
    phase,
    stepIndex,
    error,
    isRunning: phase === 'submitting' || phase === 'waiting' || phase === 'downloading',
    generate,
    cancel,
    resetError,
  };
}
