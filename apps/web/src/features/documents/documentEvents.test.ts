import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api';
import type { StreamEvents, StreamEventsOptions } from '../../shared/api';
import { createDocumentEventsChannel } from './documentEvents';

/** Kết nối giả: mỗi lần gọi connect() ghi lại tham số; test điều khiển mở/đóng/lỗi từng lần. */
function fakeConnect() {
  const calls: StreamEventsOptions[] = [];
  const settle: { resolve: () => void; reject: (e: unknown) => void }[] = [];
  const connect: StreamEvents = (o) =>
    new Promise<void>((resolve, reject) => {
      calls.push(o);
      settle.push({ resolve, reject });
      o.signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')));
    });
  return { connect, calls, settle };
}

const event = (id: string, data: unknown = { id: 'a', status: 'READY' }) => ({
  event: 'document.updated',
  data: JSON.stringify(data),
  id,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-02T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());

function make(extra: Partial<Parameters<typeof createDocumentEventsChannel>[0]> = {}) {
  const f = fakeConnect();
  const onUpdate = vi.fn();
  const onResync = vi.fn();
  const channel = createDocumentEventsChannel({
    connect: f.connect,
    onUpdate,
    onResync,
    random: () => 0.5, // hệ số jitter = 1.0 → thời gian chờ đúng bằng lũy thừa
    ...extra,
  });
  return { ...f, onUpdate, onResync, channel };
}

describe('ALG-03 — kênh sự kiện tự nối lại', () => {
  it('mở kết nối khi start: connecting → connected; nhận document.updated thì gọi onUpdate', async () => {
    const t = make();
    t.channel.start();
    expect(t.channel.state.value).toBe('connecting');
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    expect(t.channel.state.value).toBe('connected');
    t.calls[0].onMessage(event('1', { id: 'a', status: 'READY', pageCount: 3 }));
    expect(t.onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', status: 'READY' }));
    expect(t.calls[0].lastEventId).toBeUndefined();
    t.channel.stop();
  });

  it('chờ 1 s → 2 s → 4 s → 8 s → 16 s → 30 s (trần) giữa các lần thử khi liên tục thất bại', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    const delays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const before = t.calls.length;
      t.settle[before - 1].reject(new ApiError(0, 'NETWORK_ERROR'));
      await vi.advanceTimersByTimeAsync(0);
      expect(t.channel.state.value).toBe('reconnecting');
      // tìm thời gian chờ thực tế bằng cách tiến từng 100 ms tới khi có lần gọi mới
      let waited = 0;
      while (t.calls.length === before) {
        await vi.advanceTimersByTimeAsync(100);
        waited += 100;
      }
      delays.push(waited);
    }
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
    t.channel.stop();
  });

  it('jitter nằm trong ±20% và không vượt trần 30 s', () => {
    const lo = createDocumentEventsChannel({
      onUpdate: vi.fn(),
      onResync: vi.fn(),
      random: () => 0,
    });
    const hi = createDocumentEventsChannel({
      onUpdate: vi.fn(),
      onResync: vi.fn(),
      random: () => 1,
    });
    expect(lo.delayFor(0)).toBe(800);
    expect(hi.delayFor(0)).toBe(1200);
    expect(hi.delayFor(10)).toBe(30000);
    expect(lo.delayFor(10)).toBe(24000);
  });

  it('nối lại gửi Last-Event-ID của sự kiện cuối; gián đoạn ngắn → KHÔNG tải lại danh sách', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.calls[0].onMessage(event('41'));
    t.calls[0].onMessage(event('42'));
    t.settle[0].resolve(); // máy chủ đóng luồng
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.calls).toHaveLength(2);
    expect(t.calls[1].lastEventId).toBe('42');
    t.calls[1].onOpen?.();
    expect(t.onResync).not.toHaveBeenCalled();
    expect(t.channel.state.value).toBe('connected');
    t.channel.stop();
  });

  it('ngắt 10 s: vẫn dùng Last-Event-ID, không tải lại; ngắt ≥ 30 s: tải lại danh sách sau khi nối lại', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.calls[0].onMessage(event('1'));
    t.settle[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await vi.advanceTimersByTimeAsync(10_000);
    t.calls[t.calls.length - 1].onOpen?.();
    expect(t.onResync).not.toHaveBeenCalled();

    t.calls[t.calls.length - 1].onMessage(event('2'));
    t.settle[t.calls.length - 1].reject(new ApiError(0, 'NETWORK_ERROR'));
    // các lần thử khi máy chủ còn chết: tổng thời gian ngắt vượt 30 s
    for (let i = 0; i < 6; i++) {
      const n = t.calls.length;
      await vi.advanceTimersByTimeAsync(31_000);
      if (t.calls.length > n) t.settle[t.calls.length - 1].reject(new ApiError(0, 'NETWORK_ERROR'));
    }
    const last = t.calls[t.calls.length - 1];
    last.onOpen?.();
    expect(last.lastEventId).toBe('2');
    expect(t.onResync).toHaveBeenCalledOnce();
    t.channel.stop();
  });

  it('nối lại mà chưa từng có id để bù (chưa nhận sự kiện nào) → tải lại danh sách', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.settle[0].resolve();
    await vi.advanceTimersByTimeAsync(1000);
    t.calls[1].onOpen?.();
    expect(t.onResync).toHaveBeenCalledOnce();
    t.channel.stop();
  });

  it('nhận event: resync → tải lại danh sách và bỏ id cũ (lần nối sau không gửi id quá cũ)', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.calls[0].onMessage(event('5'));
    t.calls[0].onMessage({ event: 'resync', data: '{}', id: '5' });
    expect(t.onResync).toHaveBeenCalledOnce();
    t.settle[0].resolve();
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.calls[1].lastEventId).toBeUndefined();
    t.channel.stop();
  });

  it('sự kiện hỏng bị bỏ qua, sự kiện lạ không làm gì', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.calls[0].onMessage({ event: 'document.updated', data: 'không phải json', id: '1' });
    t.calls[0].onMessage({ event: 'khac', data: '{}', id: '2' });
    expect(t.onUpdate).not.toHaveBeenCalled();
    expect(t.onResync).not.toHaveBeenCalled();
    t.channel.stop();
  });

  it('kết nối treo (không nhận cả heartbeat) quá stallMs → hủy và nối lại; có hoạt động thì không', async () => {
    const t = make({ stallMs: 45_000 });
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    await vi.advanceTimersByTimeAsync(40_000);
    t.calls[0].onActivity?.(); // heartbeat
    await vi.advanceTimersByTimeAsync(40_000);
    expect(t.calls).toHaveLength(1); // còn sống nhờ heartbeat
    await vi.advanceTimersByTimeAsync(6000); // 46 s không có gì
    expect(t.channel.state.value).toBe('reconnecting');
    await vi.advanceTimersByTimeAsync(1000);
    expect(t.calls).toHaveLength(2);
    t.channel.stop();
  });

  it('401 → dừng hẳn, không nối lại (bộ xử lý hết phiên đã được gọi ở lớp API)', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.settle[0].reject(new ApiError(401, 'UNAUTHENTICATED'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(t.calls).toHaveLength(1);
    expect(t.channel.state.value).toBe('stopped');
  });

  it('stop() hủy kết nối đang mở và đang chờ nối lại; không còn timer nào', async () => {
    const t = make();
    t.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    t.calls[0].onOpen?.();
    t.channel.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(t.calls[0].signal.aborted).toBe(true);
    expect(t.channel.state.value).toBe('stopped');

    const u = make();
    u.channel.start();
    await vi.advanceTimersByTimeAsync(0);
    u.settle[0].reject(new ApiError(0, 'NETWORK_ERROR'));
    await vi.advanceTimersByTimeAsync(10);
    u.channel.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(u.calls).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
