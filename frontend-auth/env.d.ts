/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AUTH_COOKIE_NAME: string
  readonly VITE_AUTH_TOKEN_EXPIRY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 