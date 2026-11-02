// Bộ đọc luồng SSE (api/sse-events.md §1): nhận từng mảnh byte, trả về các sự kiện hoàn chỉnh.
// Chịu được: sự kiện bị cắt ngang giữa các mảnh mạng, ký tự UTF-8 nhiều byte bị cắt giữa hai mảnh,
// xuống dòng \n, \r\n hoặc \r, nhiều dòng `data:` của một sự kiện, dòng chú thích `: ping` (heartbeat).

export interface SseMessage {
  /** Giá trị `event:`; mặc định "message" khi luồng không nêu. */
  event: string;
  /** Các dòng `data:` nối bằng "\n". */
  data: string;
  /** `id:` gần nhất đã nhận (kể cả từ sự kiện trước), hoặc undefined nếu chưa có. */
  id: string | undefined;
}

export interface SseParserHandlers {
  onMessage: (message: SseMessage) => void;
  /** Có dữ liệu mới, kể cả dòng chú thích (heartbeat) — dùng để biết kết nối còn sống. */
  onActivity?: () => void;
}

export interface SseParser {
  feed(chunk: Uint8Array): void;
  /** Kết thúc luồng: sự kiện dở dang (chưa có dòng trống) bị bỏ, đúng như đặc tả SSE. */
  end(): void;
}

const LF = '\n';
const CR = '\r';

export function createSseParser(handlers: SseParserHandlers): SseParser {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let started = false;
  let lastId: string | undefined;
  let event = '';
  let data: string[] = [];
  let hasData = false;

  function dispatch(): void {
    if (hasData) {
      handlers.onMessage({ event: event || 'message', data: data.join(LF), id: lastId });
    }
    event = '';
    data = [];
    hasData = false;
  }

  function line(text: string): void {
    if (text === '') return dispatch();
    if (text.startsWith(':')) return; // chú thích
    const colon = text.indexOf(':');
    const field = colon === -1 ? text : text.slice(0, colon);
    let value = colon === -1 ? '' : text.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') event = value;
    else if (field === 'data') {
      data.push(value);
      hasData = true;
    } else if (field === 'id' && !value.includes('\0')) lastId = value;
    // `retry` và trường lạ bị bỏ qua: việc nối lại do bộ điều phối quyết định
  }

  /** Tách các dòng đầy đủ từ buffer. `final`: luồng đã hết nên CR ở cuối chắc chắn không còn LF theo sau. */
  function drain(final: boolean): void {
    let start = 0;
    for (let i = 0; i < buffer.length; i++) {
      const c = buffer[i];
      if (c === LF) {
        line(buffer.slice(start, i));
        start = i + 1;
      } else if (c === CR) {
        // CR ở cuối buffer có thể là nửa đầu của CRLF: chờ mảnh sau (trừ khi luồng đã hết)
        if (i === buffer.length - 1 && !final) break;
        line(buffer.slice(start, i));
        if (buffer[i + 1] === LF) i += 1;
        start = i + 1;
      }
    }
    buffer = buffer.slice(start);
  }

  return {
    feed(chunk) {
      handlers.onActivity?.();
      let text = decoder.decode(chunk, { stream: true });
      if (!started && text.length > 0) {
        started = true;
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM
      }
      buffer += text;
      drain(false);
    },
    end() {
      drain(true);
      buffer = '';
      event = '';
      data = [];
      hasData = false;
    },
  };
}
