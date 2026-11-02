package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/**
 * Tiêu chí hoàn thành của T04 ở tầng API: đăng nhập, phiên 8 giờ, khóa tạm, CSRF, cookie, mặc định
 * từ chối.
 */
class AuthApiTest extends PostgresTestBase {

    private static final String COOKIE = "DOCCHAT_SESSION";

    private MockHttpServletRequestBuilder loginRequest(String username, String password) {
        return post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}");
    }

    private MvcResult login(String username, String password) throws Exception {
        return mvc.perform(loginRequest(username, password)).andReturn();
    }

    private Cookie loginOk(String username, String password) throws Exception {
        MvcResult r = login(username, password);
        assertThat(r.getResponse().getStatus()).isEqualTo(204);
        return r.getResponse().getCookie(COOKIE);
    }

    // ---- đăng nhập ----

    @Test
    void T04_login_dung_thi_204_va_cookie_dung_co() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        MvcResult r = login("minh", PASSWORD);

        assertThat(r.getResponse().getStatus()).isEqualTo(204);
        String setCookie = r.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie)
                .startsWith(COOKIE + "=")
                .contains("HttpOnly")
                .contains("Secure")
                .contains("SameSite=Lax")
                .contains("Path=/")
                .contains("Max-Age=" + Duration.ofHours(8).toSeconds());
        assertThat(r.getResponse().getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
    }

    @Test
    void T04_ma_phien_du_dai_va_duoc_luu_dang_bam() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        String token = loginOk("minh", PASSWORD).getValue();

        assertThat(token.length())
                .isGreaterThanOrEqualTo(43); // 256 bit base64url ≥ 128 bit yêu cầu
        Integer rawCount =
                jdbc.queryForObject(
                        "SELECT count(*) FROM auth_sessions WHERE token_hash = ?",
                        Integer.class,
                        token);
        assertThat(rawCount).isZero(); // CSDL không chứa mã thô
        String sha =
                HexFormat.of()
                        .formatHex(
                                MessageDigest.getInstance("SHA-256")
                                        .digest(token.getBytes(StandardCharsets.UTF_8)));
        Integer hashed =
                jdbc.queryForObject(
                        "SELECT count(*) FROM auth_sessions WHERE token_hash = ?",
                        Integer.class,
                        sha);
        assertThat(hashed).isEqualTo(1);
    }

    @Test
    void T04_sai_mat_khau_va_sai_ten_cho_phan_hoi_giong_nhau() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        MvcResult wrongPassword = login("minh", "sai-mat-khau-nao-do");
        MvcResult unknownUser = login("khong-ton-tai", PASSWORD);

        assertThat(wrongPassword.getResponse().getStatus()).isEqualTo(401);
        assertThat(unknownUser.getResponse().getStatus()).isEqualTo(401);
        assertThat(strip(wrongPassword)).isEqualTo(strip(unknownUser));
        assertThat(strip(wrongPassword)).contains("INVALID_CREDENTIALS").doesNotContain("minh");
        assertThat(wrongPassword.getResponse().getCookie(COOKIE)).isNull();
    }

    private static String strip(MvcResult r) throws Exception {
        return r.getResponse().getContentAsString().replaceAll("\"traceId\":\"[^\"]*\"", "");
    }

    @Test
    void T04_ten_dang_nhap_khong_phan_biet_hoa_thuong() throws Exception {
        createUser("Minh", PASSWORD, Role.MEMBER);
        assertThat(login("  MINH  ", PASSWORD).getResponse().getStatus()).isEqualTo(204);
    }

    @Test
    void T04_yeu_cau_sai_dinh_dang_tra_400() throws Exception {
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"username\":\"a\",\"password\":\""
                                                + "x".repeat(2000)
                                                + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---- /me, đăng xuất ----

    @Test
    void T04_me_can_phien_va_tra_thong_tin_khong_lo_bam() throws Exception {
        createUser("minh", PASSWORD, Role.ADMIN);
        Cookie session = loginOk("minh", PASSWORD);

        mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        MvcResult me =
                mvc.perform(get("/api/me").cookie(session))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.username").value("minh"))
                        .andExpect(jsonPath("$.role").value("ADMIN"))
                        .andExpect(jsonPath("$.id").isNotEmpty())
                        .andReturn();
        assertThat(me.getResponse().getContentAsString())
                .doesNotContain("password")
                .doesNotContain("argon2");
    }

    @Test
    void T04_dang_xuat_huy_phien_phia_may_chu() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        Cookie session = loginOk("minh", PASSWORD);

        MvcResult out = mvc.perform(post("/api/auth/logout").cookie(session)).andReturn();
        assertThat(out.getResponse().getStatus()).isEqualTo(204);
        assertThat(out.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");

        // dùng lại chính cookie cũ (kẻ đánh cắp cookie) cũng không vào được
        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isUnauthorized());
        Integer left = jdbc.queryForObject("SELECT count(*) FROM auth_sessions", Integer.class);
        assertThat(left).isZero();
    }

    @Test
    void T04_dang_xuat_khi_chua_dang_nhap_van_204() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isNoContent());
    }

    // ---- hết hạn phiên ----

    @Test
    void T04_phien_het_han_tuyet_doi_sau_8_gio() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        Cookie session = loginOk("minh", PASSWORD);

        clock.set(T0.plus(Duration.ofHours(8)).minusSeconds(1));
        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isOk());

        clock.set(T0.plus(Duration.ofHours(8)));
        mvc.perform(get("/api/me").cookie(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        // mọi API khác cũng 401
        mvc.perform(get("/api/documents").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void T04_hoat_dong_giua_chung_khong_keo_dai_phien() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        Cookie session = loginOk("minh", PASSWORD);
        for (int h = 1; h <= 7; h++) {
            clock.set(T0.plus(Duration.ofHours(h)));
            mvc.perform(get("/api/me").cookie(session)).andExpect(status().isOk());
        }
        clock.set(T0.plus(Duration.ofHours(8)).plusSeconds(1));
        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    // ---- khóa tạm ----

    @Test
    void T04_sai_5_lan_thi_khoa_ke_ca_khi_nhap_dung_va_mo_khoa_sau_15_phut() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        for (int i = 1; i <= 5; i++) {
            assertThat(login("minh", "sai-lan-" + i).getResponse().getStatus())
                    .as("lần sai thứ %d", i)
                    .isEqualTo(401);
        }
        // lần thứ 6 — dù đúng mật khẩu — vẫn bị khóa, và không cấp cookie
        MvcResult locked = login("minh", PASSWORD);
        assertThat(locked.getResponse().getStatus()).isEqualTo(423);
        assertThat(locked.getResponse().getContentAsString()).contains("ACCOUNT_LOCKED");
        assertThat(locked.getResponse().getCookie(COOKIE)).isNull();
        assertThat(locked.getResponse().getHeader(HttpHeaders.RETRY_AFTER)).isNotNull();

        clock.set(T0.plus(Duration.ofMinutes(15)).minusSeconds(1));
        assertThat(login("minh", PASSWORD).getResponse().getStatus()).isEqualTo(423);

        clock.set(T0.plus(Duration.ofMinutes(15)).plusSeconds(1));
        assertThat(login("minh", PASSWORD).getResponse().getStatus()).isEqualTo(204);
    }

    @Test
    void T04_dang_nhap_dung_dat_lai_bo_dem_sai() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        for (int i = 0; i < 4; i++) {
            login("minh", "sai");
        }
        assertThat(login("minh", PASSWORD).getResponse().getStatus()).isEqualTo(204);
        // bộ đếm đã về 0: lại cần đủ 5 lần sai mới khóa
        for (int i = 0; i < 4; i++) {
            assertThat(login("minh", "sai").getResponse().getStatus()).isEqualTo(401);
        }
        assertThat(login("minh", PASSWORD).getResponse().getStatus()).isEqualTo(204);
        Integer failed =
                jdbc.queryForObject(
                        "SELECT failed_logins FROM users WHERE username='minh'", Integer.class);
        assertThat(failed).isZero();
    }

    @Test
    void T04_ten_khong_ton_tai_cung_bi_khoa_de_khong_lo_tai_khoan_nao_co_that() throws Exception {
        for (int i = 1; i <= 5; i++) {
            assertThat(login("ma", "sai-" + i).getResponse().getStatus()).isEqualTo(401);
        }
        MvcResult sixth = login("ma", PASSWORD);
        assertThat(sixth.getResponse().getStatus()).isEqualTo(423);
    }

    @Test
    void T04_khoa_tai_khoan_nay_khong_anh_huong_tai_khoan_khac() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        createUser("lan", PASSWORD, Role.MEMBER);
        for (int i = 0; i < 5; i++) {
            login("minh", "sai");
        }
        assertThat(login("lan", PASSWORD).getResponse().getStatus()).isEqualTo(204);
    }

    // ---- CSRF ----

    @Test
    void T04_post_tu_origin_la_bi_tu_choi() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        MvcResult r =
                mvc.perform(loginRequest("minh", PASSWORD).header("Origin", "https://evil.example"))
                        .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(403);
        assertThat(r.getResponse().getContentAsString()).contains("CSRF_REJECTED");
        assertThat(r.getResponse().getCookie(COOKIE)).isNull();
    }

    @Test
    void T04_post_cung_origin_duoc_chap_nhan() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        MvcResult r =
                mvc.perform(loginRequest("minh", PASSWORD).header("Origin", "http://localhost"))
                        .andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(204);
    }

    @Test
    void T04_origin_null_va_sec_fetch_site_cross_site_bi_tu_choi() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        assertThat(
                        mvc.perform(loginRequest("minh", PASSWORD).header("Origin", "null"))
                                .andReturn()
                                .getResponse()
                                .getStatus())
                .isEqualTo(403);
        assertThat(
                        mvc.perform(
                                        loginRequest("minh", PASSWORD)
                                                .header("Sec-Fetch-Site", "cross-site"))
                                .andReturn()
                                .getResponse()
                                .getStatus())
                .isEqualTo(403);
        assertThat(
                        mvc.perform(
                                        loginRequest("minh", PASSWORD)
                                                .header("Sec-Fetch-Site", "same-origin"))
                                .andReturn()
                                .getResponse()
                                .getStatus())
                .isEqualTo(204);
    }

    @Test
    void T04_logout_tu_origin_la_khong_huy_duoc_phien() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        Cookie session = loginOk("minh", PASSWORD);
        mvc.perform(
                        post("/api/auth/logout")
                                .cookie(session)
                                .header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isOk());
    }

    // ---- mặc định từ chối ----

    @Test
    void T04_moi_route_api_khac_deu_can_phien_ke_ca_route_chua_ton_tai() throws Exception {
        for (String path :
                new String[] {"/api/documents", "/api/conversations/1/messages", "/api/khong-co"}) {
            mvc.perform(get(path))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        }
        mvc.perform(post("/api/documents")).andExpect(status().isUnauthorized());
    }

    @Test
    void T04_co_phien_nhung_route_khong_ton_tai_thi_404_json() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        Cookie session = loginOk("minh", PASSWORD);
        mvc.perform(get("/api/khong-co").cookie(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void T04_cookie_gia_hoac_rac_khong_gay_loi_500() throws Exception {
        for (String junk : new String[] {"abc", "x".repeat(500), "%00%00", ""}) {
            mvc.perform(get("/api/me").cookie(new Cookie(COOKIE, junk)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void T04_loi_co_trace_id_va_khong_lo_chi_tiet() throws Exception {
        MvcResult r = mvc.perform(get("/api/me").header("X-Request-Id", "abc-123")).andReturn();
        assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo("abc-123");
        assertThat(r.getResponse().getContentAsString()).contains("\"traceId\":\"abc-123\"");
        // header độc hại không được phản chiếu
        MvcResult bad =
                mvc.perform(get("/api/me").header("X-Request-Id", "<script>x</script>"))
                        .andReturn();
        assertThat(bad.getResponse().getHeader("X-Request-Id")).doesNotContain("<");
    }

    @Test
    void T04_health_va_login_khong_can_phien() throws Exception {
        // /api/health chưa có controller (T03) nhưng phải KHÔNG bị bộ lọc phiên chặn bằng 401
        MvcResult r = mvc.perform(get("/api/health")).andReturn();
        assertThat(r.getResponse().getStatus()).isNotEqualTo(401);
    }
}
