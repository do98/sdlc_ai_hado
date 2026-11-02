package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import vn.docchat.domain.Document;
import vn.docchat.domain.Role;
import vn.docchat.repository.DocumentRepository;
import vn.docchat.service.DocumentProcessingQueue;
import vn.docchat.support.PostgresTestBase;

/**
 * T07 — khi một bước thất bại, không để lại bản ghi, tệp mồ côi hay việc xử lý; lỗi ở hàng đợi
 * không hỏng việc tải lên.
 */
class DocumentUploadFailureTest extends PostgresTestBase {

    @SpyBean DocumentRepository documents;
    @MockBean DocumentProcessingQueue queue;

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

    private MvcResult upload() throws Exception {
        return mvc.perform(
                        multipart("/api/documents")
                                .file(
                                        new MockMultipartFile(
                                                "file",
                                                "a.pdf",
                                                "application/pdf",
                                                DocumentUploadApiTest.pdf(500)))
                                .cookie(session))
                .andReturn();
    }

    private int storedFiles() throws IOException {
        Path dir = STORAGE_DIR.resolve("documents").resolve(userId.toString());
        if (!Files.exists(dir)) {
            return 0;
        }
        try (Stream<Path> s = Files.list(dir)) {
            return (int) s.count();
        }
    }

    @Test
    void T07_loi_ghi_csdl_thi_xoa_tep_da_luu_va_tra_500_khong_lo_chi_tiet() throws Exception {
        doThrow(new IllegalStateException("kết nối CSDL jdbc:postgresql://secret password=abc"))
                .when(documents)
                .insert(any(Document.class));

        MvcResult r = upload();
        assertThat(r.getResponse().getStatus()).isEqualTo(500);
        assertThat(r.getResponse().getContentAsString())
                .contains("INTERNAL")
                .doesNotContain("secret")
                .doesNotContain("jdbc");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM documents", Integer.class)).isZero();
        assertThat(storedFiles()).isZero(); // đã bù trừ: xóa tệp
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_log WHERE action='UPLOAD'",
                                Integer.class))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM events", Integer.class)).isZero();
        verify(queue, never()).enqueue(any());
    }

    @Test
    void T07_loi_hang_doi_khong_lam_hong_viec_tai_len() throws Exception {
        doThrow(new IllegalStateException("hàng đợi lỗi")).when(queue).enqueue(any());

        MvcResult r = upload();
        assertThat(r.getResponse().getStatus())
                .isEqualTo(202); // tài liệu đã lưu; T08 xử lý lại khi khởi động
        assertThat(jdbc.queryForObject("SELECT status FROM documents", String.class))
                .isEqualTo("PROCESSING");
        assertThat(storedFiles()).isEqualTo(1);
    }

    @Test
    void T07_thanh_cong_ghi_dung_mot_audit_va_khoa_khong_gian_lam_viec_mot_lan() throws Exception {
        MvcResult ok = upload();
        assertThat(ok.getResponse().getStatus()).isEqualTo(202);
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_log WHERE action='UPLOAD'",
                                Integer.class))
                .isEqualTo(1);
        verify(documents).lockWorkspace();
    }
}
