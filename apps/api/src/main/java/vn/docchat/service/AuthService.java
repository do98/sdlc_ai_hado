package vn.docchat.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.AuthSession;
import vn.docchat.domain.ErrorCode;
import vn.docchat.domain.User;
import vn.docchat.repository.SessionRepository;
import vn.docchat.repository.UserRepository;

/**
 * Đăng nhập, phiên và khóa tạm (T04).
 *
 * <ul>
 *   <li>Mã phiên: 256 bit ngẫu nhiên, gửi qua cookie; CSDL chỉ lưu băm SHA-256.
 *   <li>Hạn phiên <b>tuyệt đối</b> {@code sessionTtl} kể từ lúc đăng nhập (đề xuất của T04).
 *   <li>Sai {@code maxFailedLogins} lần → khóa {@code lockDuration}; lần thử kế tiếp trả
 *       ACCOUNT_LOCKED kể cả khi mật khẩu đúng. Tên không tồn tại bị theo dõi và khóa y hệt để
 *       không lộ tài khoản nào có thật.
 * </ul>
 */
@Service
public class AuthService {

    /** Kết quả đăng nhập: mã phiên (chỉ trả một lần) và thời điểm hết hạn. */
    public record Login(String sessionToken, Instant expiresAt) {}

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_UNKNOWN_TRACKED = 10_000;

    private record Attempts(int count, Instant lockedUntil) {}

    private final UserRepository users;
    private final SessionRepository sessions;
    private final PasswordEncoder encoder;
    private final AuthProperties props;
    private final Clock clock;
    private final String dummyHash;
    private final Map<String, Attempts> unknownUsers = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository users,
            SessionRepository sessions,
            PasswordEncoder encoder,
            AuthProperties props,
            Clock clock) {
        this.users = users;
        this.sessions = sessions;
        this.encoder = encoder;
        this.props = props;
        this.clock = clock;
        // Băm giả để thời gian xử lý tên không tồn tại gần giống tên có thật
        this.dummyHash = encoder.encode("dummy-password-for-timing");
    }

    public Login login(String rawUsername, String password) {
        Instant now = Instant.now(clock);
        String username = normalize(rawUsername);
        Optional<User> found = users.findByUsername(username);

        if (found.isEmpty()) {
            encoder.matches(password, dummyHash);
            failUnknown(username, now);
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS); // failUnknown có thể ném LOCKED
        }

        User user = found.get();
        if (user.isLockedAt(now)) {
            throw new ApiException(ErrorCode.ACCOUNT_LOCKED, secondsUntil(user.lockedUntil(), now));
        }
        if (!encoder.matches(password, user.passwordHash())) {
            users.registerFailure(
                    user.id(), props.maxFailedLogins(), now.plus(props.lockDuration()));
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.failedLogins() > 0 || user.lockedUntil() != null) {
            users.resetFailures(user.id());
        }
        sessions.deleteExpired(now);
        String token = newToken();
        Instant expires = now.plus(props.sessionTtl());
        sessions.insert(new AuthSession(hash(token), user.id(), now, expires));
        return new Login(token, expires);
    }

    /** Trả người dùng của phiên, hoặc rỗng nếu mã không có/hết hạn/không hợp lệ. */
    public Optional<User> authenticate(String token) {
        if (token == null || token.isBlank() || token.length() > 128) {
            return Optional.empty();
        }
        String h = hash(token);
        Optional<AuthSession> session = sessions.findByTokenHash(h);
        if (session.isEmpty()) {
            return Optional.empty();
        }
        if (session.get().isExpiredAt(Instant.now(clock))) {
            sessions.delete(h);
            return Optional.empty();
        }
        return users.findById(session.get().userId());
    }

    /** Hủy phiên phía máy chủ; không lỗi nếu phiên không tồn tại. */
    public void logout(String token) {
        if (token != null && !token.isBlank() && token.length() <= 128) {
            sessions.delete(hash(token));
        }
    }

    // ---- theo dõi tên đăng nhập không tồn tại (chống liệt kê tài khoản) ----

    private void failUnknown(String username, Instant now) {
        if (unknownUsers.size() > MAX_UNKNOWN_TRACKED) {
            unknownUsers.entrySet().removeIf(e -> !e.getValue().lockedUntil().isAfter(now));
        }
        Attempts[] result = new Attempts[1];
        unknownUsers.compute(
                username,
                (k, cur) -> {
                    Attempts a = cur == null ? new Attempts(0, Instant.EPOCH) : cur;
                    if (a.lockedUntil().isAfter(now)) {
                        result[0] = a;
                        return a;
                    }
                    int next = a.count() + 1;
                    Attempts updated =
                            next >= props.maxFailedLogins()
                                    ? new Attempts(0, now.plus(props.lockDuration()))
                                    : new Attempts(next, Instant.EPOCH);
                    result[0] = null; // lần này chỉ là sai mật khẩu
                    return updated;
                });
        if (result[0] != null) {
            throw new ApiException(
                    ErrorCode.ACCOUNT_LOCKED, secondsUntil(result[0].lockedUntil(), now));
        }
    }

    // ---- tiện ích ----

    static String normalize(String username) {
        return username == null
                ? ""
                : java.text.Normalizer.normalize(username.strip(), java.text.Normalizer.Form.NFC)
                        .toLowerCase(Locale.ROOT);
    }

    private static long secondsUntil(Instant t, Instant now) {
        return Math.max(1, t.getEpochSecond() - now.getEpochSecond());
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            byte[] d =
                    MessageDigest.getInstance("SHA-256")
                            .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
