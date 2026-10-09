import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The service serves the built app from classpath:/static (see build.gradle, frontendBuild).
// In development, `npm run dev` proxies the API to a local backend.
const backend = process.env.DOODLE_BACKEND ?? 'http://localhost:9000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
    },
  },
  test: {
    environment: 'node',
  },
});
