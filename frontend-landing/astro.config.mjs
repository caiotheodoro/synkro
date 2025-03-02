// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), vue()],
  server: {
    port: 3000
  },
  vite: {
    define: {
      "import.meta.env.PUBLIC_AUTH_TOKEN_KEY": JSON.stringify(
        process.env.PUBLIC_AUTH_TOKEN_KEY || "synkro_token"
      ),
      "import.meta.env.PUBLIC_AUTH_USER_KEY": JSON.stringify(
        process.env.PUBLIC_AUTH_USER_KEY || "synkro_user"
      ),
      "import.meta.env.PUBLIC_DASHBOARD_SERVICE_URL": JSON.stringify(
        process.env.PUBLIC_DASHBOARD_SERVICE_URL || "http://localhost:3003"
      ),
      "import.meta.env.PUBLIC_AUTH_INTERFACE_URL": JSON.stringify(
        process.env.PUBLIC_AUTH_INTERFACE_URL || "http://localhost:5173"
      ),
      "import.meta.env.PUBLIC_AUTH_SERVICE_URL": JSON.stringify(
        process.env.PUBLIC_AUTH_SERVICE_URL || "http://localhost:3000"
      ),
    },
  },
});
