package vn.docchat.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Phiên đăng nhập phía máy chủ; {@code tokenHash} là băm SHA-256 (hex) của mã phiên trong cookie.
 */
public record AuthSession(String tokenHash, UUID userId, Instant createdAt, Instant expiresAt) {

    public boolean isExpiredAt(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
