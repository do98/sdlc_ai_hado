package vn.docchat.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/** T09 — GET /api/documents (IF-02). */
class DocumentListApiTest extends PostgresTestBase {

    private Cookie session;
    private UUID userId;

    @BeforeEach
    void login() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        userId = jdbc.queryForObject("SELECT id FROM users WHERE username='minh'", UUID.class);
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
    }

    private void insert(
            String name,
            String status,
            String errorCode,
            String warning,
            Integer pages,
            String uploadedAt) {
        jdbc.update(
                "INSERT INTO documents (id,name,size_bytes,page_count,status,error_code,warning,storage_key,uploaded_by,uploaded_at) "
                        + "VALUES (?,?,?,?,?,?,CAST(? AS jsonb),?,?,CAST(? AS timestamptz))",
                UUID.randomUUID(),
                name,
                1234,
                pages,
                status,
                errorCode,
                warning,
                "documents/x/" + name,
                userId,
                uploadedAt);
    }

    @Test
    void T09_can_phien() throws Exception {
        mvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void T09_workspace_trong_tra_items_rong_count_0_limit_20() throws Exception {
        mvc.perform(get("/api/documents").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.count").value(0))
                .andExpect(jsonPath("$.limit").value(20));
    }

    @Test
    void T09_moi_nhat_truoc_khong_gom_DELETED_va_du_cac_truong() throws Exception {
        insert("cu.pdf", "READY", null, null, 5, "2026-01-01T00:00:00Z");
        insert("moi.pdf", "PROCESSING", null, null, null, "2026-01-03T00:00:00Z");
        insert(
                "nua-scan.pdf",
                "READY",
                null,
                "{\"code\":\"UNREADABLE_PAGES\",\"pages\":[3,7]}",
                10,
                "2026-01-02T00:00:00Z");
        insert("loi.pdf", "ERROR", "PASSWORD_PROTECTED", null, null, "2026-01-01T12:00:00Z");
        insert("da-xoa.pdf", "DELETED", null, null, 1, "2026-01-04T00:00:00Z");

        mvc.perform(get("/api/documents").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(4))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].name").value("moi.pdf"))
                .andExpect(jsonPath("$.items[0].status").value("PROCESSING"))
                .andExpect(jsonPath("$.items[0].pageCount").value((Object) null))
                .andExpect(jsonPath("$.items[1].name").value("nua-scan.pdf"))
                .andExpect(jsonPath("$.items[1].warning.code").value("UNREADABLE_PAGES"))
                .andExpect(jsonPath("$.items[1].warning.pages[1]").value(7))
                .andExpect(jsonPath("$.items[1].pageCount").value(10))
                .andExpect(jsonPath("$.items[2].name").value("loi.pdf"))
                .andExpect(jsonPath("$.items[2].errorCode").value("PASSWORD_PROTECTED"))
                .andExpect(jsonPath("$.items[3].name").value("cu.pdf"))
                .andExpect(jsonPath("$.items[3].warning").value((Object) null))
                .andExpect(jsonPath("$.items[3].sizeBytes").value(1234))
                .andExpect(jsonPath("$.items[3].uploadedBy").value(userId.toString()))
                .andExpect(jsonPath("$.items[3].uploadedAt").exists());
    }

    @Test
    void T09_khong_luu_dem_va_nhat_quan_voi_csdl_sau_khi_tai_len() throws Exception {
        mvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .multipart("/api/documents")
                                .file(
                                        new org.springframework.mock.web.MockMultipartFile(
                                                "file",
                                                "vua-tai.pdf",
                                                "application/pdf",
                                                DocumentUploadApiTest.pdf(300)))
                                .cookie(session))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/documents").cookie(session))
                .andExpect(status().isOk())
                .andExpect(
                        org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                                .string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.items[0].name").value("vua-tai.pdf"))
                .andExpect(jsonPath("$.items[0].status").value("PROCESSING"));
    }
}
