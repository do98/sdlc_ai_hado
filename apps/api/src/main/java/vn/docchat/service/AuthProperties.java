package vn.docchat.service;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Cấu hình đăng nhập (tiền tố {@code docchat.auth}); giá trị mặc định theo T04. */
@ConfigurationProperties("docchat.auth")
public record AuthProperties(
        @DefaultValue("PT8H") Duration sessionTtl,
        @DefaultValue("5") int maxFailedLogins,
        @DefaultValue("PT15M") Duration lockDuration,
        @DefaultValue("DOCCHAT_SESSION") String cookieName,
        @DefaultValue("true") boolean cookieSecure,
        @DefaultValue("Lax") String cookieSameSite,
        @DefaultValue List<String> allowedOrigins,
        @DefaultValue("20") int loginRateLimitPerMinute,
        @DefaultValue("12") int minPasswordLength) {}
