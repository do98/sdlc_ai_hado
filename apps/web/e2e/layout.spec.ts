import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Chạy với API giả MSW trong trình duyệt (service worker thật) — không cần backend.
const USER = 'minh';
const PASS = 'mat-khau-dung-123';

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(USER);
  await page.getByLabel('Mật khẩu').fill(PASS);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Xin chào, minh')).toBeVisible();
}

async function noHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

test.describe('T02/T05 — giao diện chạy trên API giả MSW', () => {
  test('đăng nhập bằng API giả thật sự (service worker), sai mật khẩu bị từ chối', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill(USER);
    await page.getByLabel('Mật khẩu').fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('alert')).toContainText('Không đăng nhập được');
    await page.getByLabel('Mật khẩu').fill(PASS);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Xin chào, minh')).toBeVisible();
    await expect(
      page.locator('#panel-documents').getByRole('heading', { name: 'Tài liệu' }),
    ).toBeVisible();
  });

  test('desktop ≥ 1280 px: ba cột Tài liệu · Hội thoại · Nguồn hiển thị đồng thời', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await signIn(page);
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-breakpoint', 'desktop');
    await expect(page.locator('#panel-documents')).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#panel-source')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('tablet 1024 px: ngăn tài liệu và ngăn nguồn là ngăn trượt, Esc đóng', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await signIn(page);
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-breakpoint', 'tablet');
    await expect(page.locator('#panel-documents')).toBeHidden();
    await expect(page.locator('#panel-source')).toBeHidden();

    await page.getByRole('button', { name: 'Mở danh sách tài liệu' }).click();
    await expect(page.locator('#panel-documents')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel-documents')).toBeHidden();

    await page.getByRole('button', { name: 'Mở ngăn nguồn' }).click();
    await expect(page.locator('#panel-source')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng ngăn' }).click();
    await expect(page.locator('#panel-source')).toBeHidden();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('tablet 768 px (mép dưới): vẫn là bố cục tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await signIn(page);
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-breakpoint', 'tablet');
  });

  test('mobile 400 px: một khu vực mỗi lần, chuyển bằng thanh tab', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await signIn(page);
    await expect(page.getByTestId('app-shell')).toHaveAttribute('data-breakpoint', 'mobile');
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#panel-documents')).toBeHidden();
    await page
      .getByRole('navigation', { name: 'Chuyển khu vực' })
      .getByRole('button', { name: 'Tài liệu' })
      .click();
    await expect(page.locator('#panel-documents')).toBeVisible();
    await expect(page.locator('#main-content')).toBeHidden();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  for (const width of [320, 768, 1024, 1280, 2560]) {
    test(`không cuộn ngang ở ${width} px (UXS-04)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/login');
      expect(await noHorizontalScroll(page)).toBe(true);
      await signIn(page);
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }

  test('nút và ô nhập có chiều cao chạm tối thiểu 32 px (desktop)', async ({ page }) => {
    await page.goto('/login');
    for (const locator of [
      page.getByLabel('Tên đăng nhập'),
      page.getByRole('button', { name: 'Đăng nhập' }),
    ]) {
      const box = await locator.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(32);
    }
  });
});

test.describe('T02 — trang thử bộ thành phần (chỉ có khi chạy dev)', () => {
  test('hiển thị đủ 6 thành phần và các trạng thái; không cần đăng nhập', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page.getByRole('heading', { name: 'Bộ thành phần giao diện' })).toBeVisible();
    for (const name of [
      'Nút',
      'Ô nhập',
      'Hộp thoại',
      'Thông báo ngắn',
      'Gợi ý',
      'Khung chờ',
      'Ba trạng thái',
    ]) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Nút chính' }).first()).toBeEnabled();
    await expect(page.getByRole('button', { name: /Đang tải/ }).first()).toBeDisabled();
    await expect(page.getByText('Tên tệp không được để trống.').first()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('hộp thoại: mở bằng bàn phím, giữ focus bên trong, Esc đóng và trả focus về nút đã mở', async ({
    page,
  }) => {
    await page.goto('/design-system');
    const opener = page.getByRole('button', { name: 'Mở hộp thoại' });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Xác nhận thao tác' });
    await expect(dialog).toBeVisible();
    // Tab nhiều lần: focus không thoát khỏi hộp thoại
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(
        true,
      );
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('thông báo lỗi ở lại tới khi đóng; thông báo thành công tự ẩn', async ({ page }) => {
    await page.goto('/design-system');
    const toasts = page.getByRole('region', { name: /^Thông báo/ });
    await page.getByRole('button', { name: 'Hiện thông báo lỗi' }).click();
    await expect(toasts.getByText('Không thể hoàn tất thao tác.')).toBeVisible();
    await page.getByRole('button', { name: 'Hiện thông báo thành công' }).click();
    await expect(toasts.getByText('Đã lưu thay đổi.')).toBeVisible();
    await expect(toasts.getByText('Đã lưu thay đổi.')).toBeHidden({ timeout: 8000 }); // tự ẩn sau 5 giây
    await expect(toasts.getByText('Không thể hoàn tất thao tác.')).toBeVisible(); // lỗi vẫn còn
    await page.getByRole('button', { name: 'Đóng thông báo' }).click();
    await expect(toasts.getByText('Không thể hoàn tất thao tác.')).toBeHidden();
  });

  test('gợi ý hiện khi focus bàn phím', async ({ page }) => {
    await page.goto('/design-system');
    // Dùng phím Tab (focus bàn phím thật): nút ngay trước gợi ý là nút "Hiện thông báo lỗi"
    await page.getByRole('button', { name: 'Hiện thông báo lỗi' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Rê chuột hoặc focus vào đây' })).toBeFocused();
    await expect(page.getByRole('tooltip')).toContainText('Gợi ý hiện khi rê chuột');
  });

  test('ô nhập có bộ đếm hiển thị n/2000 theo điểm mã Unicode', async ({ page }) => {
    await page.goto('/design-system');
    const field = page.getByLabel('Câu hỏi có bộ đếm');
    await field.fill('Xin chào 😀');
    await expect(page.getByTestId('counter')).toHaveText('10/2000');
  });
});
