import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API key is never injected at build time anymore (see src/services/apiKey.ts).
// The browser asks the user for a key at runtime, or talks to a backend that holds it.
export default defineConfig(() => ({
  server: {
    port: 3000,
    // Loopback by default so the dev server is not reachable from the local network.
    // Set DEV_HOST=0.0.0.0 explicitly when you really need LAN/device access.
    host: process.env.DEV_HOST ?? '127.0.0.1',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-genai': ['@google/genai'],
        },
      },
    },
  },
}));
