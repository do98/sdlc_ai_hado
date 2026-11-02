package vn.docchat.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UuidsTest {

    @Test
    void v7_co_version_7_variant_rfc_va_nhung_thoi_gian() {
        Instant at = Instant.parse("2026-01-01T00:00:00Z");
        UUID id = Uuids.v7(at);
        assertThat(id.version()).isEqualTo(7);
        assertThat(id.variant()).isEqualTo(2);
        assertThat(id.getMostSignificantBits() >>> 16).isEqualTo(at.toEpochMilli());
    }

    @Test
    void v7_tang_theo_thoi_gian() {
        UUID a = Uuids.v7(Instant.parse("2026-01-01T00:00:00Z"));
        UUID b = Uuids.v7(Instant.parse("2026-01-01T00:00:01Z"));
        assertThat(a.toString().compareTo(b.toString())).isNegative();
    }
}
