package vn.docchat.api;

/**
 * Thân lỗi chuẩn của API: {@code code} ổn định để FE ánh xạ thông điệp tiếng Việt; {@code message}
 * ngắn, chung, không lộ chi tiết nội bộ; {@code traceId} lấy từ header {@code X-Request-Id}.
 */
public record ApiError(String code, String message, String traceId) {}
