package vn.docchat.common;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

/** UUID v7 (48 bit thời gian ms + ngẫu nhiên), sinh ở tầng ứng dụng. */
public final class Uuids {

    private static final SecureRandom RANDOM = new SecureRandom();

    private Uuids() {}

    public static UUID v7() {
        return v7(Instant.now());
    }

    public static UUID v7(Instant at) {
        long ms = at.toEpochMilli();
        long msb = (ms << 16) | 0x7000L | (RANDOM.nextInt() & 0x0FFF);
        long lsb = (RANDOM.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L;
        return new UUID(msb, lsb);
    }
}
