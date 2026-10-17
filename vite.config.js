import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT) || 5173;
  return {
    plugins: [react()],
    // A relative base keeps the build portable: it works from any sub-path or static host.
    base: env.VITE_BASE_PATH || './',
    server: { port },
    preview: { port: Number(env.PREVIEW_PORT) || 4173 },
  };
});
