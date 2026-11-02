package vn.docchat;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;

/**
 * Chạy backend cục bộ để xem/thử giao diện mà KHÔNG cần cài PostgreSQL hay Docker: khởi động
 * PostgreSQL nhúng (dữ liệu lưu ở {@code target/dev-postgres}, giữ lại giữa các lần chạy) rồi chạy
 * ứng dụng.
 *
 * <p>Chạy: {@code ./mvnw spring-boot:test-run -Dspring-boot.run.main-class=vn.docchat.DevServer}
 *
 * <p>Tài khoản mặc định chỉ dành cho máy phát triển; đổi bằng biến môi trường {@code
 * DOCCHAT_ADMIN_USERNAME} / {@code DOCCHAT_ADMIN_PASSWORD}. KHÔNG dùng ở môi trường thật.
 */
public final class DevServer {

    private static final int DB_PORT = 54329;

    private DevServer() {}

    public static void main(String[] args) throws Exception {
        EmbeddedPostgres pg =
                EmbeddedPostgres.builder()
                        .setPort(DB_PORT)
                        .setDataDirectory(Path.of("target", "dev-postgres"))
                        .setCleanDataDirectory(false)
                        .start();
        Runtime.getRuntime()
                .addShutdownHook(
                        new Thread(
                                () -> {
                                    try {
                                        pg.close();
                                    } catch (Exception ignored) {
                                        // tắt máy: bỏ qua
                                    }
                                }));

        // Thuộc tính hệ thống có ưu tiên cao hơn application.yml (setDefaultProperties thì thấp
        // hơn)
        System.setProperty("spring.datasource.url", pg.getJdbcUrl("postgres", "postgres"));
        System.setProperty("spring.datasource.username", "postgres");
        System.setProperty("spring.datasource.password", "");
        System.setProperty("docchat.auth.cookie-secure", "false");
        // PostgreSQL nhúng không có pgvector → bỏ qua migration db/vector
        System.setProperty("spring.flyway.locations", "classpath:db/migration");
        System.setProperty(
                "docchat.storage.dir",
                Path.of("target", "dev-storage").toAbsolutePath().toString());
        // Khóa mã hóa tệp CHỈ cho dev (base64 của 32 byte cố định); môi trường thật phải tự sinh
        // khóa riêng
        System.setProperty(
                "docchat.storage.encryption-key",
                env(
                        "DOCCHAT_STORAGE_ENCRYPTION_KEY",
                        "ZGV2LW9ubHkta2V5LWRvLW5vdC11c2UtaW4tcHJvZCE="));
        // Giao diện dev (Vite) chạy ở cổng 5173 và gọi /api qua proxy: cho phép origin đó (kiểm tra
        // CSRF)
        System.setProperty(
                "docchat.auth.allowed-origins", "http://localhost:5173,http://127.0.0.1:5173");
        System.setProperty("docchat.admin.username", env("DOCCHAT_ADMIN_USERNAME", "admin"));
        System.setProperty(
                "docchat.admin.password", env("DOCCHAT_ADMIN_PASSWORD", "Docchat-Dev-2026!"));
        SpringApplication app = new SpringApplication(DocchatApplication.class);
        app.run(args);
    }

    private static String env(String name, String fallback) {
        String v = System.getenv(name);
        return v == null || v.isBlank() ? fallback : v;
    }
}
