// @vitest-environment node
// T05.c — API giả (MSW) chạy được toàn bộ luồng chính và từng kịch bản lỗi, KHÔNG cần backend.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiRequest,
  fetchMe,
  login,
  logout,
  setUnauthorizedHandler,
} from '../shared/api';
import type { DocumentList, UploadAccepted } from '../shared/api';
import { MockDb } from './db';
import { createMockServer } from './server';

const BASE = 'http://mock.test';
const { db, server } = createMockServer(new MockDb());
// fetch ở tầng test (đọc luồng SSE thô): đi qua cùng máy chủ giả
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
let rawFetch: Fetch;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  const patched = Reflect.get(globalThis, 'fetch') as Fetch;
  // Đường dẫn tương đối của API (như trong trình duyệt) được gắn gốc để Node gọi được
  rawFetch = (input, init) => patched(new URL(input, BASE).toString(), init);
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => rawFetch(String(input), init));
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  db.reset();
  db.config.processingMs = 0; // xử lý tài liệu khi gọi flushProcessing()
  db.config.tokenDelayMs = 0;
  db.config.heartbeatMs = 15000;
  db.config.defaultScenario = 'answered';
  setUnauthorizedHandler(null);
});
afterEach(() => server.resetHandlers());

interface SseEvent {
  event?: string;
  data?: unknown;
  id?: string;
  comment?: string;
}

/** Đọc luồng SSE tới khi gặp điều kiện dừng hoặc hết luồng. */
async function readSse(
  res: Response,
  stop: (events: SseEvent[]) => boolean = () => false,
): Promise<SseEvent[]> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const events: SseEvent[] = [];
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const e: SseEvent = {};
      for (const line of block.split('\n')) {
        if (line.startsWith(':')) e.comment = line.slice(1).trim();
        else if (line.startsWith('event: ')) e.event = line.slice(7);
        else if (line.startsWith('id: ')) e.id = line.slice(4);
        else if (line.startsWith('data: ')) e.data = JSON.parse(line.slice(6));
      }
      events.push(e);
    }
    if (stop(events)) {
      // Không await: MSW nhân đôi thân phản hồi nên cancel() chỉ hoàn tất khi cả hai nhánh bị hủy
      void reader.cancel().catch(() => {});
      break;
    }
  }
  return events;
}

const pdf = (name = 'hop-dong.pdf', extra = '') =>
  new File([`%PDF-1.4\n% Hợp đồng ${extra}\n`.padEnd(120_000, 'x')], name, {
    type: 'application/pdf',
  });

async function upload(file: File): Promise<Response> {
  const form = new FormData();
  form.append('file', file);
  return rawFetch('/api/documents', { method: 'POST', body: form });
}

async function signIn(): Promise<void> {
  await login(db.config.validUsername, db.config.validPassword);
}

async function readyDocument(name = 'hop-dong.pdf'): Promise<string> {
  const res = await upload(pdf(name));
  const { id } = (await res.json()) as UploadAccepted;
  db.flushProcessing();
  return id;
}

async function ask(conversationId: string, text: string): Promise<Response> {
  return rawFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

async function newConversation(): Promise<string> {
  return (await apiRequest<{ id: string }>('/api/conversations', { method: 'POST' })).id;
}

const errorCodeOf = async (res: Response) => ((await res.json()) as { code: string }).code;

describe('xác thực', () => {
  it('chưa đăng nhập: mọi API dữ liệu trả 401 UNAUTHENTICATED', async () => {
    for (const path of ['/api/me', '/api/documents', '/api/events']) {
      const res = await rawFetch(path);
      expect(res.status, path).toBe(401);
      expect(await errorCodeOf(res)).toBe('UNAUTHENTICATED');
    }
  });

  it('đăng nhập đúng → /me; sai → 401; 5 lần sai → 423 cả khi nhập đúng; đăng xuất → 401', async () => {
    await signIn();
    expect((await fetchMe()).username).toBe('minh');
    await logout();
    await expect(fetchMe()).rejects.toMatchObject({ status: 401 });

    for (let i = 0; i < 5; i++) {
      await expect(login('minh', 'sai')).rejects.toMatchObject({
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }
    await expect(signIn()).rejects.toMatchObject({ status: 423, code: 'ACCOUNT_LOCKED' });
  });

  it('thân đăng nhập sai định dạng → 400 INVALID_REQUEST', async () => {
    const res = await rawFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });
    expect(res.status).toBe(400);
    expect(await errorCodeOf(res)).toBe('INVALID_REQUEST');
  });

  it('lỗi 401 qua apiRequest gọi bộ xử lý hết hạn', async () => {
    const onExpired = vi.fn();
    setUnauthorizedHandler(onExpired);
    await expect(apiRequest('/api/documents')).rejects.toBeInstanceOf(ApiError);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('health và ready không cần đăng nhập', async () => {
    expect((await rawFetch('/api/health')).status).toBe(200);
    const ready = await (await rawFetch('/api/ready')).json();
    expect(ready).toEqual({ status: 'UP', checks: { database: 'UP', storage: 'UP' } });
  });
});

describe('tải lên (IF-03) — từng mã lỗi', () => {
  beforeEach(signIn);

  it('PDF hợp lệ → 202 PROCESSING rồi READY kèm số trang', async () => {
    const res = await upload(pdf());
    expect(res.status).toBe(202);
    const accepted = (await res.json()) as UploadAccepted;
    expect(accepted.status).toBe('PROCESSING');

    let list = await apiRequest<DocumentList>('/api/documents');
    expect(list.items[0]).toMatchObject({
      id: accepted.id,
      status: 'PROCESSING',
      pageCount: null,
      errorCode: null,
    });
    expect(list.limit).toBe(20);

    db.flushProcessing();
    list = await apiRequest<DocumentList>('/api/documents');
    expect(list.items[0].status).toBe('READY');
    expect(list.items[0].pageCount).toBeGreaterThan(0);
  });

  it('không phải PDF (kể cả .pdf giả) → 415 NOT_PDF, không tạo tài liệu', async () => {
    for (const file of [
      new File(['PK\u0003\u0004 docx'], 'bao-cao.docx'),
      new File(['ÿØÿ jpeg'], 'anh.pdf'), // đổi đuôi
      new File([], 'rong.pdf'),
    ]) {
      const res = await upload(file);
      expect(res.status, file.name).toBe(415);
      expect(await errorCodeOf(res)).toBe('NOT_PDF');
    }
    expect((await apiRequest<DocumentList>('/api/documents')).count).toBe(0);
  });

  it('vượt dung lượng → 413 FILE_TOO_LARGE', async () => {
    const big = new File([`%PDF-1.4${'x'.repeat(10 * 1024 * 1024)}`], 'lon.pdf');
    const res = await upload(big);
    expect(res.status).toBe(413);
    expect(await errorCodeOf(res)).toBe('FILE_TOO_LARGE');
  });

  it('đúng giới hạn dung lượng được nhận', async () => {
    const ok = new File(['%PDF-1.4'.padEnd(10 * 1024 * 1024, 'x')], 'vua-du.pdf');
    expect((await upload(ok)).status).toBe(202);
  });

  it('đủ 20 tài liệu → 409 WORKSPACE_FULL', async () => {
    for (let i = 0; i < 20; i++) expect((await upload(pdf(`t${i}.pdf`))).status).toBe(202);
    const res = await upload(pdf('thu-21.pdf'));
    expect(res.status).toBe(409);
    expect(await errorCodeOf(res)).toBe('WORKSPACE_FULL');
  });

  it('thiếu trường file → 400', async () => {
    const res = await rawFetch('/api/documents', { method: 'POST', body: new FormData() });
    expect(res.status).toBe(400);
  });

  it.each([
    ['mat-khau-password.pdf', 'ERROR', 'PASSWORD_PROTECTED'],
    ['anh-scan.pdf', 'ERROR', 'SCANNED_NO_TEXT'],
    ['hong-corrupt.pdf', 'ERROR', 'CORRUPT'],
    ['toomany-trang.pdf', 'ERROR', 'TOO_MANY_PAGES'],
  ])('xử lý nền: %s → %s/%s', async (name, status, errorCode) => {
    await upload(pdf(name));
    db.flushProcessing();
    const doc = (await apiRequest<DocumentList>('/api/documents')).items[0];
    expect(doc.status).toBe(status);
    expect(doc.errorCode).toBe(errorCode);
  });

  it('PDF nửa scan → READY kèm cảnh báo trang không đọc được', async () => {
    await upload(pdf('partial-scan.pdf'));
    db.flushProcessing();
    const doc = (await apiRequest<DocumentList>('/api/documents')).items[0];
    expect(doc.status).toBe('READY');
    expect(doc.warning).toEqual({ code: 'UNREADABLE_PAGES', pages: [3, 7] });
  });

  it('tài liệu chuyển trạng thái THEO THỜI GIAN khi có độ trễ xử lý', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      db.config.processingMs = 3000;
      await upload(pdf());
      expect(db.documents[0].status).toBe('PROCESSING');
      await vi.advanceTimersByTimeAsync(2999);
      expect(db.documents[0].status).toBe('PROCESSING');
      await vi.advanceTimersByTimeAsync(2);
      expect(db.documents[0].status).toBe('READY');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('luồng sự kiện workspace (IF-06)', () => {
  beforeEach(signIn);

  it('nhận document.updated có id tăng dần khi tài liệu đổi trạng thái', async () => {
    const res = await rawFetch('/api/events');
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const reading = readSse(
      res,
      (e) => e.filter((x) => x.event === 'document.updated').length >= 2,
    );
    const a = await upload(pdf('a.pdf'));
    await upload(pdf('b-scan.pdf'));
    expect(a.status).toBe(202);
    db.flushProcessing();
    const events = (await reading).filter((e) => e.event === 'document.updated');
    expect(events.map((e) => Number(e.id))).toEqual([1, 2]);
    expect(events[0].data).toMatchObject({ status: 'READY', errorCode: null });
    expect(events[1].data).toMatchObject({ status: 'ERROR', errorCode: 'SCANNED_NO_TEXT' });
  });

  it('Last-Event-ID: nối lại thì nhận bù đúng các sự kiện đã lỡ, theo thứ tự', async () => {
    await upload(pdf('a.pdf'));
    await upload(pdf('b.pdf'));
    await upload(pdf('c.pdf'));
    db.flushProcessing(); // 3 sự kiện: id 1..3
    const res = await rawFetch('/api/events', { headers: { 'Last-Event-ID': '1' } });
    const events = await readSse(res, (e) => e.length >= 2);
    expect(events.map((e) => e.id)).toEqual(['2', '3']);
  });

  it('Last-Event-ID quá mới/không hợp lệ → resync', async () => {
    const res = await rawFetch('/api/events', { headers: { 'Last-Event-ID': '999' } });
    const events = await readSse(res, (e) => e.length >= 1);
    expect(events[0].event).toBe('resync');
    const bad = await rawFetch('/api/events', { headers: { 'Last-Event-ID': 'abc' } });
    expect((await readSse(bad, (e) => e.length >= 1))[0].event).toBe('resync');
  });

  it('gửi heartbeat ": ping" định kỳ', async () => {
    db.config.heartbeatMs = 20;
    const res = await rawFetch('/api/events');
    const events = await readSse(res, (e) => e.some((x) => x.comment === 'ping'));
    expect(events.some((e) => e.comment === 'ping')).toBe(true);
  });
});

describe('xem nguồn (IF-07) — PDF theo khoảng byte', () => {
  beforeEach(signIn);

  it('toàn bộ tệp (200) là PDF hợp lệ; Range → 206 đúng Content-Range', async () => {
    const id = await readyDocument();
    const full = await rawFetch(`/api/documents/${id}/file`);
    expect(full.status).toBe(200);
    expect(full.headers.get('accept-ranges')).toBe('bytes');
    expect(full.headers.get('x-content-type-options')).toBe('nosniff');
    const bytes = new Uint8Array(await full.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');

    const part = await rawFetch(`/api/documents/${id}/file`, { headers: { Range: 'bytes=0-9' } });
    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe(`bytes 0-9/${bytes.length}`);
    expect(new Uint8Array(await part.arrayBuffer())).toEqual(bytes.slice(0, 10));

    const tail = await rawFetch(`/api/documents/${id}/file`, { headers: { Range: 'bytes=-5' } });
    expect(new Uint8Array(await tail.arrayBuffer())).toEqual(bytes.slice(-5));
    const open = await rawFetch(`/api/documents/${id}/file`, {
      headers: { Range: `bytes=${bytes.length - 3}-` },
    });
    expect(new Uint8Array(await open.arrayBuffer())).toEqual(bytes.slice(-3));
  });

  it('Range sai/vượt → 416; tài liệu không tồn tại hoặc lỗi → 404', async () => {
    const id = await readyDocument();
    for (const range of ['bytes=99999999-', 'bytes=5-2', 'abc', 'bytes=-']) {
      const res = await rawFetch(`/api/documents/${id}/file`, { headers: { Range: range } });
      expect(res.status, range).toBe(416);
    }
    expect((await rawFetch('/api/documents/khong-co/file')).status).toBe(404);
    await upload(pdf('anh-scan.pdf'));
    db.flushProcessing();
    const failed = db.documents.find((d) => d.status === 'ERROR')!;
    expect((await rawFetch(`/api/documents/${failed.id}/file`)).status).toBe(404);
  });
});

describe('hỏi đáp (IF-05)', () => {
  beforeEach(signIn);

  it('kiểm tra TRƯỚC khi mở luồng: rỗng, quá dài, hội thoại lạ, chưa có tài liệu sẵn sàng', async () => {
    const conv = await newConversation();
    let res = await ask(conv, '   ');
    expect([res.status, await errorCodeOf(res)]).toEqual([422, 'EMPTY_QUESTION']);
    res = await ask(conv, 'a'.repeat(2001));
    expect([res.status, await errorCodeOf(res)]).toEqual([422, 'QUESTION_TOO_LONG']);
    res = await ask(conv, 'Câu hỏi?');
    expect([res.status, await errorCodeOf(res)]).toEqual([409, 'NO_READY_DOCUMENTS']);
    res = await ask('khong-co', 'Câu hỏi?');
    expect([res.status, await errorCodeOf(res)]).toEqual([404, 'NOT_FOUND']);
    // đúng 2000 ký tự (đếm theo điểm mã Unicode, emoji = 1) vẫn hợp lệ về độ dài
    await readyDocument();
    res = await ask(conv, '😀'.repeat(2000));
    expect(res.status).toBe(200);
    void res.body!.cancel().catch(() => {});
  });

  it('answered: meta → status → delta → citation → done, citation trỏ tài liệu sẵn sàng', async () => {
    const docId = await readyDocument();
    const conv = await newConversation();
    const res = await ask(conv, 'Thời hạn bảo hành?');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const events = await readSse(res);
    expect(events.map((e) => e.event)).toEqual([
      'meta',
      'status',
      'status',
      'delta',
      'delta',
      'citation',
      'done',
    ]);
    expect(events[0].data).toMatchObject({ conversationId: conv });
    expect(events[1].data).toEqual({ phase: 'retrieving' });
    expect(events[2].data).toEqual({ phase: 'generating' });
    const text = events
      .filter((e) => e.event === 'delta')
      .map((e) => (e.data as { text: string }).text)
      .join('');
    expect(text).toContain('[1]');
    expect(events[5].data).toMatchObject({ index: 1, documentId: docId, page: 12 });
    expect(events[6].data).toMatchObject({
      result: 'answered',
      usage: { promptTokens: expect.any(Number) },
    });
  });

  it('not_found: một delta cố định, KHÔNG có citation, done not_found', async () => {
    await readyDocument();
    const conv = await newConversation();
    const events = await readSse(await ask(conv, 'Giá vàng hôm nay? #not_found'));
    expect(events.map((e) => e.event)).toEqual(['meta', 'status', 'status', 'delta', 'done']);
    expect(events.at(-1)!.data).toMatchObject({ result: 'not_found' });
  });

  it('partial: có citation và done partial', async () => {
    await readyDocument();
    const events = await readSse(await ask(await newConversation(), 'Hỏi hai vế #partial'));
    expect(events.map((e) => e.event)).toContain('citation');
    expect(events.at(-1)!.data).toMatchObject({ result: 'partial' });
  });

  it('timeout: kết thúc bằng error TIMEOUT retryable, KHÔNG có done', async () => {
    await readyDocument();
    const events = await readSse(await ask(await newConversation(), 'Chậm #timeout'));
    expect(events.at(-1)).toMatchObject({
      event: 'error',
      data: { code: 'TIMEOUT', retryable: true },
    });
    expect(events.some((e) => e.event === 'done')).toBe(false);
  });

  it('llm-error: error LLM_UNAVAILABLE ngay sau meta', async () => {
    await readyDocument();
    const events = await readSse(await ask(await newConversation(), 'Lỗi #llm-error'));
    expect(events.map((e) => e.event)).toEqual(['meta', 'error']);
    expect(events[1].data).toEqual({ code: 'LLM_UNAVAILABLE', retryable: true });
  });

  it('interrupted: luồng đóng giữa chừng, KHÔNG có done lẫn error (phía nhận coi là gián đoạn)', async () => {
    await readyDocument();
    const events = await readSse(await ask(await newConversation(), 'Đứt #interrupted'));
    expect(events.some((e) => e.event === 'delta')).toBe(true);
    expect(events.some((e) => e.event === 'done' || e.event === 'error')).toBe(false);
  });

  it('phía nhận hủy luồng thì máy chủ giả dừng phát (không rò)', async () => {
    db.config.tokenDelayMs = 20;
    await readyDocument();
    const res = await ask(await newConversation(), 'Dài');
    const reader = res.body!.getReader();
    await reader.read();
    void reader.cancel().catch(() => {});
    db.reset(); // hủy mọi luồng đang mở
    await new Promise((r) => setTimeout(r, 20));
    expect(db.documents).toEqual([]); // không treo, không ném lỗi
  });

  it('kịch bản mặc định đổi được bằng cấu hình', async () => {
    await readyDocument();
    db.config.defaultScenario = 'not_found';
    const events = await readSse(await ask(await newConversation(), 'Bất kỳ'));
    expect(events.at(-1)!.data).toMatchObject({ result: 'not_found' });
  });
});

describe('luồng chính đầu-cuối trên API giả (không cần backend)', () => {
  it('đăng nhập → tải lên → chờ sẵn sàng qua SSE → hỏi → có trích dẫn → xem nguồn theo Range', async () => {
    // 1. đăng nhập
    await signIn();
    expect((await fetchMe()).role).toBe('MEMBER');

    // 2. mở kênh sự kiện rồi tải lên
    const eventsRes = await rawFetch('/api/events');
    const ready = readSse(eventsRes, (e) =>
      e.some((x) => (x.data as { status?: string })?.status === 'READY'),
    );
    const accepted = (await (await upload(pdf('hop-dong-A.pdf'))).json()) as UploadAccepted;

    // 3. tài liệu xử lý xong → nhận sự kiện READY
    db.flushProcessing();
    const events = await ready;
    expect(events.find((e) => e.event === 'document.updated')?.data).toMatchObject({
      id: accepted.id,
      status: 'READY',
    });

    // 4. hỏi đáp
    const conv = await newConversation();
    const answer = await readSse(await ask(conv, 'Thời hạn bảo hành của hợp đồng A?'));
    const citation = answer.find((e) => e.event === 'citation')!.data as {
      documentId: string;
      page: number;
    };
    expect(answer.at(-1)!.data).toMatchObject({ result: 'answered' });
    expect(citation.documentId).toBe(accepted.id);

    // 5. xem nguồn: tải một khoảng của PDF gốc
    const part = await rawFetch(`/api/documents/${citation.documentId}/file`, {
      headers: { Range: 'bytes=0-4' },
    });
    expect(part.status).toBe(206);
    expect(new TextDecoder().decode(await part.arrayBuffer())).toBe('%PDF-');

    // 6. đăng xuất → không còn truy cập
    await logout();
    expect((await rawFetch('/api/documents')).status).toBe(401);
  });
});
