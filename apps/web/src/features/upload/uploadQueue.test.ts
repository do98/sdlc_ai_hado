import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api';
import { messages } from '../../shared/lib/messages';
import { createUploadQueue } from './uploadQueue';
import type { UploadFn, UploadItem } from './uploadQueue';

// Các test dùng đồng hồ giả KHÔNG đi qua kiểm tra thật (FileReader) để thời gian hoàn toàn xác định;
// kiểm tra ALG-02 có test riêng (validate.test.ts) và test tích hợp ở cuối tệp này.
vi.mock('./validate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./validate')>();
  return {
    ...actual,
    checkFiles: vi.fn(async (files: File[]) => files.map((file) => ({ file, ok: true }))),
  };
});

interface Call {
  file: File;
  signal: AbortSignal;
  onProgress: (loaded: number, total: number) => void;
  resolve: () => void;
  reject: (e: unknown) => void;
}

/** Hàm tải lên điều khiển được từng yêu cầu, đồng thời đo số yêu cầu chạy cùng lúc. */
function controlled() {
  const calls: Call[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const upload: UploadFn = (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const done = () => {
        inFlight -= 1;
      };
      calls.push({
        file,
        signal,
        onProgress,
        resolve: () => {
          done();
          resolve({ id: `doc-${calls.length}`, status: 'PROCESSING' });
        },
        reject: (e) => {
          done();
          reject(e);
        },
      });
      signal.addEventListener('abort', () => {
        done();
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
  return { upload, calls, max: () => maxInFlight };
}

const f = (name: string) => new File(['%PDF-'], name);
const files = (n: number) => Array.from({ length: n }, (_, i) => f(`f${i}.pdf`));
const states = (items: UploadItem[]) => items.map((i) => i.state);

async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

describe('hàng đợi tải lên (đồng hồ giả)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('US006_AC1: không bao giờ có hơn 2 yêu cầu đồng thời; mỗi tệp đúng một POST; giữ thứ tự chọn', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(5));
    await flush();
    expect(c.calls.map((x) => x.file.name)).toEqual(['f0.pdf', 'f1.pdf']);
    expect(states(q.items)).toEqual(['UPLOADING', 'UPLOADING', 'QUEUED', 'QUEUED', 'QUEUED']);

    c.calls[0].resolve();
    await flush();
    expect(c.calls.map((x) => x.file.name)).toEqual(['f0.pdf', 'f1.pdf', 'f2.pdf']);
    c.calls[1].resolve();
    c.calls[2].resolve();
    await flush();
    c.calls[3].resolve();
    c.calls[4].resolve();
    await flush();

    expect(c.max()).toBe(2);
    expect(c.calls).toHaveLength(5);
    expect(states(q.items)).toEqual(Array(5).fill('ACCEPTED'));
  });

  it('tiến trình theo byte được quy ra phần trăm và không vượt 100', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].onProgress(250, 1000);
    expect(q.items[0].progress).toBe(25);
    c.calls[0].onProgress(1500, 1000);
    expect(q.items[0].progress).toBe(100);
    c.calls[0].onProgress(0, 0);
    expect(q.items[0].progress).toBe(0);
  });

  it('US002_AC2: lỗi mạng tự thử lại sau 1 s, 2 s, 4 s rồi dừng ở FAILED kèm nút "Thử lại"', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    expect(c.calls).toHaveLength(1);

    c.calls[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.items[0].state).toBe('RETRYING');
    await vi.advanceTimersByTimeAsync(999);
    expect(c.calls).toHaveLength(1); // chưa đủ 1 s
    await vi.advanceTimersByTimeAsync(1);
    expect(c.calls).toHaveLength(2);

    c.calls[1].reject(new ApiError(0, 'NETWORK_ERROR'));
    await vi.advanceTimersByTimeAsync(1999);
    expect(c.calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(c.calls).toHaveLength(3);

    c.calls[2].reject(new ApiError(0, 'NETWORK_ERROR'));
    await vi.advanceTimersByTimeAsync(3999);
    expect(c.calls).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(c.calls).toHaveLength(4);

    c.calls[3].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.items[0].state).toBe('FAILED');
    expect(q.items[0].error).toBe(messages.auth.network);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(c.calls).toHaveLength(4); // hết lượt tự thử, không thử thêm
  });

  it('lỗi 5xx cũng được tự thử lại', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(503, 'NOT_READY'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(c.calls).toHaveLength(2);
    c.calls[1].resolve();
    await flush();
    expect(q.items[0].state).toBe('ACCEPTED');
  });

  it.each([
    [415, 'NOT_PDF', 'REJECTED'],
    [413, 'FILE_TOO_LARGE', 'REJECTED'],
    [409, 'WORKSPACE_FULL', 'REJECTED'],
    [400, 'INVALID_REQUEST', 'REJECTED'],
    [429, 'RATE_LIMITED', 'FAILED'],
    [401, 'UNAUTHENTICATED', 'FAILED'],
  ])('US003: lỗi %i %s KHÔNG tự thử lại (→ %s)', async (status, code, finalState) => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(status, code));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(c.calls).toHaveLength(1);
    expect(q.items[0].state).toBe(finalState);
    expect(q.items[0].error).toBeTruthy();
  });

  it('lỗi 4xx hiển thị đúng thông điệp tiếng Việt theo mã', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(415, 'NOT_PDF'));
    await flush();
    expect(q.items[0].error).toBe(messages.errors.notPdf);
    expect(q.status.announcement).toContain(messages.errors.notPdf);
  });

  it('US002_AC2: "Thử lại" thủ công làm lại từ đầu và thành công thì gọi onAccepted; dòng tự ẩn sau vài giây', async () => {
    const c = controlled();
    const onAccepted = vi.fn();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0, onAccepted });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(429, 'RATE_LIMITED'));
    await flush();
    expect(q.items[0].state).toBe('FAILED');

    q.retry(q.items[0].id);
    await flush();
    expect(c.calls).toHaveLength(2);
    expect(q.items[0].state).toBe('UPLOADING');
    c.calls[1].resolve();
    await flush();
    expect(onAccepted).toHaveBeenCalledTimes(1);
    expect(q.items[0].state).toBe('ACCEPTED');

    await vi.advanceTimersByTimeAsync(4000);
    expect(q.items).toHaveLength(0);
  });

  it('thử lại thủ công đặt lại bộ đếm: lại được tự thử lại đủ 3 lần', async () => {
    const c = controlled();
    const q = createUploadQueue({
      upload: c.upload,
      existingCount: () => 0,
      retryDelaysMs: [10, 10, 10],
    });
    await q.add(files(1));
    await flush();
    for (let i = 0; i < 4; i++) {
      c.calls[i].reject(new ApiError(0, 'NETWORK_ERROR'));
      await vi.advanceTimersByTimeAsync(10);
    }
    expect(q.items[0].state).toBe('FAILED');
    q.retry(q.items[0].id);
    await flush();
    c.calls[4].reject(new ApiError(0, 'NETWORK_ERROR'));
    await vi.advanceTimersByTimeAsync(10);
    expect(c.calls).toHaveLength(6);
  });

  it('hủy tệp đang tải: yêu cầu bị abort, dòng bị gỡ, tệp kế tiếp được chạy', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(3));
    await flush();
    q.cancel(q.items[0].id);
    await flush();
    expect(c.calls[0].signal.aborted).toBe(true);
    expect(q.items.map((i) => i.name)).toEqual(['f1.pdf', 'f2.pdf']);
    expect(c.calls).toHaveLength(3); // f2 đã được nhường chỗ
    expect(q.status.announcement).toBe(messages.upload.announce.cancelled('f0.pdf'));
  });

  it('hủy tệp đang chờ trong hàng: không bao giờ được gửi', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(3));
    await flush();
    q.cancel(q.items[2].id);
    c.calls[0].resolve();
    c.calls[1].resolve();
    await flush();
    expect(c.calls.map((x) => x.file.name)).toEqual(['f0.pdf', 'f1.pdf']);
  });

  it('hủy tệp đang chờ thử lại: không còn lần thử nào sau đó', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.items[0].state).toBe('RETRYING');
    q.cancel(q.items[0].id);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(c.calls).toHaveLength(1);
    expect(q.items).toHaveLength(0);
  });

  it('trong lúc một tệp chờ thử lại, tệp khác vẫn được tải (không giữ chỗ)', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0, concurrency: 1 });
    await q.add(files(2));
    await flush();
    c.calls[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.items[0].state).toBe('RETRYING');
    expect(c.calls.map((x) => x.file.name)).toEqual(['f0.pdf', 'f1.pdf']);
    expect(c.max()).toBe(1);
  });

  it('đếm ngược thời gian chờ thử lại được cập nhật', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.items[0].retryInSeconds).toBe(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(q.items[0].retryInSeconds).toBeLessThanOrEqual(1);
  });

  it('đóng dòng bị từ chối/thất bại; không đóng được dòng đang tải', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(2));
    await flush();
    q.dismiss(q.items[0].id);
    expect(q.items).toHaveLength(2);
    c.calls[0].reject(new ApiError(415, 'NOT_PDF'));
    await flush();
    q.dismiss(q.items[0].id);
    expect(q.items.map((i) => i.name)).toEqual(['f1.pdf']);
  });

  it('dispose hủy mọi yêu cầu đang chạy và xóa hàng đợi', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(3));
    await flush();
    q.dispose();
    expect(c.calls.every((x) => x.signal.aborted)).toBe(true);
    expect(q.items).toHaveLength(0);
  });

  it('thông báo cho trình đọc màn hình ở mỗi chuyển trạng thái chính', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(1));
    await flush();
    c.calls[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await flush();
    expect(q.status.announcement).toBe(messages.upload.announce.retrying('f0.pdf'));
    await vi.advanceTimersByTimeAsync(1000);
    c.calls[1].resolve();
    await flush();
    expect(q.status.announcement).toBe(messages.upload.announce.accepted('f0.pdf'));
  });
});

describe('hàng đợi + kiểm tra ALG-02 thật (đồng hồ thật)', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    const v = await import('./validate');
    const actual = await vi.importActual<typeof import('./validate')>('./validate');
    vi.mocked(v.checkFiles).mockImplementation(actual.checkFiles);
  });

  it('US006_AC2: tệp sai hiện REJECTED kèm lý do, tệp đúng vẫn được tải', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add([new File(['PK'], 'a.docx'), f('b.pdf')]);
    expect(q.items.map((i) => [i.name, i.state])).toEqual([
      ['a.docx', 'REJECTED'],
      ['b.pdf', 'UPLOADING'],
    ]);
    expect(q.items[0].error).toBe(messages.errors.notPdf);
    expect(c.calls.map((x) => x.file.name)).toEqual(['b.pdf']); // tệp sai không bị gửi
  });

  it('US006_AC3: đã có 19 + chọn 3 tệp hợp lệ → 1 tệp vào hàng, 2 tệp bị từ chối hết chỗ', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 19 });
    await q.add(files(3));
    expect(q.items.map((i) => i.state)).toEqual(['UPLOADING', 'REJECTED', 'REJECTED']);
    expect(q.items[1].error).toBe(messages.errors.workspaceFull);
  });

  it('tệp đang chờ trong hàng được tính vào số chỗ khi thêm đợt tiếp theo', async () => {
    const c = controlled();
    const q = createUploadQueue({ upload: c.upload, existingCount: () => 0 });
    await q.add(files(15));
    await q.add(files(10));
    const rejected = q.items.filter((i) => i.state === 'REJECTED');
    expect(rejected).toHaveLength(5);
    expect(c.max()).toBe(2);
  });
});
