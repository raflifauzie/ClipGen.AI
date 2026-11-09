const STORAGE_KEY = 'clipgen.api-key';

/**
 * The API key is never baked into the bundle at build time.
 *
 * It is either typed in by the user for this browser session (sessionStorage,
 * cleared when the tab closes) or, for local development only, taken from
 * `VITE_GEMINI_API_KEY`. A production key in the frontend bundle is public.
 */
export function readStoredApiKey(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  } catch (error) {
    console.warn('Could not read the stored API key', error);
    return null;
  }
}

export function writeStoredApiKey(apiKey: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, apiKey.trim());
  } catch (error) {
    console.warn('Could not store the API key for this session', error);
  }
}

export function clearStoredApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear the stored API key', error);
  }
}

/** The key to use for this session, if any. */
export function resolveApiKey(): string | null {
  const stored = readStoredApiKey();
  if (stored) {
    return stored;
  }
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  return fromEnv ? fromEnv : null;
}

/** Backend base URL, when the app is pointed at a server that holds the key. */
export function resolveApiBaseUrl(): string | null {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, '') : null;
}
