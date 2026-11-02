package vn.docchat.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import vn.docchat.common.Uuids;
import vn.docchat.domain.Role;
import vn.docchat.repository.UserRepository;

/**
 * Nền cho test tích hợp: PostgreSQL thật (nhúng, không cần Docker), Flyway chạy migration thật,
 * đồng hồ giả. Dùng chung một PostgreSQL cho cả lượt chạy test; mỗi test xóa dữ liệu người dùng
 * trước khi chạy.
 */
@SpringBootTest(properties = "docchat.auth.login-rate-limit-per-minute=100000")
@AutoConfigureMockMvc
@Import(PostgresTestBase.TestClockConfig.class)
public abstract class PostgresTestBase {

    protected static final Instant T0 = Instant.parse("2026-01-01T00:00:00Z");
    protected static final String PASSWORD = "correct horse battery staple";

    /** base64 của 32 byte 0x01..0x20, chỉ dùng cho test */
    protected static final String TEST_KEY =
            java.util.Base64.getEncoder()
                    .encodeToString(
                            java.util.stream.IntStream.rangeClosed(1, 32)
                                    .collect(
                                            java.io.ByteArrayOutputStream::new,
                                            (o, i) -> o.write(i),
                                            (a, b) -> {})
                                    .toByteArray());

    protected static final java.nio.file.Path STORAGE_DIR = tempDir();

    private static java.nio.file.Path tempDir() {
        try {
            return java.nio.file.Files.createTempDirectory("docchat-test-storage");
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    private static final EmbeddedPostgres PG = start();

    private static EmbeddedPostgres start() {
        try {
            return EmbeddedPostgres.builder().start();
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        MutableClock testClock() {
            return new MutableClock(T0);
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "");
        // PostgreSQL nhúng không có pgvector → không chạy migration db/vector (xem application.yml)
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
        registry.add("docchat.storage.dir", () -> STORAGE_DIR.toString());
        registry.add("docchat.storage.encryption-key", () -> TEST_KEY);
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected MutableClock clock;
    @Autowired protected UserRepository users;
    @Autowired protected PasswordEncoder encoder;
    @Autowired protected Clock springClock;

    @BeforeEach
    void resetState() {
        jdbc.update("TRUNCATE users CASCADE");
        jdbc.update("TRUNCATE audit_log, analytics_events, events");
        clearStoredFiles();
        clock.set(T0);
    }

    private static void clearStoredFiles() {
        java.nio.file.Path docs = STORAGE_DIR.resolve("documents");
        if (!java.nio.file.Files.exists(docs)) {
            return;
        }
        try (var walk = java.nio.file.Files.walk(docs)) {
            walk.sorted(java.util.Comparator.reverseOrder())
                    .filter(p -> !p.equals(docs))
                    .forEach(
                            p -> {
                                try {
                                    java.nio.file.Files.delete(p);
                                } catch (java.io.IOException e) {
                                    throw new java.io.UncheckedIOException(e);
                                }
                            });
        } catch (java.io.IOException e) {
            throw new java.io.UncheckedIOException(e);
        }
    }

    protected void createUser(String username, String password, Role role) {
        users.insertIfAbsent(Uuids.v7(), username, encoder.encode(password), role, clock.instant());
    }
}
