import { describe, expect, it } from 'vitest';
import { createSseParser } from './sseParser';
import type { SseMessage } from './sseParser';

const enc = new TextEncoder();

function parse(chunks: Uint8Array[]): { messages: SseMessage[]; activity: number } {
  const messages: SseMessage[] = [];
  let activity = 0;
  const p = createSseParser({ onMessage: (m) => messages.push(m), onActivity: () => activity++ });
  chunks.forEach((c) => p.feed(c));
  p.end();
  return { messages, activity };
}

const STREAM =
  'id: 1\nevent: document.updated\ndata: {"id":"a","name":"Hợp đồng 😀 số 1"}\n\n' +
  ': ping\n\n' +
  'id: 2\nevent: document.updated\ndata: {"id":"b"}\n\n' +
  'event: resync\ndata: {}\n\n';

describe('SSE parser (T11.e/f)', () => {
  it('đọc id, event, data và bỏ qua chú thích heartbeat', () => {
    const { messages } = parse([enc.encode(STREAM)]);
    expect(messages.map((m) => [m.event, m.id])).toEqual([
      ['document.updated', '1'],
      ['document.updated', '2'],
      ['resync', '2'], // id được giữ từ sự kiện trước theo đặc tả SSE
    ]);
    expect(JSON.parse(messages[0].data)).toEqual({ id: 'a', name: 'Hợp đồng 😀 số 1' });
  });

  it('kết quả giống nhau dù luồng bị cắt ở BẤT KỲ vị trí byte nào (kể cả giữa ký tự UTF-8 nhiều byte)', () => {
    const bytes = enc.encode(STREAM);
    const whole = parse([bytes]).messages;
    for (let cut = 1; cut < bytes.length; cut++) {
      const split = parse([bytes.slice(0, cut), bytes.slice(cut)]).messages;
      expect(split).toEqual(whole);
    }
  });

  it('kết quả giống nhau khi mỗi mảnh chỉ một byte', () => {
    const bytes = enc.encode(STREAM);
    const ones = Array.from(bytes, (b) => Uint8Array.of(b));
    expect(parse(ones).messages).toEqual(parse([bytes]).messages);
  });

  it('hỗ trợ xuống dòng \\r\\n và \\r, kể cả khi \\r và \\n nằm ở hai mảnh khác nhau', () => {
    const crlf = 'event: a\r\ndata: 1\r\n\r\n';
    expect(parse([enc.encode(crlf)]).messages[0]).toMatchObject({ event: 'a', data: '1' });
    expect(parse([enc.encode('event: a\rdata: 1\r\r')]).messages[0]).toMatchObject({
      event: 'a',
      data: '1',
    });
    const bytes = enc.encode(crlf);
    for (let cut = 1; cut < bytes.length; cut++) {
      expect(parse([bytes.slice(0, cut), bytes.slice(cut)]).messages).toHaveLength(1);
    }
  });

  it('nhiều dòng data nối bằng \\n; không có khoảng trắng sau dấu hai chấm vẫn đúng', () => {
    const { messages } = parse([enc.encode('data:a\ndata: b\ndata\n\n')]);
    expect(messages[0].data).toBe('a\nb\n');
    expect(messages[0].event).toBe('message');
  });

  it('sự kiện dở dang khi luồng đóng bị bỏ; BOM đầu luồng bị bỏ', () => {
    expect(parse([enc.encode('event: a\ndata: 1\n')]).messages).toEqual([]);
    expect(parse([enc.encode('﻿data: x\n\n')]).messages[0].data).toBe('x');
  });

  it('sự kiện không có data (chỉ id/event) không phát ra; onActivity báo cho mỗi mảnh kể cả heartbeat', () => {
    const { messages, activity } = parse([enc.encode(': ping\n\n'), enc.encode('id: 5\n\n')]);
    expect(messages).toEqual([]);
    expect(activity).toBe(2);
  });
});
