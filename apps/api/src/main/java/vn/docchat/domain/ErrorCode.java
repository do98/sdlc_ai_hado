package vn.docchat.domain;

/**
 * Danh mục mã lỗi API duy nhất (T05). Phải khớp {@code components.schemas.ErrorCode.x-catalog}
 * trong {@code api/openapi.yaml}; có test kiểm chứng. Văn bản tiếng Việt cho người dùng do frontend
 * ánh xạ theo mã.
 */
public enum ErrorCode {
    UNAUTHENTICATED(401, false),
    INVALID_CREDENTIALS(401, false),
    ACCOUNT_LOCKED(423, false),
    CSRF_REJECTED(403, false),
    INVALID_REQUEST(400, false),
    NOT_PDF(415, false),
    FILE_TOO_LARGE(413, false),
    WORKSPACE_FULL(409, false),
    EMPTY_QUESTION(422, false),
    QUESTION_TOO_LONG(422, false),
    NO_READY_DOCUMENTS(409, false),
    RATE_LIMITED(429, true),
    LLM_UNAVAILABLE(503, true),
    TIMEOUT(504, true),
    NOT_FOUND(404, false),
    METHOD_NOT_ALLOWED(405, false),
    UNSUPPORTED_MEDIA_TYPE(415, false),
    NOT_READY(503, true),
    INTERNAL(500, true);

    private final int httpStatus;
    private final boolean retryable;

    ErrorCode(int httpStatus, boolean retryable) {
        this.httpStatus = httpStatus;
        this.retryable = retryable;
    }

    public int httpStatus() {
        return httpStatus;
    }

    public boolean retryable() {
        return retryable;
    }
}
