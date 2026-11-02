import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, setUnauthorizedHandler } from './http';
import { parseDocumentUpdated, streamEvents } from './events';
import type { SseMessage } from './sseParser';

const enc = new TextEncoder();

function streamOf(chunks: string[], fail = false): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((x) => c.enqueue(enc.encode(x)));
      if (fail) c.error(new TypeError('network'));
      else c.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('streamEvents (IF-06, fetch + ReadableStream)', () => {
  it('gửi cookie, Accept và Last-Event-ID; đọc sự kiện bị cắt giữa các mảnh', async () => {
    const fetchMock = vi.fn(async () =>
      streamOf(['id: 7\nevent: document.upd', 'ated\ndata: {"a":1}\n\n']),
    );
    vi.stubGlobal('fetch', fetchMock);
    const got: SseMessage[] = [];
    const onOpen = vi.fn();
    await streamEvents({
      lastEventId: '6',
      signal: new AbortController().signal,
      onOpen,
      onMessage: (m) => got.push(m),
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/events');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ Accept: 'text/event-stream', 'Last-Event-ID': '6' });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(got).toEqual([{ event: 'document.updated', data: '{"a":1}', id: '7' }]);
  });

  it('không gửi Last-Event-ID khi chưa có', async () => {
    const fetchMock = vi.fn(async () => streamOf([]));
    vi.stubGlobal('fetch', fetchMock);
    await streamEvents({ signal: new AbortController().signal, onMessage: () => {} });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers).not.toHaveProperty('Last-Event-ID');
  });

  it('401: ném ApiError và gọi bộ xử lý hết phiên (T11.h); chưa mở luồng nên không gọi onOpen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"code":"UNAUTHENTICATED"}', { status: 401 })),
    );
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const onOpen = vi.fn();
    const err = await streamEvents({
      signal: new AbortController().signal,
      onOpen,
      onMessage: () => {},
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(handler).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('mất mạng khi mở hoặc giữa luồng → ApiError NETWORK_ERROR; bị hủy → AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const opts = { signal: new AbortController().signal, onMessage: () => {} };
    await expect(streamEvents(opts)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamOf(['id: 1\n'], true)),
    );
    await expect(streamEvents(opts)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    const ac = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('aborted', 'AbortError');
      }),
    );
    ac.abort();
    await expect(streamEvents({ signal: ac.signal, onMessage: () => {} })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

describe('parseDocumentUpdated', () => {
  it('đọc đúng hình dạng và chuẩn hóa trường thiếu', () => {
    expect(parseDocumentUpdated('{"id":"x","status":"READY","pageCount":3}')).toEqual({
      id: 'x',
      status: 'READY',
      errorCode: null,
      warning: null,
      pageCount: 3,
    });
  });
  it('dữ liệu hỏng hoặc sai trạng thái → null (bị bỏ qua)', () => {
    for (const bad of ['not json', 'null', '{"id":1}', '{"id":"x","status":"DELETED"}']) {
      expect(parseDocumentUpdated(bad)).toBeNull();
    }
  });
});
