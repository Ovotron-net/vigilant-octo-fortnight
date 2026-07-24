/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_OPS_BASE_URL?: string;
  readonly VITE_POLL_MS?: string;
  readonly VITE_OPS_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
