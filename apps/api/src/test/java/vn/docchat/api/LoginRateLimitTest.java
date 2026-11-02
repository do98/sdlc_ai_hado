package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/** Giới hạn tần suất đăng nhập theo IP (đề xuất của T04) — hạn mức thấp để kiểm thử được. */
@SpringBootTest(properties = "docchat.auth.login-rate-limit-per-minute=3")
@AutoConfigureMockMvc
class LoginRateLimitTest extends PostgresTestBase {

    private MvcResult attempt(String ip, String password) throws Exception {
        return mvc.perform(
                        post("/api/auth/login")
                                .with(
                                        r -> {
                                            r.setRemoteAddr(ip);
                                            return r;
                                        })
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"username\":\"minh\",\"password\":\""
                                                + password
                                                + "\"}"))
                .andReturn();
    }

    @Test
    void T04_vuot_han_muc_theo_ip_thi_429_co_retry_after() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        assertThat(attempt("10.0.0.1", "sai-1").getResponse().getStatus()).isEqualTo(401);
        assertThat(attempt("10.0.0.1", "sai-2").getResponse().getStatus()).isEqualTo(401);
        assertThat(attempt("10.0.0.1", PASSWORD).getResponse().getStatus()).isEqualTo(204);

        MvcResult limited = attempt("10.0.0.1", PASSWORD);
        assertThat(limited.getResponse().getStatus()).isEqualTo(429);
        assertThat(limited.getResponse().getContentAsString()).contains("RATE_LIMITED");
        assertThat(limited.getResponse().getHeader(HttpHeaders.RETRY_AFTER)).isNotNull();

        // IP khác không bị ảnh hưởng
        assertThat(attempt("10.0.0.2", PASSWORD).getResponse().getStatus()).isEqualTo(204);

        // sang phút kế tiếp thì dùng lại được
        clock.advance(java.time.Duration.ofSeconds(61));
        assertThat(attempt("10.0.0.1", PASSWORD).getResponse().getStatus()).isEqualTo(204);
    }
}
