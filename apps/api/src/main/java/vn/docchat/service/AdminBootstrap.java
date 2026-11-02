package vn.docchat.service;

import java.time.Clock;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.docchat.common.Uuids;
import vn.docchat.domain.Role;
import vn.docchat.repository.UserRepository;

/**
 * Tạo tài khoản Admin đầu tiên khi khởi động từ biến môi trường {@code DOCCHAT_ADMIN_USERNAME} và
 * {@code DOCCHAT_ADMIN_PASSWORD}. Chạy lại không tạo trùng và <b>không đổi mật khẩu</b> của tài
 * khoản đã có (đặt lại mật khẩu là thao tác riêng, ghi trong runbook). Không bao giờ ghi mật khẩu
 * vào log.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthProperties props;
    private final Clock clock;
    private final String username;
    private final String password;

    public AdminBootstrap(
            UserRepository users,
            PasswordEncoder encoder,
            AuthProperties props,
            Clock clock,
            @Value("${docchat.admin.username:}") String username,
            @Value("${docchat.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.props = props;
        this.clock = clock;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        createAdminIfConfigured();
    }

    /**
     * @return true nếu vừa tạo mới tài khoản.
     */
    public boolean createAdminIfConfigured() {
        boolean hasUser = !username.isBlank();
        boolean hasPass = !password.isEmpty();
        if (!hasUser && !hasPass) {
            return false;
        }
        if (hasUser != hasPass) {
            throw new IllegalStateException(
                    "Cần đặt cả DOCCHAT_ADMIN_USERNAME và DOCCHAT_ADMIN_PASSWORD (hoặc không đặt cái nào).");
        }
        if (password.length() < props.minPasswordLength()) {
            throw new IllegalStateException(
                    "DOCCHAT_ADMIN_PASSWORD phải có ít nhất "
                            + props.minPasswordLength()
                            + " ký tự.");
        }
        String name = username.strip();
        boolean created =
                users.insertIfAbsent(
                        Uuids.v7(), name, encoder.encode(password), Role.ADMIN, Instant.now(clock));
        log.info(
                created
                        ? "Đã tạo tài khoản Admin ban đầu."
                        : "Tài khoản Admin đã tồn tại, giữ nguyên.");
        return created;
    }
}
