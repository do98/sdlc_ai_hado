package vn.docchat.domain;

import java.time.Instant;
import java.util.UUID;

/** Tài khoản người dùng. {@code passwordHash} không bao giờ được đưa ra ngoài API. */
public record User(
        UUID id,
        String username,
        String passwordHash,
        Role role,
        int failedLogins,
        Instant lockedUntil,
        Instant createdAt) {

    public boolean isLockedAt(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }
}
