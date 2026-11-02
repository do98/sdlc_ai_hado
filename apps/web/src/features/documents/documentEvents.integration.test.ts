// @vitest-environment node
// T11.e/f — kênh sự kiện thật (fetch + parser) chạy với SSE giả của MSW: cập nhật cache không cần tải lại cả
// danh sách; ngắt kết nối, tạo thay đổi, nối lại → danh sách đúng nhờ Last-Event-ID; resync khi id quá cũ.
import { QueryClient } from '@tanstack/vue-query';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  listDocuments,
  queryKeys,
  setUnauthorizedHandler,
  streamEvents,
} from '../../shared/api';
import type { DocumentList, StreamEvents } from '../../shared/api';
import { MockDb } from '../../mocks/db';
import { createMockServer } from '../../mocks/server';
import { createDocumentEventsChannel } from './documentEvents';
import { applyDocumentUpdate } from './useDocuments';

const BASE = 'http://mock.test';
const { db, server } = createMockServer(new MockDb());

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  const patched = Reflect.get(globalThis, 'fetch') as typeof fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    patched(new URL(String(input), BASE).toString(), init),
  );
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  db.reset();
  db.config.processingMs = 0;
  db.config.heartbeatMs = 15000;
  db.alive = true;
  setUnauthorizedHandler(null);
});
afterEach(() => server.resetHandlers());

function setup() {
  const queryClient = new QueryClient();
  const announcements: string[] = [];
  const resync = vi.fn();
  let cut: () => void = () => {};
  /** Kết nối thật nhưng có thể bị "cắt đứt" như mất mạng. */
  const connect: StreamEvents = (o) =>
    new Promise<void>((resolve, reject) => {
      const inner = new AbortController();
      cut = () => {
        inner.abort();
        reject(new ApiError(0, 'NETWORK_ERROR'));
      };
      o.signal.addEventListener('abort', () => {
        inner.abort();
        reject(new DOMException('aborted', 'AbortError'));
      });
      streamEvents({ ...o, signal: inner.signal }).then(resolve, reject);
    });
  const channel = createDocumentEventsChannel({
    connect,
    baseDelayMs: 10,
    maxDelayMs: 20,
    random: () => 0.5,
    onUpdate: (e) => {
      const text = applyDocumentUpdate(queryClient, e);
      if (text) announcements.push(text);
    },
    onResync: () => {
      resync();
      void listDocuments().then((l) => queryClient.setQueryData(queryKeys.documents(), l));
    },
  });
  const list = () => queryClient.getQueryData<DocumentList>(queryKeys.documents());
  const load = async () => queryClient.setQueryData(queryKeys.documents(), await listDocuments());
  return { queryClient, announcements, resync, channel, list, load, cut: () => cut() };
}

const statuses = (l: DocumentList | undefined) => l?.items.map((d) => d.status);

describe('kênh sự kiện + cache (SSE giả)', () => {
  it('đổi trạng thái hiện ra trong cache ngay (≤ 1 s) và có thông báo cho trình đọc màn hình', async () => {
    const t = setup();
    db.addDocument('hop-dong.pdf', 100_000);
    db.addDocument('mat-khau-password.pdf', 100_000);
    await t.load();
    t.channel.start();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('connected'));

    const started = Date.now();
    db.flushProcessing();
    await vi.waitFor(() => expect(statuses(t.list())).not.toContain('PROCESSING'), {
      timeout: 1000,
    });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(t.list()?.items.map((d) => d.errorCode)).toEqual(['PASSWORD_PROTECTED', null]);
    expect(t.announcements).toHaveLength(2);
    expect(t.announcements.join('|')).toContain('«hop-dong.pdf» đã sẵn sàng.');
    expect(t.resync).not.toHaveBeenCalled(); // không tải lại cả danh sách
    t.channel.stop();
  });

  it('ngắt kết nối, tạo 3 thay đổi, nối lại → nhận đủ 3 (Last-Event-ID), không cần tải lại danh sách', async () => {
    const t = setup();
    for (const n of ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf']) db.addDocument(n, 100_000);
    await t.load();
    t.channel.start();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('connected'));

    db.flushProcessing(); // 4 tài liệu xong khi đang kết nối → 4 sự kiện, có id để bù về sau
    await vi.waitFor(() => expect(statuses(t.list())).not.toContain('PROCESSING'));

    // ngắt: máy chủ từ chối kết nối trong lúc mất mạng
    server.use(http.get('*/api/events', () => HttpResponse.error()));
    t.cut();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('reconnecting'));

    // trong lúc ngắt có 3 thay đổi (3 tài liệu mới xử lý xong)
    for (const n of ['e.pdf', 'f.pdf', 'g.pdf']) db.addDocument(n, 100_000);
    await t.load(); // danh sách chỉ có 3 tài liệu mới ở trạng thái đang xử lý (+4 cũ)
    expect(statuses(t.list())?.filter((s) => s === 'PROCESSING')).toHaveLength(3);
    db.flushProcessing();

    server.resetHandlers(); // mạng trở lại
    await vi.waitFor(() => expect(t.channel.state.value).toBe('connected'));
    await vi.waitFor(() => expect(statuses(t.list())?.every((s) => s === 'READY')).toBe(true));
    expect(t.resync).not.toHaveBeenCalled();
    expect(t.list()?.items).toHaveLength(7);
    t.channel.stop();
  });

  it('Last-Event-ID quá cũ (máy chủ mất lịch sử) → resync và danh sách được tải lại đúng', async () => {
    const t = setup();
    db.addDocument('a.pdf', 100_000);
    await t.load();
    t.channel.start();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('connected'));
    db.flushProcessing();
    await vi.waitFor(() => expect(statuses(t.list())).toEqual(['READY']));

    server.use(http.get('*/api/events', () => HttpResponse.error()));
    t.cut();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('reconnecting'));
    // máy chủ khởi động lại: lịch sử mất, id 1 > seq hiện tại → resync
    db.reset();
    db.alive = true;
    db.addDocument('moi.pdf', 100_000);
    server.resetHandlers();
    await vi.waitFor(() => expect(t.resync).toHaveBeenCalled());
    await vi.waitFor(() => expect(t.list()?.items.map((d) => d.name)).toEqual(['moi.pdf']));
    t.channel.stop();
  });

  it('401 khi mở luồng → gọi bộ xử lý hết phiên và kênh dừng, không nối lại liên tục', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    db.alive = false; // phiên đã hết
    const t = setup();
    t.channel.start();
    await vi.waitFor(() => expect(t.channel.state.value).toBe('stopped'));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('applyDocumentUpdate', () => {
  it('tài liệu chưa có trong cache → làm mới danh sách thay vì bỏ lỡ', () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData<DocumentList>(queryKeys.documents(), {
      items: [],
      count: 0,
      limit: 20,
    });
    const text = applyDocumentUpdate(queryClient, {
      id: 'la',
      status: 'READY',
      errorCode: null,
      warning: null,
      pageCount: 1,
    });
    expect(text).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('sẵn sàng có cảnh báo và lỗi có thông báo riêng; cập nhật lặp không thông báo lại', () => {
    const queryClient = new QueryClient();
    const base = {
      sizeBytes: 1,
      pageCount: null,
      errorCode: null,
      warning: null,
      uploadedBy: 'u',
      uploadedAt: '2026-11-02T00:00:00Z',
    } as const;
    queryClient.setQueryData<DocumentList>(queryKeys.documents(), {
      items: [
        { ...base, id: '1', name: 'a.pdf', status: 'PROCESSING' },
        { ...base, id: '2', name: 'b.pdf', status: 'PROCESSING' },
      ],
      count: 2,
      limit: 20,
    });
    const warn = applyDocumentUpdate(queryClient, {
      id: '1',
      status: 'READY',
      errorCode: null,
      warning: { code: 'UNREADABLE_PAGES', pages: [3, 7] },
      pageCount: 9,
    });
    expect(warn).toContain('«a.pdf»');
    expect(warn).toContain('không đọc được');
    const err = applyDocumentUpdate(queryClient, {
      id: '2',
      status: 'ERROR',
      errorCode: 'CORRUPT',
      warning: null,
      pageCount: null,
    });
    expect(err).toContain('«b.pdf» xử lý không thành công');
    const again = applyDocumentUpdate(queryClient, {
      id: '2',
      status: 'ERROR',
      errorCode: 'CORRUPT',
      warning: null,
      pageCount: null,
    });
    expect(again).toBeNull();
    const l = queryClient.getQueryData<DocumentList>(queryKeys.documents());
    expect(l?.items[0]).toMatchObject({ status: 'READY', pageCount: 9 });
  });
});
