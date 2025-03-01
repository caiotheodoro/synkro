/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_AUTH_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  openAuthDrawer: (mode?: "login" | "register", theme?: string) => void;
  closeAuthDrawer: () => void;
  toastManager?: {
    showToast: (options: {
      title: string;
      description?: string;
      type?: "success" | "error" | "info" | "warning";
      duration?: number;
    }) => void;
  };
}
