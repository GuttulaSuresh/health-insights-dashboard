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
    // The optional on-device AI library (about 6 MB) is split into its own chunk and only downloaded when
    // someone turns that feature on, so its size does not affect normal page loads.
    build: { chunkSizeWarningLimit: 6500 },
  };
});
