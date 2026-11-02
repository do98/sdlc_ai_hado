import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    // Dev: gọi API backend qua cùng origin (cookie phiên, không cần CORS). Backend mặc định ở cổng 8080.
    proxy: { '/api': process.env.DOCCHAT_API_URL ?? 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    testTimeout: 60000,
    // forks: MSW + luồng SSE trong worker threads làm worker thoát bất ngờ (lỗi bộ nhớ); tiến trình riêng ổn định hơn
    pool: 'forks',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
