import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, setUnauthorizedHandler } from './http';
import { uploadDocument } from './upload';

class FakeXhr {
  static last: FakeXhr;
  status = 0;
  responseText = '';
  withCredentials = false;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: FormData | null = null;
  aborted = false;
  upload: {
    onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null;
  } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  respond(status: number, text: string) {
    this.status = status;
    this.responseText = text;
    this.onload?.();
  }
}

const pdf = () => new File(['%PDF-1.4'], 'a.pdf');

describe('uploadDocument (IF-03, XMLHttpRequest)', () => {
  beforeEach(() => vi.stubGlobal('XMLHttpRequest', FakeXhr));
  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('US002_AC1: gửi multipart một tệp ở trường "file" tới POST /api/documents kèm cookie phiên', async () => {
    const p = uploadDocument(pdf());
    const x = FakeXhr.last;
    expect(x.method).toBe('POST');
    expect(x.url).toBe('/api/documents');
    expect(x.withCredentials).toBe(true);
    expect((x.body as FormData).getAll('file')).toHaveLength(1);
    x.respond(202, JSON.stringify({ id: 'd1', status: 'PROCESSING' }));
    await expect(p).resolves.toEqual({ id: 'd1', status: 'PROCESSING' });
  });

  it('US002_AC1: báo tiến trình theo byte (bỏ qua khi không tính được tổng)', async () => {
    const onProgress = vi.fn();
    const p = uploadDocument(pdf(), { onProgress });
    const x = FakeXhr.last;
    x.upload.onprogress?.({ lengthComputable: true, loaded: 40, total: 100 });
    x.upload.onprogress?.({ lengthComputable: false, loaded: 50, total: 0 });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(40, 100);
    x.respond(202, '{"id":"d","status":"PROCESSING"}');
    await p;
  });

  it('US003_AC3: 413 không có thân JSON → FILE_TOO_LARGE', async () => {
    const p = uploadDocument(pdf());
    FakeXhr.last.respond(413, '<html>Request Entity Too Large</html>');
    await expect(p).rejects.toMatchObject({ status: 413, code: 'FILE_TOO_LARGE' });
  });

  it('US003_AC1: 415 theo hợp đồng → NOT_PDF', async () => {
    const p = uploadDocument(pdf());
    FakeXhr.last.respond(415, JSON.stringify({ code: 'NOT_PDF', traceId: 't-1' }));
    await expect(p).rejects.toMatchObject({ status: 415, code: 'NOT_PDF', traceId: 't-1' });
  });

  it('lỗi 5xx có thân JSON giữ nguyên mã lỗi', async () => {
    const p = uploadDocument(pdf());
    FakeXhr.last.respond(503, JSON.stringify({ code: 'NOT_READY' }));
    await expect(p).rejects.toMatchObject({ status: 503, code: 'NOT_READY' });
  });

  it('401 gọi bộ xử lý hết phiên', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const p = uploadDocument(pdf());
    FakeXhr.last.respond(401, '');
    await expect(p).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('US002_AC2: lỗi mạng → ApiError status 0 NETWORK_ERROR (đủ điều kiện tự thử lại)', async () => {
    const p = uploadDocument(pdf());
    FakeXhr.last.onerror?.();
    const e = await p.catch((err: unknown) => err);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('thân 2xx không phải JSON → lỗi UNKNOWN_ERROR', async () => {
    const p = uploadDocument(pdf());
    FakeXhr.last.respond(202, 'not json');
    await expect(p).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' });
  });

  it('US006_AC1: hủy bằng AbortSignal → abort XHR và báo AbortError', async () => {
    const c = new AbortController();
    const p = uploadDocument(pdf(), { signal: c.signal });
    c.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeXhr.last.aborted).toBe(true);
  });

  it('signal đã bị hủy trước khi gọi → không tạo yêu cầu', async () => {
    const c = new AbortController();
    c.abort();
    const before = FakeXhr.last;
    await expect(uploadDocument(pdf(), { signal: c.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(FakeXhr.last).toBe(before);
  });
});
