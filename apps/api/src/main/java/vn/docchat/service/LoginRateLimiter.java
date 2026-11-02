package vn.docchat.service;

import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.ErrorCode;

/**
 * Giới hạn số lần thử đăng nhập theo địa chỉ IP (cửa sổ cố định 1 phút, trong bộ nhớ), bổ sung cho
 * khóa theo tài khoản để chống dò tài khoản. Trong bộ nhớ nên chỉ đúng với một bản API; nhiều bản
 * cần kho dùng chung.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_TRACKED = 50_000;

    private record Window(long startEpochSecond, int count) {}

    private final AuthProperties props;
    private final Clock clock;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public LoginRateLimiter(AuthProperties props, Clock clock) {
        this.props = props;
        this.clock = clock;
    }

    /** Ném {@link ApiException} mã RATE_LIMITED (kèm số giây chờ) nếu vượt hạn mức. */
    public void check(String clientKey) {
        long now = Instant.now(clock).getEpochSecond();
        long minute = now - (now % 60);
        if (windows.size() > MAX_TRACKED) {
            windows.entrySet().removeIf(e -> e.getValue().startEpochSecond() < minute);
        }
        Window w =
                windows.merge(
                        clientKey,
                        new Window(minute, 1),
                        (old, fresh) ->
                                old.startEpochSecond() == minute
                                        ? new Window(minute, old.count() + 1)
                                        : fresh);
        if (w.count() > props.loginRateLimitPerMinute()) {
            throw new ApiException(ErrorCode.RATE_LIMITED, Math.max(1, minute + 60 - now));
        }
    }
}
