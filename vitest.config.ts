import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests only cover pure logic (no DOM rendering yet).
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
