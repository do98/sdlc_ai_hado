package vn.docchat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.docchat.domain.Role;
import vn.docchat.domain.User;
import vn.docchat.support.PostgresTestBase;

class AdminBootstrapTest extends PostgresTestBase {

    @Autowired AuthProperties props;

    private AdminBootstrap bootstrap(String user, String pass) {
        return new AdminBootstrap(users, encoder, props, springClock, user, pass);
    }

    @Test
    void T04_tao_admin_tu_bien_moi_truong_va_chay_lai_khong_tao_trung() {
        assertThat(bootstrap("admin", "mat-khau-dai-hon-12").createAdminIfConfigured()).isTrue();
        assertThat(bootstrap("ADMIN", "mat-khau-khac-hoan-toan").createAdminIfConfigured())
                .isFalse();

        Integer n = jdbc.queryForObject("SELECT count(*) FROM users", Integer.class);
        assertThat(n).isEqualTo(1);
        Optional<User> admin = users.findByUsername("admin");
        assertThat(admin).isPresent();
        assertThat(admin.get().role()).isEqualTo(Role.ADMIN);
        // chạy lại KHÔNG đổi mật khẩu của tài khoản đã có
        assertThat(encoder.matches("mat-khau-dai-hon-12", admin.get().passwordHash())).isTrue();
        assertThat(admin.get().passwordHash()).startsWith("$argon2id$");
    }

    @Test
    void T04_khong_dat_bien_thi_khong_lam_gi() {
        assertThat(bootstrap("", "").createAdminIfConfigured()).isFalse();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users", Integer.class)).isZero();
    }

    @Test
    void T04_chi_dat_mot_trong_hai_bien_hoac_mat_khau_yeu_thi_khoi_dong_that_bai() {
        assertThatThrownBy(() -> bootstrap("admin", "").createAdminIfConfigured())
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> bootstrap("", "mat-khau-dai-hon-12").createAdminIfConfigured())
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> bootstrap("admin", "ngan").createAdminIfConfigured())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("12");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users", Integer.class)).isZero();
    }
}
