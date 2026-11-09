/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional, local development only. Bundled into the client build, so never use a production key here. */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Optional base URL of a backend that proxies the video generation API. */
  readonly VITE_API_BASE_URL?: string;
}
