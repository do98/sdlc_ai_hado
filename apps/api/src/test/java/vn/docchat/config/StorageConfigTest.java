package vn.docchat.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/**
 * T03.a — thiếu hoặc sai cấu hình bắt buộc thì không khởi động và thông báo nêu rõ khóa/biến môi
 * trường.
 */
class StorageConfigTest {

    private static final String GOOD_KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private final ApplicationContextRunner runner =
            new ApplicationContextRunner()
                    .withConfiguration(
                            org.springframework.boot.autoconfigure.AutoConfigurations.of(
                                    ValidationAutoConfiguration.class))
                    .withUserConfiguration(Props.class);

    @org.springframework.context.annotation.Configuration
    @org.springframework.boot.context.properties.EnableConfigurationProperties(
            StorageProperties.class)
    static class Props {}

    private static String rootMessage(Throwable t) {
        StringBuilder sb = new StringBuilder();
        for (Throwable c = t; c != null; c = c.getCause()) {
            sb.append(c.getMessage()).append('\n');
        }
        return sb.toString();
    }

    @Test
    void day_du_thi_khoi_dong() {
        runner.withPropertyValues(
                        "docchat.storage.dir=/data/files",
                        "docchat.storage.encryption-key=" + GOOD_KEY)
                .run(
                        ctx -> {
                            assertThat(ctx).hasNotFailed();
                            assertThat(ctx.getBean(StorageProperties.class).keyBytes()).hasSize(32);
                        });
    }

    @Test
    void thieu_thu_muc_thi_that_bai_va_nen_ten_bien() {
        runner.withPropertyValues("docchat.storage.encryption-key=" + GOOD_KEY)
                .run(
                        ctx -> {
                            assertThat(ctx).hasFailed();
                            assertThat(rootMessage(ctx.getStartupFailure()))
                                    .contains("DOCCHAT_STORAGE_DIR");
                        });
    }

    @Test
    void thu_muc_chuoi_rong_cung_that_bai() {
        runner.withPropertyValues(
                        "docchat.storage.dir=", "docchat.storage.encryption-key=" + GOOD_KEY)
                .run(
                        ctx ->
                                assertThat(rootMessage(ctx.getStartupFailure()))
                                        .contains("DOCCHAT_STORAGE_DIR"));
    }

    @Test
    void thieu_khoa_ma_hoa_thi_that_bai_va_nen_ten_bien() {
        runner.withPropertyValues("docchat.storage.dir=/data/files")
                .run(
                        ctx -> {
                            assertThat(ctx).hasFailed();
                            assertThat(rootMessage(ctx.getStartupFailure()))
                                    .contains("DOCCHAT_STORAGE_ENCRYPTION_KEY");
                        });
    }

    @Test
    void khoa_sai_do_dai_hoac_khong_phai_base64_thi_that_bai() {
        for (String bad :
                new String[] {
                    Base64.getEncoder().encodeToString(new byte[16]), "khong-phai-base64!!!", "AAAA"
                }) {
            runner.withPropertyValues(
                            "docchat.storage.dir=/data/files",
                            "docchat.storage.encryption-key=" + bad)
                    .run(
                            ctx -> {
                                assertThat(ctx).hasFailed();
                                assertThat(rootMessage(ctx.getStartupFailure()))
                                        .contains("DOCCHAT_STORAGE_ENCRYPTION_KEY")
                                        .contains("32");
                            });
        }
    }
}
