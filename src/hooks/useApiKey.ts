import { useCallback, useEffect, useState } from 'react';

import { clearStoredApiKey, readStoredApiKey, writeStoredApiKey } from '../services/apiKey';

export interface ApiKeyState {
  apiKey: string | null;
  hasApiKey: boolean;
  setApiKey: (apiKey: string) => void;
  forgetApiKey: () => void;
}

/**
 * Holds the API key for this browser session only. The key is never written to
 * disk and never leaves the browser.
 */
export function useApiKey(): ApiKeyState {
  const [apiKey, setApiKeyState] = useState<string | null>(() => readStoredApiKey());

  useEffect(() => {
    // Another tab in the same session may have set or removed the key.
    const stored = readStoredApiKey();
    setApiKeyState((current) => (current === stored ? current : stored));
  }, []);

  const setApiKey = useCallback((nextKey: string) => {
    writeStoredApiKey(nextKey);
    setApiKeyState(nextKey.trim() || null);
  }, []);

  const forgetApiKey = useCallback(() => {
    clearStoredApiKey();
    setApiKeyState(null);
  }, []);

  return { apiKey, hasApiKey: Boolean(apiKey), setApiKey, forgetApiKey };
}
