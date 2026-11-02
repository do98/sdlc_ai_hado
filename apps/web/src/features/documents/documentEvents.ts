import { ref } from 'vue';
import { ApiError, parseDocumentUpdated, streamEvents } from '../../shared/api';
import type { DocumentUpdatedEvent, StreamEvents } from '../../shared/api';

// ALG-03: kênh sự kiện workspace tự nối lại. Chờ lũy thừa 1 s → 2 s → 4 s … tối đa 30 s (có jitter), gửi
// `Last-Event-ID` của sự kiện cuối đã xử lý để máy chủ phát bù; nếu máy chủ báo `resync`, hoặc nối lại sau một
// quãng gián đoạn dài (hoặc không còn id để bù), thì yêu cầu tải lại cả danh sách.

/** idle: chưa chạy · connecting: lần mở đầu · connected · reconnecting: đang thử nối lại · stopped: dừng (hết phiên/đóng). */
export type ChannelState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'stopped';

export interface ChannelOptions {
  onUpdate: (event: DocumentUpdatedEvent) => void;
  /** Cần tải lại toàn bộ danh sách (nhận `resync` hoặc nối lại sau gián đoạn dài). */
  onResync: () => void;
  /** Thay được khi kiểm thử. */
  connect?: StreamEvents;
  random?: () => number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Quá thời gian này không nhận gì (kể cả heartbeat 15 s) thì coi là kết nối treo và nối lại. */
  stallMs?: number;
  /** Gián đoạn lâu hơn mức này thì tải lại danh sách sau khi nối lại. */
  longGapMs?: number;
}

export function createDocumentEventsChannel(options: ChannelOptions) {
  const connect = options.connect ?? streamEvents;
  const random = options.random ?? Math.random;
  const base = options.baseDelayMs ?? 1000;
  const max = options.maxDelayMs ?? 30_000;
  const stall = options.stallMs ?? 45_000;
  const longGap = options.longGapMs ?? 30_000;

  const state = ref<ChannelState>('idle');
  let running = false;
  let current: AbortController | null = null;
  let wake: (() => void) | null = null;
  let lastEventId: string | undefined;
  let disconnectedAt: number | null = null;
  let everConnected = false;

  /** Thời gian chờ trước lần thử thứ `attempt` (0, 1, 2 …): 1 s · 2 s · 4 s … trần 30 s, dao động ±20%. */
  function backoff(attempt: number): number {
    const raw = Math.min(max, base * 2 ** attempt);
    return Math.min(max, Math.round(raw * (0.8 + 0.4 * random())));
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(done, ms);
      function done() {
        clearTimeout(timer);
        wake = null;
        resolve();
      }
      wake = done; // stop() đánh thức để thoát ngay
    });
  }

  async function loop(): Promise<void> {
    let attempt = 0;
    while (running) {
      const controller = new AbortController();
      current = controller;
      let stallTimer: ReturnType<typeof setTimeout> | null = null;
      const arm = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => controller.abort(), stall);
      };
      let stopForGood = false;
      try {
        await connect({
          lastEventId,
          signal: controller.signal,
          onOpen: () => {
            arm();
            const wasReconnect = everConnected || disconnectedAt !== null;
            const gap = disconnectedAt === null ? 0 : Date.now() - disconnectedAt;
            // Nối lại: nếu gián đoạn lâu hoặc không còn id để máy chủ phát bù thì tải lại cả danh sách
            if (wasReconnect && (lastEventId === undefined || gap >= longGap)) options.onResync();
            everConnected = true;
            disconnectedAt = null;
            attempt = 0;
            state.value = 'connected';
          },
          onActivity: arm,
          onMessage: (m) => {
            if (m.event === 'document.updated') {
              const data = parseDocumentUpdated(m.data);
              if (m.id !== undefined) lastEventId = m.id;
              if (data) options.onUpdate(data);
            } else if (m.event === 'resync') {
              lastEventId = undefined;
              options.onResync();
            }
          },
        });
      } catch (e) {
        // 401: bộ xử lý hết phiên toàn cục đã được gọi (chuyển về đăng nhập) → không nối lại
        if (e instanceof ApiError && e.status === 401) stopForGood = true;
      } finally {
        if (stallTimer) clearTimeout(stallTimer);
        current = null;
      }
      if (stopForGood) {
        running = false;
        state.value = 'stopped';
        return;
      }
      if (!running) return;
      disconnectedAt ??= Date.now();
      state.value = 'reconnecting';
      await sleep(backoff(attempt));
      attempt += 1;
    }
  }

  return {
    state,
    start(): void {
      if (running) return;
      running = true;
      state.value = 'connecting';
      void loop();
    },
    stop(): void {
      running = false;
      current?.abort();
      wake?.();
      state.value = 'stopped';
    },
    /** Dành cho kiểm thử: thời gian chờ sẽ dùng ở lần thử thứ `attempt`. */
    delayFor: backoff,
  };
}

export type DocumentEventsChannel = ReturnType<typeof createDocumentEventsChannel>;
