import { describe, expect, it } from 'vitest';
import { messages } from '../lib/messages';
import { ApiError } from './http';
import { isRetryable, messageForError } from './errors';

describe('messageForError / isRetryable (T02.d)', () => {
  it('mã trong hợp đồng → thông điệp riêng', () => {
    expect(messageForError('NOT_PDF', 415)).toBe(messages.errors.notPdf);
    expect(messageForError('FILE_TOO_LARGE', 413)).toContain('10 MB');
    expect(messageForError('WORKSPACE_FULL', 409)).toContain('20');
  });

  it('401 và 423 cố ý dùng cùng thông điệp, không nêu lý do chi tiết', () => {
    expect(messageForError('INVALID_CREDENTIALS', 401)).toBe(
      messageForError('ACCOUNT_LOCKED', 423),
    );
  });

  it('mã lạ không làm vỡ UI: 403 → thông điệp về quyền; còn lại → thông điệp chung', () => {
    expect(messageForError('KHONG_BIET_MA_NAY', 403)).toBe(messages.errors.permission);
    expect(messageForError('KHONG_BIET_MA_NAY', 418)).toBe(messages.errors.generic);
    expect(messageForError('', 0)).toBe(messages.errors.generic);
    expect(messageForError('__proto__', 400)).toBe(messages.errors.generic);
    expect(messageForError('toString', 400)).toBe(messages.errors.generic);
  });

  it('lỗi mạng có thông điệp riêng; mã lạ thử lại được với mạng, 429 và 5xx', () => {
    expect(messageForError('NETWORK_ERROR', 0)).toBe(messages.auth.network);
    expect(isRetryable('NETWORK_ERROR', 0)).toBe(true);
    expect(isRetryable('???', 0)).toBe(true);
    expect(isRetryable('???', 429)).toBe(true);
    expect(isRetryable('???', 503)).toBe(true);
    expect(isRetryable('???', 400)).toBe(false);
    expect(isRetryable('???', 404)).toBe(false);
  });
});

describe('ApiError', () => {
  it('mang status, code, message tiếng Việt, retryable và traceId', () => {
    const e = new ApiError(503, 'LLM_UNAVAILABLE', 'trace-1');
    expect(e.status).toBe(503);
    expect(e.code).toBe('LLM_UNAVAILABLE');
    expect(e.message).toBe(messages.errors.llmUnavailable);
    expect(e.retryable).toBe(true);
    expect(e.traceId).toBe('trace-1');
    expect(e).toBeInstanceOf(Error);
  });

  it('5xx và mất mạng ánh xạ đúng', () => {
    expect(new ApiError(0, 'NETWORK_ERROR').retryable).toBe(true);
    expect(new ApiError(500, 'INTERNAL').message).toBe(messages.errors.internal);
    expect(new ApiError(403, 'CSRF_REJECTED').message).toBe(messages.errors.csrf);
    expect(new ApiError(404, 'NOT_FOUND').retryable).toBe(false);
  });
});
