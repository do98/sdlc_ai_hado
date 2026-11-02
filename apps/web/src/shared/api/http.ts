// Lớp gọi mạng DUY NHẤT của ứng dụng (luật R-3). Gửi cookie phiên, chuẩn hóa lỗi, báo khi phiên hết hạn.
import { isRetryable, messageForError } from './errors';

export class ApiError extends Error {
  /** Có nên đề nghị thử lại. `message` (từ Error) là thông điệp tiếng Việt an toàn để hiển thị, không lộ mã kỹ thuật. */
  public readonly retryable: boolean;

  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly traceId?: string,
  ) {
    super(messageForError(code, status));
    this.name = 'ApiError';
    this.retryable = isRetryable(code, status);
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Đăng ký hàm được gọi khi một yêu cầu bất kỳ nhận 401 (phiên hết hạn hoặc chưa đăng nhập). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** false: bỏ qua bộ xử lý 401 (đăng nhập sai mật khẩu cũng là 401 nhưng không phải "hết hạn"). */
  handleUnauthorized?: boolean;
}

export async function apiRequest<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, handleUnauthorized = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'NETWORK_ERROR');
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  throw buildApiError(response.status, await response.text().catch(() => ''), handleUnauthorized);
}

/**
 * Dựng ApiError từ phản hồi lỗi (dùng chung cho fetch và XMLHttpRequest). Thân không phải JSON (ví dụ lỗi từ
 * reverse proxy) vẫn cho mã hợp lý theo trạng thái HTTP: 401 → UNAUTHENTICATED, 413 → FILE_TOO_LARGE.
 * 401 gọi bộ xử lý hết phiên (trừ khi handleUnauthorized=false).
 */
export function buildApiError(
  status: number,
  bodyText: string,
  handleUnauthorized = true,
): ApiError {
  let code = 'UNKNOWN_ERROR';
  let traceId: string | undefined;
  try {
    const data = JSON.parse(bodyText) as { code?: string; traceId?: string | null };
    if (typeof data.code === 'string') code = data.code;
    if (typeof data.traceId === 'string') traceId = data.traceId;
  } catch {
    // không phải JSON: dùng mã mặc định theo trạng thái bên dưới
  }
  if (code === 'UNKNOWN_ERROR') {
    if (status === 401) code = 'UNAUTHENTICATED';
    else if (status === 413) code = 'FILE_TOO_LARGE';
  }
  if (status === 401 && handleUnauthorized) unauthorizedHandler?.();
  return new ApiError(status, code, traceId);
}
