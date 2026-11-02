import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const USER = 'minh';
const PASS = 'mat-khau-dung-123';

interface DropFile {
  name: string;
  content: string;
}

const PDF = (name: string): DropFile => ({ name, content: '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n' });

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(USER);
  await page.getByLabel('Mật khẩu').fill(PASS);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Xin chào, minh')).toBeVisible();
}

/** Mô phỏng kéo-thả tệp vào cửa sổ: dragenter → dragover → drop với DataTransfer thật. */
async function dropFiles(page: Page, files: DropFile[]): Promise<void> {
  await page.evaluate((list) => {
    const dt = new DataTransfer();
    for (const f of list) dt.items.add(new File([f.content], f.name, { type: 'application/pdf' }));
    for (const type of ['dragenter', 'dragover', 'drop']) {
      document.body.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
    }
  }, files);
}

const row = (page: Page, name: string) => page.locator('li[data-state]', { hasText: name });

test.describe('T10 — tải PDF lên với API giả MSW (service worker thật)', () => {
  test('US002_AC1: nút "Tải PDF lên" chọn nhiều tệp bằng bàn phím → tài liệu được nhận', async ({
    page,
  }) => {
    await signIn(page);
    const button = page.getByRole('button', { name: 'Tải PDF lên' });
    await button.focus();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const fc = await chooser;
    expect(fc.isMultiple()).toBe(true);
    await fc.setFiles([
      { name: 'bao-cao.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 a') },
      { name: 'hop-dong.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 b') },
    ]);
    await expect(page.getByTestId('slots')).toContainText('2/20', { timeout: 10_000 });
  });

  test('US002_AC1: kéo-thả vào cửa sổ hiện lớp phủ rồi nhận tệp', async ({ page }) => {
    await signIn(page);
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['%PDF-1.4'], 'keo-tha.pdf', { type: 'application/pdf' }));
      document.body.dispatchEvent(
        new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
    });
    await expect(page.getByTestId('drop-overlay')).toBeVisible();
    await dropFiles(page, [PDF('keo-tha.pdf')]);
    await expect(page.getByTestId('drop-overlay')).toBeHidden();
    await expect(page.getByTestId('announcer')).toContainText('keo-tha.pdf');
  });

  test('US006_AC2: chọn lẫn tệp sai và đúng → tệp sai hiện lý do, tệp đúng vẫn được nhận', async ({
    page,
  }) => {
    await signIn(page);
    await dropFiles(page, [
      { name: 'bang-tinh.xlsx', content: 'PK\u0003\u0004' },
      { name: 'gia-pdf.pdf', content: 'khong phai pdf' },
      PDF('that.pdf'),
    ]);
    await expect(row(page, 'bang-tinh.xlsx')).toHaveAttribute('data-state', 'REJECTED');
    await expect(row(page, 'gia-pdf.pdf')).toHaveAttribute('data-state', 'REJECTED');
    await expect(row(page, 'bang-tinh.xlsx')).toContainText('không phải PDF');
    await expect(page.getByTestId('slots')).toContainText('1/20');
  });
});

// ---------------------------------------------------------------------------------------------
// Các test dưới đây tự mô phỏng API bằng page.route để cắt mạng / trả lỗi theo kịch bản
// ---------------------------------------------------------------------------------------------
test.describe('T10 — hàng đợi, thử lại, lỗi (page.route)', () => {
  test.use({ serviceWorkers: 'block' });

  /** API giả luôn trả phiên hợp lệ nên vào thẳng trang chính. */
  async function openHome(page: Page): Promise<void> {
    await page.goto('/');
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
  }

  type Behavior = 'abort' | 'ok' | '503' | '415' | '413';

  /** `script[i]` là cách xử lý lần POST thứ i (hết kịch bản → ok). */
  async function mockApi(page: Page, script: Behavior[]): Promise<{ posts: () => number }> {
    let posts = 0;
    let stored = 0;
    const json = (status: number, body: unknown) => ({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        if (path === '/api/me')
          return route.fulfill(json(200, { id: 'u1', username: USER, role: 'MEMBER' }));
        if (path === '/api/auth/login') return route.fulfill({ status: 204 });
        if (path === '/api/documents' && req.method() === 'GET') {
          return route.fulfill(json(200, { items: [], count: stored, limit: 20 }));
        }
        if (path === '/api/documents' && req.method() === 'POST') {
          const step = script[posts] ?? 'ok';
          posts += 1;
          if (step === 'abort') return route.abort('connectionreset');
          if (step === '503') return route.fulfill(json(503, { code: 'NOT_READY' }));
          if (step === '415') return route.fulfill(json(415, { code: 'NOT_PDF' }));
          if (step === '413')
            return route.fulfill({ status: 413, contentType: 'text/html', body: '<h1>413</h1>' });
          stored += 1;
          return route.fulfill(json(202, { id: `d${stored}`, status: 'PROCESSING' }));
        }
        return route.fulfill(json(404, { code: 'NOT_FOUND' }));
      },
    );
    return { posts: () => posts };
  }

  test('US002_AC2: cắt mạng → tự thử lại sau ~1 s và tải thành công khi mạng hồi phục', async ({
    page,
  }) => {
    const api = await mockApi(page, ['abort']);
    await openHome(page);
    await dropFiles(page, [PDF('mang-yeu.pdf')]);
    await expect(row(page, 'mang-yeu.pdf')).toHaveAttribute('data-state', 'RETRYING');
    await expect(page.getByTestId('announcer')).toContainText('mang-yeu.pdf');
    await expect(page.getByTestId('announcer')).toContainText('đã tải lên', { timeout: 8000 });
    expect(api.posts()).toBe(2);
  });

  test('US002_AC2: mạng hỏng liên tục → sau 3 lần tự thử (1 s, 2 s, 4 s) hiện "Thử lại"; bấm thì thành công', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const api = await mockApi(page, ['abort', 'abort', 'abort', 'abort']);
    await openHome(page);
    await dropFiles(page, [PDF('dut-mang.pdf')]);
    const retry = page.getByRole('button', { name: /Thử lại/ });
    await expect(retry).toBeVisible({ timeout: 20_000 });
    await expect(row(page, 'dut-mang.pdf')).toHaveAttribute('data-state', 'FAILED');
    expect(api.posts()).toBe(4); // 1 lần đầu + 3 lần tự thử, không hơn
    await retry.click();
    await expect(page.getByTestId('announcer')).toContainText('đã tải lên', { timeout: 8000 });
    expect(api.posts()).toBe(5);
  });

  test('US002_AC2: lỗi 5xx cũng tự thử lại', async ({ page }) => {
    const api = await mockApi(page, ['503']);
    await openHome(page);
    await dropFiles(page, [PDF('loi-5xx.pdf')]);
    await expect(page.getByTestId('announcer')).toContainText('đã tải lên', { timeout: 8000 });
    expect(api.posts()).toBe(2);
  });

  test('US003_AC1: máy chủ trả 415 → hiện lý do, KHÔNG tự thử lại', async ({ page }) => {
    const api = await mockApi(page, ['415']);
    await openHome(page);
    await dropFiles(page, [PDF('bi-tu-choi.pdf')]);
    await expect(row(page, 'bi-tu-choi.pdf')).toHaveAttribute('data-state', 'REJECTED');
    await page.waitForTimeout(2500); // dài hơn lượt thử lại đầu tiên (1 s)
    expect(api.posts()).toBe(1);
    await expect(page.getByRole('button', { name: /Thử lại/ })).toHaveCount(0);
  });

  test('US003_AC3: máy chủ trả 413 không có JSON → báo tệp quá lớn, không thử lại', async ({
    page,
  }) => {
    const api = await mockApi(page, ['413']);
    await openHome(page);
    await dropFiles(page, [PDF('qua-lon.pdf')]);
    await expect(row(page, 'qua-lon.pdf')).toHaveAttribute('data-state', 'REJECTED');
    await expect(row(page, 'qua-lon.pdf')).toContainText('10 MB');
    await page.waitForTimeout(1500);
    expect(api.posts()).toBe(1);
  });

  test('US006_AC1: chọn 5 tệp → mỗi tệp một POST, tối đa 2 yêu cầu đồng thời', async ({ page }) => {
    let inFlight = 0;
    let maxInFlight = 0;
    let total = 0;
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        const ok = (status: number, body: unknown) =>
          route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        if (path === '/api/me') return ok(200, { id: 'u1', username: USER, role: 'MEMBER' });
        if (path === '/api/auth/login') return route.fulfill({ status: 204 });
        if (path === '/api/documents' && req.method() === 'GET')
          return ok(200, { items: [], count: 0, limit: 20 });
        if (path === '/api/documents' && req.method() === 'POST') {
          total += 1;
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((r) => setTimeout(r, 400));
          inFlight -= 1;
          return ok(202, { id: `d${total}`, status: 'PROCESSING' });
        }
        return ok(404, { code: 'NOT_FOUND' });
      },
    );
    await openHome(page);
    await dropFiles(
      page,
      [1, 2, 3, 4, 5].map((n) => PDF(`t${n}.pdf`)),
    );
    await expect.poll(() => total, { timeout: 10_000 }).toBe(5);
    await expect(page.getByTestId('announcer')).toContainText('t5.pdf', { timeout: 10_000 });
    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(maxInFlight).toBeGreaterThan(0);
  });

  test('US006_AC1: hủy một tệp đang tải → dòng biến mất', async ({ page }) => {
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        const ok = (status: number, body: unknown) =>
          route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        if (path === '/api/me') return ok(200, { id: 'u1', username: USER, role: 'MEMBER' });
        if (path === '/api/auth/login') return route.fulfill({ status: 204 });
        if (path === '/api/documents' && req.method() === 'GET')
          return ok(200, { items: [], count: 0, limit: 20 });
        if (path === '/api/documents' && req.method() === 'POST') {
          await new Promise((r) => setTimeout(r, 15_000)); // treo để kịp bấm Hủy
          return route.abort().catch(() => undefined);
        }
        return ok(404, { code: 'NOT_FOUND' });
      },
    );
    await openHome(page);
    await dropFiles(page, [PDF('se-huy.pdf')]);
    await expect(row(page, 'se-huy.pdf')).toHaveAttribute('data-state', 'UPLOADING');
    await page.getByRole('button', { name: /Hủy.*se-huy\.pdf/ }).click();
    await expect(row(page, 'se-huy.pdf')).toHaveCount(0);
  });
});
