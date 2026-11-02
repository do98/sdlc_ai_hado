import { ApiError, buildApiError } from './http';
import { createSseParser } from './sseParser';
import type { SseMessage } from './sseParser';
import type { DocumentSummary } from './types';

/** Dữ liệu của `event: document.updated` (api/sse-events.md, IF-06). */
export type DocumentUpdatedEvent = Pick<
  DocumentSummary,
  'id' | 'status' | 'errorCode' | 'warning' | 'pageCount'
>;

export interface StreamEventsOptions {
  /** Gửi lại làm header `Last-Event-ID` để máy chủ phát bù những sự kiện đã lỡ. */
  lastEventId?: string;
  signal: AbortSignal;
  /** Đã nhận phản hồi 200: kết nối thành công. */
  onOpen?: () => void;
  onMessage: (message: SseMessage) => void;
  /** Có dữ liệu bất kỳ (kể cả heartbeat). */
  onActivity?: () => void;
}

export type StreamEvents = (options: StreamEventsOptions) => Promise<void>;

/**
 * IF-06: mở luồng sự kiện workspace bằng fetch + ReadableStream (không dùng EventSource vì cần tự gửi
 * `Last-Event-ID` và đọc được lỗi HTTP). Promise kết thúc khi luồng đóng; ném ApiError khi không mở được
 * (401 gọi bộ xử lý hết phiên) hoặc mất mạng giữa chừng. Bị hủy bằng `signal` thì ném AbortError.
 */
export const streamEvents: StreamEvents = async ({
  lastEventId,
  signal,
  onOpen,
  onMessage,
  onActivity,
}) => {
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (lastEventId !== undefined) headers['Last-Event-ID'] = lastEventId;

  let response: Response;
  try {
    response = await fetch('/api/events', { headers, credentials: 'include', signal });
  } catch (cause) {
    if (isAbort(cause)) throw cause;
    throw new ApiError(0, 'NETWORK_ERROR');
  }
  if (!response.ok) {
    throw buildApiError(response.status, await response.text().catch(() => ''));
  }
  if (!response.body) throw new ApiError(0, 'NETWORK_ERROR');

  onOpen?.();
  const parser = createSseParser({ onMessage, onActivity });
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } catch (cause) {
    if (isAbort(cause)) throw cause;
    throw new ApiError(0, 'NETWORK_ERROR');
  } finally {
    parser.end();
    reader.releaseLock();
  }
};

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

const STATUSES = ['PROCESSING', 'READY', 'ERROR'];

/** Đọc `data` của document.updated; trả null nếu không đúng hình dạng (sự kiện hỏng bị bỏ qua, không làm vỡ UI). */
export function parseDocumentUpdated(data: string): DocumentUpdatedEvent | null {
  try {
    const v = JSON.parse(data) as Partial<DocumentUpdatedEvent> | null;
    if (!v || typeof v.id !== 'string' || !STATUSES.includes(v.status as string)) return null;
    return {
      id: v.id,
      status: v.status as DocumentUpdatedEvent['status'],
      errorCode: v.errorCode ?? null,
      warning: v.warning ?? null,
      pageCount: typeof v.pageCount === 'number' ? v.pageCount : null,
    };
  } catch {
    return null;
  }
}
