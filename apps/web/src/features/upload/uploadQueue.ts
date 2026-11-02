import { reactive } from 'vue';
import { ApiError, messageForError } from '../../shared/api';
import type { UploadAccepted } from '../../shared/api';
import { messages } from '../../shared/lib/messages';
import { checkFiles } from './validate';

export type UploadState = 'QUEUED' | 'UPLOADING' | 'RETRYING' | 'ACCEPTED' | 'REJECTED' | 'FAILED';

export interface UploadItem {
  id: number;
  name: string;
  size: number;
  state: UploadState;
  /** 0–100 */
  progress: number;
  /** Thông điệp tiếng Việt khi REJECTED/FAILED. */
  error: string | null;
  /** Số lần đã thử lại tự động. */
  attempts: number;
  /** Số giây còn lại trước khi tự thử lại (khi RETRYING). */
  retryInSeconds: number;
  /** id tài liệu máy chủ trả về khi ACCEPTED (để thay hàng cục bộ bằng bản ghi máy chủ). */
  serverId: string | null;
}

export type UploadFn = (
  file: File,
  options: { onProgress: (loaded: number, total: number) => void; signal: AbortSignal },
) => Promise<UploadAccepted>;

export interface QueueOptions {
  upload: UploadFn;
  /** Số tài liệu đã có trong workspace (đọc mới mỗi lần thêm tệp). */
  existingCount: () => number;
  onAccepted?: (item: UploadItem) => void;
  /** Số tệp tải đồng thời (đề xuất T10: 2). */
  concurrency?: number;
  /** Chờ trước mỗi lần thử lại tự động (ms): 1 s, 2 s, 4 s → tối đa 3 lần. */
  retryDelaysMs?: number[];
  /** Sau bao lâu dòng ACCEPTED tự ẩn (ms). */
  hideAcceptedAfterMs?: number;
}

interface Internal {
  item: UploadItem;
  file: File;
  controller: AbortController | null;
  timer: ReturnType<typeof setTimeout> | null;
  ticker: ReturnType<typeof setInterval> | null;
}

const OPEN_STATES: UploadState[] = ['QUEUED', 'UPLOADING', 'RETRYING'];

/** Lỗi nào được TỰ thử lại: chỉ mạng hoặc 5xx; 4xx (415/413/409/401/429…) không bao giờ. */
export function isAutoRetryable(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 0 || e.status >= 500);
}

/**
 * Hàng đợi tải lên (T10): mỗi tệp một yêu cầu POST, tối đa `concurrency` yêu cầu đồng thời, thử lại tự động
 * với lỗi mạng/5xx, hủy từng tệp, thử lại thủ công. Không phụ thuộc giao diện nên kiểm thử được bằng đồng hồ giả.
 */
export function createUploadQueue(options: QueueOptions) {
  const concurrency = options.concurrency ?? 2;
  const delays = options.retryDelaysMs ?? [1000, 2000, 4000];
  const hideAfter = options.hideAcceptedAfterMs ?? 4000;

  const items = reactive<UploadItem[]>([]);
  const status = reactive({ announcement: '' });
  const internals = new Map<number, Internal>();
  let nextId = 1;
  let active = 0;

  const announce = (text: string) => {
    status.announcement = text;
  };

  function clearTimers(it: Internal): void {
    if (it.timer) clearTimeout(it.timer);
    if (it.ticker) clearInterval(it.ticker);
    it.timer = null;
    it.ticker = null;
  }

  function remove(id: number): void {
    const it = internals.get(id);
    if (it) clearTimers(it);
    internals.delete(id);
    const idx = items.findIndex((x) => x.id === id);
    if (idx >= 0) items.splice(idx, 1);
  }

  function pump(): void {
    for (const it of internals.values()) {
      if (active >= concurrency) return;
      if (it.item.state === 'QUEUED' && !it.controller) void run(it);
    }
  }

  async function run(it: Internal): Promise<void> {
    active += 1;
    const controller = new AbortController();
    it.controller = controller;
    it.item.state = 'UPLOADING';
    it.item.progress = 0;
    it.item.error = null;
    try {
      const accepted = await options.upload(it.file, {
        signal: controller.signal,
        onProgress: (loaded, total) => {
          it.item.progress = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
        },
      });
      it.item.state = 'ACCEPTED';
      it.item.serverId = accepted?.id ?? null;
      it.item.progress = 100;
      announce(messages.upload.announce.accepted(it.item.name));
      options.onAccepted?.(it.item);
      it.timer = setTimeout(() => remove(it.item.id), hideAfter);
    } catch (e) {
      if (!controller.signal.aborted) handleFailure(it, e); // bị hủy thì dòng đã được gỡ
    } finally {
      it.controller = null;
      active -= 1;
      pump();
    }
  }

  function handleFailure(it: Internal, e: unknown): void {
    const message = e instanceof ApiError ? e.message : messageForError('UNKNOWN_ERROR');
    if (isAutoRetryable(e) && it.item.attempts < delays.length) {
      const delay = delays[it.item.attempts];
      it.item.attempts += 1;
      it.item.state = 'RETRYING';
      it.item.retryInSeconds = Math.ceil(delay / 1000);
      announce(messages.upload.announce.retrying(it.item.name));
      const started = Date.now();
      it.ticker = setInterval(() => {
        it.item.retryInSeconds = Math.max(0, Math.ceil((delay - (Date.now() - started)) / 1000));
      }, 250);
      it.timer = setTimeout(() => {
        clearTimers(it);
        it.item.state = 'QUEUED'; // quay lại hàng đợi, nhường chỗ cho tệp khác trong lúc chờ
        pump();
      }, delay);
      return;
    }
    it.item.error = message;
    const permanent =
      e instanceof ApiError &&
      e.status >= 400 &&
      e.status < 500 &&
      e.status !== 401 &&
      e.status !== 429;
    if (permanent) {
      // Máy chủ từ chối hẳn (sai loại, quá lớn, hết chỗ…): thử lại cũng không đổi kết quả
      it.item.state = 'REJECTED';
      announce(messages.upload.announce.rejected(it.item.name, message));
    } else {
      // Mạng/5xx đã hết lượt tự thử, hoặc 401/429: giữ trong hàng đợi để người dùng bấm "Thử lại"
      it.item.state = 'FAILED';
      announce(messages.upload.announce.failed(it.item.name, message));
    }
  }

  /** Kiểm tra (ALG-02) rồi xếp hàng; tệp sai hiện ngay dạng REJECTED kèm lý do, tệp đúng vẫn được tải. */
  async function add(files: File[]): Promise<void> {
    const slotsUsed =
      options.existingCount() + items.filter((i) => OPEN_STATES.includes(i.state)).length; // ACCEPTED đã nằm trong existingCount sau khi làm mới danh sách
    const checks = await checkFiles(files, slotsUsed);
    for (const c of checks) {
      items.push({
        id: nextId++,
        name: c.file.name,
        size: c.file.size,
        state: c.ok ? 'QUEUED' : 'REJECTED',
        progress: 0,
        error: c.ok ? null : messageForError(c.reason ?? 'UNKNOWN_ERROR'),
        attempts: 0,
        retryInSeconds: 0,
        serverId: null,
      });
      const item = items[items.length - 1]; // bản reactive
      internals.set(item.id, { item, file: c.file, controller: null, timer: null, ticker: null });
      if (!c.ok) announce(messages.upload.announce.rejected(item.name, item.error ?? ''));
    }
    pump();
  }

  /** Hủy một tệp đang chờ/đang tải/đang đợi thử lại; dòng được gỡ khỏi hàng đợi. */
  function cancel(id: number): void {
    const it = internals.get(id);
    if (!it || !OPEN_STATES.includes(it.item.state)) return;
    const name = it.item.name;
    it.controller?.abort();
    remove(id);
    announce(messages.upload.announce.cancelled(name));
    pump();
  }

  /** Thử lại thủ công một tệp FAILED: làm lại từ đầu (bộ đếm tự thử lại về 0). */
  function retry(id: number): void {
    const it = internals.get(id);
    if (!it || it.item.state !== 'FAILED') return;
    it.item.attempts = 0;
    it.item.error = null;
    it.item.state = 'QUEUED';
    pump();
  }

  /** Đóng dòng đã xong/bị từ chối/thất bại. */
  function dismiss(id: number): void {
    const it = internals.get(id);
    if (!it || OPEN_STATES.includes(it.item.state)) return;
    remove(id);
  }

  /** Dọn khi component bị hủy: hủy mọi yêu cầu và bộ đếm. */
  function dispose(): void {
    for (const it of internals.values()) {
      it.controller?.abort();
      clearTimers(it);
    }
    internals.clear();
    items.splice(0, items.length);
  }

  return { items, status, add, cancel, retry, dismiss, dispose };
}

export type UploadQueue = ReturnType<typeof createUploadQueue>;
