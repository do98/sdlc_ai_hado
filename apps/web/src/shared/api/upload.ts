import { ApiError, buildApiError } from './http';
import type { UploadAccepted } from './types';

export interface UploadOptions {
  /** Gọi theo byte đã gửi (độ chính xác phụ thuộc trình duyệt). */
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * IF-03: tải MỘT tệp PDF (multipart, trường `file`). Dùng XMLHttpRequest vì fetch chưa báo được tiến trình tải lên;
 * đây là nơi duy nhất ngoài http.ts được gọi mạng (luật R-3).
 * Lỗi: ApiError (mạng → status 0 NETWORK_ERROR; máy chủ → mã theo hợp đồng); bị hủy → DOMException AbortError.
 */
export function uploadDocument(file: File, options: UploadOptions = {}): Promise<UploadAccepted> {
  const { onProgress, signal } = options;
  return new Promise<UploadAccepted>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('aborted', 'AbortError'));
      return;
    }
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    xhr.open('POST', '/api/documents');
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadAccepted);
        } catch {
          reject(new ApiError(xhr.status, 'UNKNOWN_ERROR'));
        }
        return;
      }
      reject(buildApiError(xhr.status, xhr.responseText ?? ''));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new ApiError(0, 'NETWORK_ERROR'));
    };
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('aborted', 'AbortError'));
    };
    xhr.send(form);
  });
}
