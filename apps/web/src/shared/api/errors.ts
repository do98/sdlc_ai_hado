import { messages } from '../lib/messages';

/**
 * Ánh xạ mã lỗi API → thông điệp tiếng Việt (T02.d) và cờ `retryable`.
 * Tập mã và cờ `retryable` phải khớp `components.schemas.ErrorCode` trong api/openapi.yaml (có test kiểm chứng);
 * thông điệp là chuỗi hiển thị nên chỉ nằm ở frontend.
 */
export const API_ERRORS = {
  UNAUTHENTICATED: { message: messages.auth.expired, retryable: false },
  INVALID_CREDENTIALS: { message: messages.auth.failed, retryable: false },
  ACCOUNT_LOCKED: { message: messages.auth.failed, retryable: false }, // cố ý trùng: không nêu lý do chi tiết
  CSRF_REJECTED: { message: messages.errors.csrf, retryable: false },
  INVALID_REQUEST: { message: messages.errors.invalidRequest, retryable: false },
  NOT_PDF: { message: messages.errors.notPdf, retryable: false },
  FILE_TOO_LARGE: { message: messages.errors.fileTooLarge, retryable: false },
  WORKSPACE_FULL: { message: messages.errors.workspaceFull, retryable: false },
  EMPTY_QUESTION: { message: messages.errors.emptyQuestion, retryable: false },
  QUESTION_TOO_LONG: { message: messages.errors.questionTooLong, retryable: false },
  NO_READY_DOCUMENTS: { message: messages.errors.noReadyDocuments, retryable: false },
  RATE_LIMITED: { message: messages.auth.rateLimited, retryable: true },
  LLM_UNAVAILABLE: { message: messages.errors.llmUnavailable, retryable: true },
  TIMEOUT: { message: messages.errors.timeout, retryable: true },
  NOT_FOUND: { message: messages.errors.notFound, retryable: false },
  METHOD_NOT_ALLOWED: { message: messages.errors.methodNotAllowed, retryable: false },
  UNSUPPORTED_MEDIA_TYPE: { message: messages.errors.unsupportedMediaType, retryable: false },
  NOT_READY: { message: messages.errors.notReady, retryable: true },
  INTERNAL: { message: messages.errors.internal, retryable: true },
} as const;

export type ApiErrorCode = keyof typeof API_ERRORS;

/** Mã chỉ có ở phía trình duyệt (không có trong hợp đồng API). */
export const CLIENT_ERRORS = {
  NETWORK_ERROR: { message: messages.auth.network, retryable: true },
  UNKNOWN_ERROR: { message: messages.errors.generic, retryable: false },
} as const;

export type ClientErrorCode = keyof typeof CLIENT_ERRORS;

export function isApiErrorCode(code: string): code is ApiErrorCode {
  return Object.prototype.hasOwnProperty.call(API_ERRORS, code);
}

/**
 * Thông điệp cho một lỗi. Mã lạ không làm vỡ UI: 403 → thông điệp về quyền; còn lại → thông điệp chung.
 * Không bao giờ trả mã kỹ thuật hay nội dung do máy chủ gửi cho người dùng.
 */
export function messageForError(code: string, status = 0): string {
  if (isApiErrorCode(code)) return API_ERRORS[code].message;
  if (Object.prototype.hasOwnProperty.call(CLIENT_ERRORS, code)) {
    return CLIENT_ERRORS[code as ClientErrorCode].message;
  }
  if (status === 403) return messages.errors.permission;
  return messages.errors.generic;
}

/** Có nên đề nghị người dùng thử lại không. Mã lạ: thử lại được với lỗi mạng, 429 và 5xx. */
export function isRetryable(code: string, status = 0): boolean {
  if (isApiErrorCode(code)) return API_ERRORS[code].retryable;
  if (Object.prototype.hasOwnProperty.call(CLIENT_ERRORS, code)) {
    return CLIENT_ERRORS[code as ClientErrorCode].retryable;
  }
  return status === 0 || status === 429 || status >= 500;
}
