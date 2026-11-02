import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const USER = 'minh';
const PASS = 'mat-khau-dung-123';
const GENERIC_FAILURE =
  'Không đăng nhập được. Hãy kiểm tra tên đăng nhập và mật khẩu, hoặc thử lại sau ít phút.';

interface Server {
  alive: boolean;
  failed: number;
  documentCalls: number;
}

/** API giả có trạng thái: phiên, đếm lần sai (khóa sau 5), 401 khi phiên hết hạn. */
async function mockApi(page: Page): Promise<Server> {
  const s: Server = { alive: false, failed: 0, documentCalls: 0 };
  const json = (status: number, body?: unknown) => ({
    status,
    contentType: 'application/json',
    body: body === undefined ? '' : JSON.stringify(body),
  });
  // Chỉ chặn đường dẫn bắt đầu bằng /api/ (glob '**/api/**' sẽ chặn cả module nguồn /src/shared/api/...)
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      if (path === '/api/me') {
        return route.fulfill(
          s.alive
            ? json(200, { id: 'u1', username: USER, role: 'MEMBER' })
            : json(401, { code: 'UNAUTHENTICATED' }),
        );
      }
      if (path === '/api/auth/login') {
        const body = req.postDataJSON() as { username: string; password: string };
        if (s.failed >= 5) return route.fulfill(json(423, { code: 'ACCOUNT_LOCKED' }));
        if (body.username === USER && body.password === PASS) {
          s.alive = true;
          s.failed = 0;
          return route.fulfill({ status: 204 });
        }
        s.failed++;
        return route.fulfill(json(401, { code: 'INVALID_CREDENTIALS' }));
      }
      if (path === '/api/auth/logout') {
        s.alive = false;
        return route.fulfill({ status: 204 });
      }
      if (path === '/api/documents') {
        s.documentCalls++;
        return route.fulfill(s.alive ? json(200, []) : json(401, { code: 'UNAUTHENTICATED' }));
      }
      return route.fulfill(json(404, { code: 'NOT_FOUND' }));
    },
  );
  return s;
}

/** Đang ở /login với các tham số query mong đợi (không phụ thuộc cách mã hóa URL). */
async function expectLoginPage(page: Page, query: Record<string, string>) {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
  for (const [key, value] of Object.entries(query)) {
    expect(new URL(page.url()).searchParams.get(key)).toBe(value);
  }
}

async function loginViaForm(page: Page, user = USER, pass = PASS) {
  await page.getByLabel('Tên đăng nhập').fill(user);
  await page.getByLabel('Mật khẩu').fill(pass);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

// Các test này tự mô phỏng API bằng page.route; chặn service worker để MSW (nếu bật) không can thiệp
test.use({ serviceWorkers: 'block' });

test.describe('T04 — đăng nhập (giao diện)', () => {
  test('US001_AC1: chưa đăng nhập vào / → chuyển về /login và không gọi API dữ liệu', async ({
    page,
  }) => {
    const server = await mockApi(page);
    await page.goto('/');
    await expectLoginPage(page, { redirect: '/' });
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    expect(server.documentCalls).toBe(0);
  });

  test('đăng nhập xong quay lại đúng đường dẫn đích đã định vào', async ({ page }) => {
    await mockApi(page);
    await page.goto('/khong-co?x=1');
    await expectLoginPage(page, { redirect: '/khong-co?x=1' });
    await loginViaForm(page);
    await expect(page).toHaveURL('/khong-co?x=1');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  });

  test('US001_AC2: đăng nhập đúng vào màn hình chính, không có token trong bộ nhớ trình duyệt', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/login');
    await loginViaForm(page);
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
    const storage = await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
    }));
    expect(storage).toEqual({ local: 0, session: 0, cookie: '' });
  });

  test('tải lại trang vẫn còn phiên (khôi phục qua /api/me)', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await loginViaForm(page);
    await expect(page).toHaveURL('/');
    await page.reload();
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
  });

  test('US001_AC3: sai mật khẩu hiển thị thông điệp chung và ở lại trang đăng nhập', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/login');
    await loginViaForm(page, USER, 'sai-mat-khau');
    await expect(page.getByRole('alert')).toContainText(GENERIC_FAILURE);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel('Mật khẩu')).toHaveValue('');
  });

  test('bị khóa tạm (423) hiển thị CÙNG thông điệp, không nêu lý do', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    for (let i = 0; i < 5; i++) await loginViaForm(page, USER, `sai-${i}`);
    await loginViaForm(page, USER, PASS); // đúng mật khẩu nhưng đang bị khóa
    await expect(page.getByRole('alert')).toContainText(GENERIC_FAILURE);
    await expect(page).toHaveURL(/\/login/);
  });

  test('chỉ dùng bàn phím: Tab, gõ, Enter để đăng nhập', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await expect(page.getByLabel('Tên đăng nhập')).toBeVisible(); // chờ form hiển thị rồi mới dùng bàn phím
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Tên đăng nhập')).toBeFocused();
    await page.keyboard.type(USER);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Mật khẩu')).toBeFocused();
    await page.keyboard.type(PASS);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
  });

  test('US001_AC4: phiên hết hạn giữa chừng → về /login kèm thông báo, đăng nhập lại về trang cũ', async ({
    page,
  }) => {
    const server = await mockApi(page);
    await page.goto('/login?redirect=%2Fxem-tai-lieu');
    await loginViaForm(page);
    await expect(page).toHaveURL('/xem-tai-lieu');

    server.alive = false; // phiên hết hạn phía máy chủ
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

    await expectLoginPage(page, { redirect: '/xem-tai-lieu', reason: 'expired' });
    await expect(page.getByRole('status')).toContainText(
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    );
    await loginViaForm(page);
    await expect(page).toHaveURL('/xem-tai-lieu');
  });

  test('đăng xuất: về /login, không vào lại được trang cũ', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await loginViaForm(page);
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/');
    await expectLoginPage(page, { redirect: '/' });
    await expect(page.getByText('Xin chào, minh')).toHaveCount(0);
  });

  test('redirect độc hại (open redirect) bị bỏ qua', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login?redirect=https%3A%2F%2Fevil.example%2Fx');
    await loginViaForm(page);
    await expect(page).toHaveURL('/');
    expect(new URL(page.url()).hostname).toBe('localhost');
  });
});
