package vn.docchat.service;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Kênh sự kiện (tiền tố {@code docchat.events}); mặc định theo T09 {@code [Đề xuất]}. */
@ConfigurationProperties("docchat.events")
public record EventsProperties(
        /** Chu kỳ gửi {@code : ping} và kiểm tra lại phiên. */
        @DefaultValue("PT15S") Duration heartbeat,
        /** Số sự kiện tối đa được phát bù; nhiều hơn thì gửi {@code resync}. */
        @DefaultValue("1000") int historyLimit,
        /** Sự kiện cũ hơn mức này bị dọn. */
        @DefaultValue("PT24H") Duration retention) {}
