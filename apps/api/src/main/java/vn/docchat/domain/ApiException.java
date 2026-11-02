package vn.docchat.domain;

/**
 * Lỗi nghiệp vụ có mã ổn định; tầng API ánh xạ sang HTTP status và thân lỗi chuẩn. Không mang stack
 * trace.
 */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final long retryAfterSeconds;

    public ApiException(ErrorCode code) {
        this(code, 0);
    }

    public ApiException(ErrorCode code, long retryAfterSeconds) {
        super(code.name(), null, false, false);
        this.code = code;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public ErrorCode code() {
        return code;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
