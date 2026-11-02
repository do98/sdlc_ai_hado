import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, setUnauthorizedHandler } from './http';

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  const fetchMock = vi.fn();
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    onUnauthorized.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    setUnauthorizedHandler(onUnauthorized);
  });
  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });

  it('gửi cookie phiên và JSON, trả thân JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: '1' }));
    const r = await apiRequest<{ id: string }>('/api/me');
    expect(r).toEqual({ id: '1' });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/me');
    expect(init.credentials).toBe('include');
    expect(init.method).toBe('GET');
  });

  it('POST có body thì đặt Content-Type và stringify', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const r = await apiRequest('/api/auth/login', { method: 'POST', body: { a: 1 } });
    expect(r).toBeUndefined();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('chuẩn hóa lỗi thành ApiError có mã và traceId', async () => {
    fetchMock.mockResolvedValue(jsonResponse(423, { code: 'ACCOUNT_LOCKED', traceId: 't-1' }));
    await expect(apiRequest('/x', { handleUnauthorized: false })).rejects.toMatchObject({
      status: 423,
      code: 'ACCOUNT_LOCKED',
      traceId: 't-1',
    });
  });

  it('401 gọi bộ xử lý hết hạn; handleUnauthorized=false thì không', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { code: 'UNAUTHENTICATED' }));
    await expect(apiRequest('/api/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    onUnauthorized.mockReset();
    await expect(
      apiRequest('/api/auth/login', { handleUnauthorized: false }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('thân không phải JSON (lỗi từ proxy) vẫn cho ApiError, 401 → UNAUTHENTICATED', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('mất mạng → ApiError status 0 NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('hủy yêu cầu (AbortError) được ném nguyên, không bị coi là lỗi mạng', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    await expect(apiRequest('/x')).rejects.toMatchObject({ name: 'AbortError' });
  });
});
