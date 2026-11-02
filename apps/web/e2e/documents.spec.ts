import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const USER = 'minh';
const PASS = 'mat-khau-dung-123';
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n');

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(USER);
  await page.getByLabel('Mật khẩu').fill(PASS);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Xin chào, minh')).toBeVisible();
}

async function uploadViaChooser(page: Page, names: string[]): Promise<void> {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Tải PDF lên' }).click();
  await (
    await chooser
  ).setFiles(names.map((name) => ({ name, mimeType: 'application/pdf', buffer: PDF_BYTES })));
}

const docRow = (page: Page, name: string) =>
  page.getByTestId('documents').locator('li', { hasText: name });

test.describe('T11 — danh sách tài liệu và cập nhật thời gian thực (API giả MSW + SSE giả)', () => {
  test('ST-04: chưa có tài liệu → trạng thái trống có nút "Tải PDF lên"; ô nhập bị khóa kèm giải thích', async ({
    page,
  }) => {
    await signIn(page);
    await expect(page.getByTestId('empty-state')).toContainText('Chưa có tài liệu nào');
    // chỉ có MỘT nút "Tải PDF lên" (nút của trạng thái trống), bấm vào mở hộp chọn tệp
    await expect(page.getByRole('button', { name: 'Tải PDF lên' })).toHaveCount(1);
    const box = page.getByLabel('Câu hỏi về tài liệu');
    await expect(box).toBeDisabled();
    await expect(page.getByTestId('question-help')).toContainText('Chưa có tài liệu sẵn sàng');
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('empty-state').getByRole('button', { name: 'Tải PDF lên' }).click();
    expect((await chooser).isMultiple()).toBe(true);
  });

  test('tải lên → "Đang xử lý" → tự chuyển "Sẵn sàng" không cần tải lại trang; thông báo aria-live', async ({
    page,
  }) => {
    await signIn(page);
    await uploadViaChooser(page, ['hop-dong.pdf']);
    const row = docRow(page, 'hop-dong.pdf');
    await expect(row).toHaveAttribute('data-status', 'processing', { timeout: 10_000 });
    await expect(row.getByTestId('doc-status')).toHaveText('Đang xử lý');
    // API giả xử lý nền ~3 s rồi phát sự kiện qua SSE
    await expect(row).toHaveAttribute('data-status', 'ready', { timeout: 10_000 });
    await expect(row.getByTestId('doc-status')).toHaveText('Sẵn sàng');
    await expect(page.getByTestId('doc-announcer')).toHaveText('«hop-dong.pdf» đã sẵn sàng.');
    await expect(page.getByTestId('doc-announcer')).toHaveAttribute('aria-live', 'polite');
    // đã có tài liệu sẵn sàng: giải thích của ô nhập đổi
    await expect(page.getByTestId('question-help')).toContainText('Đã có tài liệu sẵn sàng');
    // chỉ còn một hàng cho tài liệu (hàng cục bộ đã được thay bằng bản ghi máy chủ)
    await expect(page.locator('li', { hasText: 'hop-dong.pdf' })).toHaveCount(1);
  });

  test('AC-012: tên tệp quyết định kết quả — lỗi theo mã và cảnh báo trang không đọc được', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const names = [
      'tai-lieu-password.pdf',
      'ban-scan.pdf',
      'tep-corrupt.pdf',
      'toomany-pages.pdf',
      'nua-partial-scan.pdf',
    ];
    await uploadViaChooser(page, names);
    const expected: [string, string, string][] = [
      ['tai-lieu-password.pdf', 'error', 'Tệp có mật khẩu bảo vệ'],
      ['ban-scan.pdf', 'error', 'Tệp là ảnh scan'],
      ['tep-corrupt.pdf', 'error', 'Tệp bị hỏng'],
      ['toomany-pages.pdf', 'error', 'Tệp quá 100 trang'],
      ['nua-partial-scan.pdf', 'readyWarning', 'Một số trang không đọc được: 3, 7'],
    ];
    for (const [name, status, text] of expected) {
      const row = docRow(page, name);
      await expect(row).toHaveAttribute('data-status', status, { timeout: 15_000 });
      await expect(row.getByTestId('doc-detail')).toContainText(text);
    }
    await expect(docRow(page, 'ban-scan.pdf').getByTestId('doc-status')).toHaveText('Lỗi');
    await expect(docRow(page, 'nua-partial-scan.pdf').getByTestId('doc-status')).toHaveText(
      'Sẵn sàng, có cảnh báo',
    );
  });

  test('T11.d: đủ 20 tài liệu → bộ đếm 20/20 được nhấn mạnh và nút tải lên bị khóa', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const names = Array.from({ length: 20 }, (_, i) => `t${String(i + 1).padStart(2, '0')}.pdf`);
    await uploadViaChooser(page, names);
    await expect(page.getByTestId('slots')).toContainText('20/20', { timeout: 20_000 });
    await expect(page.getByTestId('slots')).toHaveClass(/font-semibold/);
    await expect(page.getByRole('button', { name: 'Đã đủ số tài liệu' })).toBeDisabled();
    // đủ 20 hàng thật từ danh sách máy chủ (hàng cục bộ đã được thay bằng bản ghi thật)
    await expect(page.getByTestId('documents').locator('li')).toHaveCount(20);
  });

  test('tên tệp chứa HTML được hiển thị như văn bản thuần', async ({ page }) => {
    await signIn(page);
    const evil = '<img src=x onerror=window.__xss=1>.pdf';
    await uploadViaChooser(page, [evil]);
    await expect(page.getByTestId('documents').getByText(evil)).toBeVisible({ timeout: 10_000 });
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });
});

// Các test dưới đây dựng API bằng page.route (chặn service worker) để điều khiển luồng /api/events thật
test.describe('T11 — mất kết nối thời gian thực rồi nối lại (page.route)', () => {
  test.use({ serviceWorkers: 'block' });

  test('mất kết nối → chỉ báo "đang thử lại" không chặn thao tác; nối lại có Last-Event-ID và nhận cập nhật bị lỡ', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const seenLastEventIds: (string | undefined)[] = [];
    let eventCalls = 0;
    let listCalls = 0;
    const doc = (status: 'PROCESSING' | 'READY') => ({
      id: 'd1',
      name: 'bao-cao.pdf',
      sizeBytes: 1000,
      pageCount: status === 'READY' ? 3 : null,
      status,
      errorCode: null,
      warning: null,
      uploadedBy: 'u1',
      uploadedAt: '2026-11-02T00:00:00Z',
    });
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        const json = (status: number, body: unknown) =>
          route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        if (path === '/api/me') return json(200, { id: 'u1', username: USER, role: 'MEMBER' });
        if (path === '/api/documents' && req.method() === 'GET') {
          listCalls += 1;
          return json(200, { items: [doc('PROCESSING')], count: 1, limit: 20 });
        }
        if (path === '/api/events') {
          eventCalls += 1;
          seenLastEventIds.push(req.headers()['last-event-id']);
          if (eventCalls === 1) {
            // kết nối đầu: nhận một sự kiện (id 5) rồi luồng đóng đột ngột
            return route.fulfill({
              status: 200,
              contentType: 'text/event-stream',
              body: 'id: 4\nevent: document.updated\ndata: {"id":"d1","status":"PROCESSING","errorCode":null,"warning":null,"pageCount":null}\n\nid: 5\nevent: document.updated\ndata: {"id":"d1","status":"PROCESSING","errorCode":null,"warning":null,"pageCount":null}\n\n',
            });
          }
          if (eventCalls === 2) return route.abort('connectionreset'); // đang mất mạng
          // nối lại thành công: máy chủ phát bù sự kiện bị lỡ (id 6) → tài liệu d1 sẵn sàng
          return route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: 'id: 6\nevent: document.updated\ndata: {"id":"d1","status":"READY","errorCode":null,"warning":null,"pageCount":3}\n\n: ping\n\n',
          });
        }
        return json(404, { code: 'NOT_FOUND' });
      },
    );
    await page.goto('/');
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
    const row = page.getByTestId('documents').locator('li', { hasText: 'bao-cao.pdf' });
    await expect(row).toHaveAttribute('data-status', 'processing');

    // luồng đóng → chỉ báo mất kết nối, danh sách vẫn thao tác được
    await expect(page.getByTestId('conn-lost')).toContainText('Đã mất kết nối thời gian thực');
    await expect(row).toBeVisible();

    // nối lại (1 s, rồi 2 s): lần thành công nhận cập nhật bị lỡ. (Phản hồi giả của page.route hữu hạn nên luồng lại đóng
    // ngay và kênh nối lại tiếp; việc chỉ báo biến mất khi nối được đã có test đơn vị — luồng dài hạn thì có ở bộ E2E dùng MSW.)
    await expect(row).toHaveAttribute('data-status', 'ready', { timeout: 15_000 });
    expect(eventCalls).toBeGreaterThanOrEqual(3);
    expect(seenLastEventIds[0]).toBeUndefined();
    expect(seenLastEventIds[1]).toBe('5'); // gửi lại id cuối cùng đã nhận
    expect(seenLastEventIds[2]).toBe('5');
    // gián đoạn ngắn và còn id → không tải lại cả danh sách
    expect(listCalls).toBe(1);
  });

  test('401 khi mở luồng sự kiện → về trang đăng nhập với thông báo hết phiên', async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const path = new URL(route.request().url()).pathname;
        const json = (status: number, body: unknown) =>
          route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        if (path === '/api/me') return json(200, { id: 'u1', username: USER, role: 'MEMBER' });
        if (path === '/api/documents') return json(200, { items: [], count: 0, limit: 20 });
        if (path === '/api/events') return json(401, { code: 'UNAUTHENTICATED' });
        return json(404, { code: 'NOT_FOUND' });
      },
    );
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByText('Phiên đăng nhập đã hết hạn')).toBeVisible();
  });
});
