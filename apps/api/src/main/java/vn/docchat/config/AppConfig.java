package vn.docchat.config;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.docchat.repository.FileStore;
import vn.docchat.repository.LocalEncryptedFileStore;
import vn.docchat.service.AuthProperties;
import vn.docchat.service.EventsProperties;
import vn.docchat.service.LimitsProperties;

@Configuration
@EnableConfigurationProperties({
    AuthProperties.class,
    StorageProperties.class,
    LimitsProperties.class,
    EventsProperties.class
})
@EnableScheduling
public class AppConfig {

    /** Đồng hồ hệ thống; test thay bằng đồng hồ giả để kiểm hạn phiên và khóa tạm. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    /** Argon2id với tham số mặc định khuyến nghị của Spring Security 5.8+. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    public FileStore fileStore(StorageProperties props) throws IOException {
        return new LocalEncryptedFileStore(Path.of(props.dir()), props.keyBytes());
    }
}
