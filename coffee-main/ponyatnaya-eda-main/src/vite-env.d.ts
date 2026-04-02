/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL Django без суффикса /api, например http://127.0.0.1:8000 */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
