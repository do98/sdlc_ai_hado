// Tiện ích dựng luồng SSE cho API giả, đúng định dạng ở api/sse-events.md.
const encoder = new TextEncoder();

export function sseEvent(event: string, data: unknown, id?: number): string {
  // data luôn là JSON trên MỘT dòng
  return `${id === undefined ? '' : `id: ${id}\n`}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const SSE_HEARTBEAT = ': ping\n\n';

export const sseHeaders = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
};

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

export interface SseSink {
  send(chunk: string): void;
  close(): void;
  readonly closed: boolean;
}

/**
 * Tạo ReadableStream từ hàm `producer`. Luồng kết thúc khi `producer` trả về (đóng bình thường — nếu chưa gửi
 * sự kiện kết thúc thì phía nhận coi là gián đoạn) hoặc khi phía nhận hủy (`signal` bị abort).
 */
export function sseStream(
  producer: (sink: SseSink, signal: AbortSignal) => void | Promise<void>,
): ReadableStream<Uint8Array> {
  const controller = new AbortController();
  return new ReadableStream<Uint8Array>({
    async start(c) {
      let closed = false;
      const sink: SseSink = {
        send(chunk) {
          if (!closed) c.enqueue(encoder.encode(chunk));
        },
        close() {
          if (!closed) {
            closed = true;
            c.close();
          }
        },
        get closed() {
          return closed;
        },
      };
      try {
        await producer(sink, controller.signal);
      } finally {
        sink.close();
      }
    },
    cancel() {
      controller.abort();
    },
  });
}
