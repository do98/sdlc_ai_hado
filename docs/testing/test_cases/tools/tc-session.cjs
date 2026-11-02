// Trợ giúp chạy một ca kiểm thử: mở Edge tại http://localhost:5173/, quay video, chụp ảnh đánh số,
// lưu mọi thứ vào ./test_reports/<ID>/ (video/, screenshots/, data/) tính từ gốc repo.
//
// Dùng:
//   const { startSession } = require('./docs/testing/test_cases/tools/tc-session.cjs');
//   const s = await startSession('TC-US001-AC1');          // s.page là trang Playwright
//   await s.page.goto(s.baseUrl);  await s.shot('mo-trang');
//   await s.login();                                       // đăng nhập tài khoản dev, tự chụp ảnh
//   const result = await s.finish();                       // đóng trình duyệt, lưu video <ID>.webm
//
// Cần: cd apps/web && npm install (để có @playwright/test) và Microsoft Edge.
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '../../../..');
const BASE_URL = process.env.TC_BASE_URL || 'http://localhost:5173/';
const USER = process.env.TC_USER || 'admin';
const PASS = process.env.TC_PASS || 'Docchat-Dev-2026!';

async function startSession(id, options = {}) {
  const { chromium } = require(path.join(REPO, 'apps/web/node_modules/@playwright/test'));
  const dir = path.join(REPO, 'test_reports', id);
  const shots = path.join(dir, 'screenshots');
  const video = path.join(dir, 'video');
  const data = path.join(dir, 'data');
  for (const d of [shots, video, data]) fs.mkdirSync(d, { recursive: true });

  const browser = await chromium.launch({ channel: options.channel || 'msedge' });
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 800 },
    recordVideo: { dir: video, size: options.viewport || { width: 1280, height: 800 } },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const log = [];
  page.on('console', (m) => log.push(`[console.${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`));
  page.on('response', (r) => {
    if (r.url().includes('/api/')) log.push(`[http] ${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`);
  });

  let n = 0;
  const shot = async (name) => {
    n += 1;
    const file = `${String(n).padStart(2, '0')}-${name.replace(/[^A-Za-z0-9À-ỹ_-]+/g, '-')}.png`;
    await page.screenshot({ path: path.join(shots, file), fullPage: true });
    return file;
  };

  return {
    id,
    dir,
    page,
    context,
    browser,
    log,
    baseUrl: BASE_URL,
    dataDir: data,
    shot,
    async login(user = USER, pass = PASS) {
      await page.goto(BASE_URL + 'login');
      await shot('man-hinh-dang-nhap');
      await page.getByLabel(/tên đăng nhập/i).fill(user);
      await page.locator('input[type=password]').fill(pass);
      await page.getByRole('button', { name: /đăng nhập/i }).click();
      await page.waitForLoadState('networkidle');
      await shot('sau-khi-dang-nhap');
    },
    async finish() {
      fs.writeFileSync(path.join(data, 'console-va-mang.log'), log.join('\n'), 'utf8');
      const vid = page.video();
      await context.close(); // video chỉ được ghi ra tệp khi đóng context
      if (vid) {
        const src = await vid.path();
        const dest = path.join(video, `${id}.webm`);
        fs.renameSync(src, dest);
      }
      await browser.close();
      return { dir, video: path.join(video, `${id}.webm`), screenshots: n };
    },
  };
}

module.exports = { startSession };
