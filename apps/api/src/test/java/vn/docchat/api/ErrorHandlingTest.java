package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import vn.docchat.domain.ErrorCode;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/**
 * T03.d — JSON lỗi {@code {code, message, traceId}} + HTTP status đúng cho từng mã; traceId có
 * trong phản hồi và log.
 */
class ErrorHandlingTest extends PostgresTestBase {

    private Cookie session;
    private ListAppender<ILoggingEvent> logs;
    private Logger handlerLogger;

    @BeforeEach
    void login() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        session =
                mvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"username\":\"minh\",\"password\":\""
                                                        + PASSWORD
                                                        + "\"}"))
                        .andReturn()
                        .getResponse()
                        .getCookie("DOCCHAT_SESSION");
        handlerLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        logs = new ListAppender<>();
        logs.start();
        handlerLogger.addAppender(logs);
        handlerLogger.setLevel(Level.ERROR);
    }

    @AfterEach
    void detach() {
        handlerLogger.detachAppender(logs);
    }

    private MvcResult call(MockHttpServletRequestBuilder req) throws Exception {
        return mvc.perform(req.cookie(session)).andReturn();
    }

    private static String json(MvcResult r, String field) throws Exception {
        String body = r.getResponse().getContentAsString();
        java.util.regex.Matcher m =
                java.util.regex.Pattern.compile("\"" + field + "\":(null|\"([^\"]*)\")")
                        .matcher(body);
        return m.find() ? m.group(2) : null;
    }

    @Test
    void T03_moi_ma_loi_cho_dung_status_code_va_trace_id() throws Exception {
        for (ErrorCode code : ErrorCode.values()) {
            MvcResult r =
                    call(
                            get("/api/_probe/error/" + code.name())
                                    .header("X-Request-Id", "trace-" + code.name()));
            assertThat(r.getResponse().getStatus()).as(code.name()).isEqualTo(code.httpStatus());
            assertThat(json(r, "code")).isEqualTo(code.name());
            assertThat(json(r, "message")).isNotBlank();
            assertThat(json(r, "traceId")).isEqualTo("trace-" + code.name());
            assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo("trace-" + code.name());
            assertThat(r.getResponse().getContentType()).startsWith("application/json");
            assertThat(r.getResponse().getHeader("Cache-Control")).isEqualTo("no-store");
        }
    }

    @Test
    void T03_trace_id_duoc_sinh_khi_thieu_va_khong_phan_chieu_gia_tri_doc_hai() throws Exception {
        MvcResult r = call(get("/api/_probe/error/NOT_FOUND"));
        String generated = r.getResponse().getHeader("X-Request-Id");
        assertThat(generated).matches("[0-9a-f-]{36}");
        assertThat(json(r, "traceId")).isEqualTo(generated);

        MvcResult bad =
                call(
                        get("/api/_probe/error/NOT_FOUND")
                                .header("X-Request-Id", "<script>alert(1)</script>"));
        assertThat(bad.getResponse().getHeader("X-Request-Id")).doesNotContain("<").hasSize(36);
        MvcResult tooLong =
                call(get("/api/_probe/error/NOT_FOUND").header("X-Request-Id", "a".repeat(200)));
        assertThat(tooLong.getResponse().getHeader("X-Request-Id")).hasSize(36);
    }

    @Test
    void T03_retry_after_duoc_gui_khi_co() throws Exception {
        MvcResult r = call(get("/api/_probe/error/RATE_LIMITED?retryAfter=7"));
        assertThat(r.getResponse().getHeader("Retry-After")).isEqualTo("7");
        assertThat(
                        call(get("/api/_probe/error/RATE_LIMITED"))
                                .getResponse()
                                .getHeader("Retry-After"))
                .isNull();
    }

    @Test
    void T03_loi_khong_luong_truoc_khong_lo_chi_tiet_noi_bo_va_ghi_log_kem_trace_id()
            throws Exception {
        MvcResult r = call(get("/api/_probe/boom").header("X-Request-Id", "trace-boom"));
        assertThat(r.getResponse().getStatus()).isEqualTo(500);
        String body = r.getResponse().getContentAsString();
        assertThat(json(r, "code")).isEqualTo("INTERNAL");
        assertThat(body)
                .doesNotContain("passwd")
                .doesNotContain("password")
                .doesNotContain("hunter2")
                .doesNotContain("jdbc")
                .doesNotContain("Exception")
                .doesNotContain("at vn.docchat");

        // chi tiết chỉ có trong log, cùng traceId (MDC)
        assertThat(logs.list).hasSize(1);
        ILoggingEvent event = logs.list.get(0);
        assertThat(event.getFormattedMessage()).contains("trace-boom");
        assertThat(event.getMDCPropertyMap()).containsEntry("traceId", "trace-boom");
        assertThat(event.getThrowableProxy().getMessage()).contains("/etc/passwd");
    }

    @Test
    void T03_yeu_cau_sai_dinh_dang_tra_400() throws Exception {
        assertThat(call(get("/api/_probe/typed?n=abc")).getResponse().getStatus())
                .isEqualTo(400); // sai kiểu
        assertThat(call(get("/api/_probe/typed")).getResponse().getStatus())
                .isEqualTo(400); // thiếu tham số
        MvcResult noName =
                call(
                        post("/api/_probe/body")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"  \"}"));
        assertThat(noName.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(noName, "code")).isEqualTo("INVALID_REQUEST");
        MvcResult broken =
                call(
                        post("/api/_probe/body")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{khong-phai-json"));
        assertThat(broken.getResponse().getStatus()).isEqualTo(400);
        assertThat(broken.getResponse().getContentAsString())
                .doesNotContain("JsonParseException")
                .doesNotContain("Unexpected");
    }

    @Test
    void T03_405_co_header_allow_va_415_khi_sai_kieu_noi_dung() throws Exception {
        MvcResult notAllowed = call(post("/api/_probe/boom"));
        assertThat(notAllowed.getResponse().getStatus()).isEqualTo(405);
        assertThat(json(notAllowed, "code")).isEqualTo("METHOD_NOT_ALLOWED");
        assertThat(notAllowed.getResponse().getHeader("Allow")).contains("GET");

        MvcResult media =
                call(post("/api/_probe/body").contentType(MediaType.TEXT_PLAIN).content("x"));
        assertThat(media.getResponse().getStatus()).isEqualTo(415);
        assertThat(json(media, "code")).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
    }

    @Test
    void T03_tep_vuot_gioi_han_http_tra_413_file_too_large() throws Exception {
        MvcResult r = call(post("/api/_probe/toolarge"));
        assertThat(r.getResponse().getStatus()).isEqualTo(413);
        assertThat(json(r, "code")).isEqualTo("FILE_TOO_LARGE");
    }

    @Test
    void T03_duong_dan_khong_ton_tai_tra_404_json() throws Exception {
        MvcResult r = call(get("/api/khong-co-route-nay"));
        assertThat(r.getResponse().getStatus()).isEqualTo(404);
        assertThat(json(r, "code")).isEqualTo("NOT_FOUND");
    }
}
