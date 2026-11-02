package vn.docchat.config;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import java.util.Base64;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Cấu hình lưu tệp ({@code docchat.storage.*}). <b>Bắt buộc</b>, không có mặc định: thiếu hoặc sai
 * thì ứng dụng không khởi động và thông báo nêu rõ khóa cấu hình ({@code DOCCHAT_STORAGE_DIR},
 * {@code DOCCHAT_STORAGE_ENCRYPTION_KEY}).
 */
@Validated
@ConfigurationProperties("docchat.storage")
public record StorageProperties(
        @NotBlank(message = "docchat.storage.dir (biến DOCCHAT_STORAGE_DIR) là bắt buộc")
                String dir,
        @NotBlank(
                        message =
                                "docchat.storage.encryption-key (biến DOCCHAT_STORAGE_ENCRYPTION_KEY) là bắt buộc")
                String encryptionKey) {

    @AssertTrue(
            message =
                    "docchat.storage.encryption-key (biến DOCCHAT_STORAGE_ENCRYPTION_KEY) phải là base64 của đúng 32"
                            + " byte")
    public boolean isEncryptionKeyValid() {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            return true; // đã báo bởi @NotBlank
        }
        try {
            return Base64.getDecoder().decode(encryptionKey.strip()).length == 32;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public byte[] keyBytes() {
        return Base64.getDecoder().decode(encryptionKey.strip());
    }
}
