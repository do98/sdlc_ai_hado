package vn.docchat.service;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Giới hạn nghiệp vụ (tiền tố {@code docchat.limits}); mặc định theo kế hoạch phát triển và {@code
 * [TBD: OQ-004]}. Đổi bằng biến môi trường, không cần sửa mã (ví dụ {@code
 * DOCCHAT_LIMITS_MAX_FILE_MB}).
 */
@ConfigurationProperties("docchat.limits")
public record LimitsProperties(
        @DefaultValue("10") int maxFileMb,
        @DefaultValue("100") int maxPages,
        @DefaultValue("20") int maxDocuments) {

    public long maxFileBytes() {
        return maxFileMb * 1024L * 1024L;
    }
}
