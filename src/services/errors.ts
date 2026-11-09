/** Base class for every error this app raises on purpose. */
export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class GenerationCancelledError extends GenerationError {
  constructor(message = 'The generation was cancelled.') {
    super(message);
    this.name = 'GenerationCancelledError';
  }
}

export class GenerationTimeoutError extends GenerationError {
  constructor(timeoutMs: number) {
    super(`The generation took longer than ${Math.round(timeoutMs / 60_000)} minutes and was stopped.`);
    this.name = 'GenerationTimeoutError';
  }
}

export class GenerationFailedError extends GenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationFailedError';
  }
}

export function isCancellation(error: unknown): boolean {
  return error instanceof GenerationCancelledError;
}

/** Turns an unknown error into a message that is safe to show to the user. */
export function toDisplayMessage(error: unknown): string {
  if (error instanceof GenerationError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
