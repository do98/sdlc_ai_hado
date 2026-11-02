import { defineConfig, devices } from '@playwright/test';

// E2E giao diện chạy trên API GIẢ (page.route) để xác định và không cần backend/CSDL.
// Cục bộ trên Windows có thể dùng Edge sẵn có: PW_CHANNEL=msedge npm run e2e
// CI cài Chromium bằng `npx playwright install --with-deps chromium`.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    // Giao diện chạy với API giả (MSW) — cũng chính là kiểm chứng "chạy toàn bộ luồng không cần backend" (T05.c)
    env: { VITE_API_MOCK: 'true' },
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
