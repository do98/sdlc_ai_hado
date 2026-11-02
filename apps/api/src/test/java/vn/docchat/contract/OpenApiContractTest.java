package vn.docchat.contract;

import static com.atlassian.oai.validator.mockmvc.OpenApiValidationMatchers.openApi;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlassian.oai.validator.OpenApiInteractionValidator;
import com.atlassian.oai.validator.report.LevelResolver;
import com.atlassian.oai.validator.report.ValidationReport;
import jakarta.servlet.http.Cookie;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/**
 * T05.e — phản hồi thật của backend phải khớp {@code api/openapi.yaml}; đỏ khi lệch hợp đồng. Chỉ
 * các thao tác {@code x-implemented: true}; test cuối bảo đảm không thao tác "đã hiện thực" nào
 * thiếu kịch bản.
 */
class OpenApiContractTest extends PostgresTestBase {

    /** operationId đã có kịch bản kiểm thử bên dưới. */
    private static final Set<String> COVERED =
            Set.of(
                    "login",
                    "logout",
                    "getMe",
                    "getHealth",
                    "getReady",
                    "uploadDocument",
                    "listDocuments");

    private static final String SPEC = OpenApiSpec.FILE.toUri().toString();

    /**
     * Kiểm cả yêu cầu lẫn phản hồi; bỏ qua việc thiếu cookie phiên ở yêu cầu (đó chính là ca 401).
     */
    private static final OpenApiInteractionValidator VALIDATOR =
            OpenApiInteractionValidator.createFor(SPEC)
                    .withLevelResolver(
                            LevelResolver.create()
                                    .withLevel(
                                            "validation.request.security.missing",
                                            ValidationReport.Level.IGNORE)
                                    .build())
                    .build();

    /** Chỉ kiểm phản hồi (dùng cho ca gửi yêu cầu sai có chủ đích). */
    private static final OpenApiInteractionValidator RESPONSE_ONLY =
            OpenApiInteractionValidator.createFor(SPEC)
                    .withLevelResolver(
                            LevelResolver.create()
                                    .withLevel("validation.request", ValidationReport.Level.IGNORE)
                                    .build())
                    .build();

    @BeforeEach
    void seed() {
        createUser("minh", PASSWORD, Role.MEMBER);
    }

    private String creds(String user, String pass) {
        return "{\"username\":\"" + user + "\",\"password\":\"" + pass + "\"}";
    }

    private Cookie loginAndGetCookie() throws Exception {
        return mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(creds("minh", PASSWORD)))
                .andExpect(status().isNoContent())
                .andExpect(openApi().isValid(VALIDATOR))
                .andReturn()
                .getResponse()
                .getCookie("DOCCHAT_SESSION");
    }

    @Test
    void T05_login_204_khop_hop_dong_ke_ca_set_cookie() throws Exception {
        assertThat(loginAndGetCookie()).isNotNull();
    }

    @Test
    void T05_login_401_sai_mat_khau_khop_schema_loi() throws Exception {
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(creds("minh", "sai")))
                .andExpect(status().isUnauthorized())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_login_423_khoa_tam_khop_schema_va_retry_after() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(
                    post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(creds("minh", "sai")));
        }
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(creds("minh", PASSWORD)))
                .andExpect(status().isLocked())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_login_400_yeu_cau_sai_khop_schema_loi() throws Exception {
        mvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(creds("", "")))
                .andExpect(status().isBadRequest())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
    }

    @Test
    void T05_login_403_csrf_khop_schema_loi() throws Exception {
        mvc.perform(
                        post("/api/auth/login")
                                .header("Origin", "https://evil.example")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(creds("minh", PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_logout_204_khop_hop_dong() throws Exception {
        Cookie session = loginAndGetCookie();
        mvc.perform(post("/api/auth/logout").cookie(session))
                .andExpect(status().isNoContent())
                .andExpect(openApi().isValid(VALIDATOR));
        mvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_me_200_va_401_khop_hop_dong() throws Exception {
        Cookie session = loginAndGetCookie();
        mvc.perform(get("/api/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(openApi().isValid(VALIDATOR));
        mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_health_va_ready_khop_hop_dong() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(openApi().isValid(VALIDATOR));
        mvc.perform(get("/api/ready"))
                .andExpect(status().isOk())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder uploadReq(
            String name, byte[] content, Cookie session) {
        var b =
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(
                                "/api/documents")
                        .file(
                                new org.springframework.mock.web.MockMultipartFile(
                                        "file", name, "application/pdf", content));
        return session == null ? b : b.cookie(session);
    }

    @Test
    void T07_uploadDocument_202_415_413_401_409_khop_hop_dong() throws Exception {
        Cookie session = loginAndGetCookie();
        byte[] pdf = "%PDF-1.4\nxxxx".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
        // Phần yêu cầu multipart không đi qua trình kiểm yêu cầu của validator; chỉ kiểm phản hồi.
        mvc.perform(uploadReq("a.pdf", pdf, session))
                .andExpect(status().isAccepted())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
        mvc.perform(uploadReq("a.docx", new byte[] {1, 2, 3}, session))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
        mvc.perform(uploadReq("a.pdf", pdf, null))
                .andExpect(status().isUnauthorized())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
        mvc.perform(uploadReq("big.pdf", new byte[10 * 1024 * 1024 + 1], session))
                .andExpect(status().isUnsupportedMediaType()); // không phải PDF trước khi xét dung
        // lượng
        byte[] big = new byte[10 * 1024 * 1024 + 1];
        System.arraycopy(pdf, 0, big, 0, pdf.length);
        mvc.perform(uploadReq("big.pdf", big, session))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
        jdbc.update(
                "INSERT INTO documents (id,name,size_bytes,status,storage_key,uploaded_by) "
                        + "SELECT gen_random_uuid(),'s'||g,1,'READY','k'||g,(SELECT id FROM users LIMIT 1) "
                        + "FROM generate_series(1,19) g");
        mvc.perform(uploadReq("c.pdf", pdf, session))
                .andExpect(status().isConflict())
                .andExpect(openApi().isValid(RESPONSE_ONLY));
    }

    @Test
    void T09_listDocuments_200_va_401_khop_hop_dong() throws Exception {
        Cookie session = loginAndGetCookie();
        mvc.perform(get("/api/documents").cookie(session))
                .andExpect(status().isOk())
                .andExpect(openApi().isValid(VALIDATOR));
        jdbc.update(
                "INSERT INTO documents (id,name,size_bytes,page_count,status,error_code,warning,storage_key,uploaded_by) "
                        + "SELECT gen_random_uuid(),'a.pdf',5,3,'READY',NULL,CAST('{\"code\":\"UNREADABLE_PAGES\",\"pages\":[2]}' AS jsonb),'k',(SELECT id FROM users LIMIT 1) "
                        + "UNION ALL SELECT gen_random_uuid(),'b.pdf',5,NULL,'ERROR','CORRUPT',NULL,'k2',(SELECT id FROM users LIMIT 1)");
        mvc.perform(get("/api/documents").cookie(session))
                .andExpect(status().isOk())
                .andExpect(openApi().isValid(VALIDATOR));
        mvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(openApi().isValid(VALIDATOR));
    }

    @Test
    void T05_moi_thao_tac_da_hien_thuc_deu_co_kich_ban_hop_dong() {
        assertThat(new OpenApiSpec().implementedOperations())
                .as(
                        "thêm x-implemented: true cho thao tác mới thì phải thêm kịch bản vào OpenApiContractTest")
                .containsExactlyInAnyOrderElementsOf(COVERED);
    }
}
