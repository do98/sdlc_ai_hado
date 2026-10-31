import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    testTimeout: 30000,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
