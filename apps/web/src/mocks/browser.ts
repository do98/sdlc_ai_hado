import { setupWorker } from 'msw/browser';
import { MockDb } from './db';
import { createHandlers } from './handlers';

/**
 * Chạy API giả trong trình duyệt (chỉ khi `VITE_API_MOCK=true` ở chế độ dev). Tài khoản: minh / mat-khau-dung-123.
 * Từ khóa trong câu hỏi chọn kịch bản: #not_found, #partial, #interrupted, #timeout, #llm-error.
 * Tên tệp chọn kết quả xử lý: password, scan, partial-scan, corrupt, toomany.
 */
export async function startMockWorker(): Promise<void> {
  const db = new MockDb();
  const worker = setupWorker(...createHandlers(db));
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}
