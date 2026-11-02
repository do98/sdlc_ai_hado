package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import vn.docchat.domain.Role;
import vn.docchat.repository.FileStore;
import vn.docchat.service.DocumentProcessingQueue;
import vn.docchat.support.PostgresTestBase;

/**
 * T07 — POST /api/documents: kiểm tra loại/dung lượng, giữ chỗ nguyên tử, lưu tệp mã hóa, bản ghi
 * PROCESSING, audit + analytics, đẩy việc xử lý SAU commit. Ứng với US-002, US-003, US-006 (AC ở
 * cuối tên test).
 */
class DocumentUploadApiTest extends PostgresTestBase {

    private static final long MAX = 10L * 1024 * 1024;

    @Autowired FileStore files;
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

    // ---------------------------------------------------------------- tiện ích

    static byte[] pdf(int totalSize) {
        byte[] b = new byte[totalSize];
        Arrays.fill(b, (byte) 'x');
        byte[] header = "%PDF-1.4\n".getBytes(StandardCharsets.ISO_8859_1);
        System.arraycopy(header, 0, b, 0, Math.min(header.length, totalSize));
        return b;
    }

    private MockHttpServletRequestBuilder req(String name, byte[] content) {
        return multipart("/api/documents")
                .file(new MockMultipartFile("file", name, "application/pdf", content))
                .cookie(session);
    }

    private MvcResult upload(String name, byte[] content) throws Exception {
        return mvc.perform(req(name, content)).andReturn();
    }

    private int documentCount() {
        return jdbc.queryForObject("SELECT count(*) FROM documents", Integer.class);
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

    private int tmpFiles() throws IOException {
        try (Stream<Path> s = Files.list(STORAGE_DIR.resolve(".tmp"))) {
            return (int) s.count();
        }
    }

    private void insertDocuments(int n, String status) {
        for (int i = 0; i < n; i++) {
            String errorCode = status.equals("ERROR") ? "CORRUPT" : null;
            jdbc.update(
                    "INSERT INTO documents (id,name,size_bytes,status,error_code,storage_key,uploaded_by) VALUES (?,?,?,?,?,?,?)",
                    UUID.randomUUID(),
                    "seed" + i + ".pdf",
                    100,
                    status,
                    errorCode,
                    "documents/seed/" + i,
                    userId);
        }
    }

    private String codeOf(MvcResult r) throws Exception {
        return com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$.code");
    }

    private int eventCount(String code) {
        return jdbc.queryForObject(
                "SELECT count(*) FROM analytics_events WHERE event_code = ?", Integer.class, code);
    }

    // ---------------------------------------------------------------- nhận tệp hợp lệ

    @Test
    void T07_US002_AC1_pdf_hop_le_tra_202_va_tao_ban_ghi_PROCESSING() throws Exception {
        byte[] content = pdf(5000);
        MvcResult r = upload("Hợp đồng A.pdf", content);

        assertThat(r.getResponse().getStatus()).isEqualTo(202);
        assertThat(r.getResponse().getContentAsString()).contains("\"status\":\"PROCESSING\"");
        UUID id =
                UUID.fromString(
                        com.jayway.jsonpath.JsonPath.read(
                                r.getResponse().getContentAsString(), "$.id"));

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM documents WHERE id = ?", id);
        assertThat(row.get("name")).isEqualTo("Hợp đồng A.pdf");
        assertThat(row.get("status")).isEqualTo("PROCESSING");
        assertThat(((Number) row.get("size_bytes")).longValue()).isEqualTo(5000);
        assertThat(row.get("uploaded_by")).isEqualTo(userId);
        assertThat(row.get("page_count")).isNull(); // số trang do T08 kết luận
        // khóa lưu trữ theo id, KHÔNG chứa tên tệp gốc
        assertThat((String) row.get("storage_key"))
                .isEqualTo("documents/" + userId + "/" + id + ".pdf");
        // tệp đã lưu, mã hóa, đọc lại đúng nội dung
        assertThat(files.open((String) row.get("storage_key")).readAllBytes()).isEqualTo(content);
        assertThat(
                        new String(
                                Files.readAllBytes(
                                        STORAGE_DIR.resolve((String) row.get("storage_key"))),
                                StandardCharsets.ISO_8859_1))
                .doesNotContain("%PDF-");
    }

    @Test
    void T07_ghi_audit_va_analytics_khong_chua_ten_tep() throws Exception {
        upload("bao-cao-mat.pdf", pdf(2048));

        Map<String, Object> audit =
                jdbc.queryForMap("SELECT * FROM audit_log WHERE action = 'UPLOAD'");
        assertThat(audit.get("user_id")).isEqualTo(userId);
        assertThat(audit.get("subject_type")).isEqualTo("document");
        assertThat(audit.get("attributes").toString())
                .contains("2048")
                .doesNotContain("bao-cao-mat");

        Map<String, Object> ev =
                jdbc.queryForMap(
                        "SELECT * FROM analytics_events WHERE event_code = 'doc_upload_started'");
        assertThat(ev.get("user_id")).isEqualTo(userId);
        assertThat(ev.get("attributes").toString()).contains("2048").doesNotContain("bao-cao-mat");
    }

    @Test
    void T09_tai_len_ghi_dung_mot_su_kien_document_updated_khong_chua_ten_tep() throws Exception {
        MvcResult r = upload("tai-lieu-mat.pdf", pdf(100));
        String id = com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$.id");
        Map<String, Object> ev = jdbc.queryForMap("SELECT type, payload::text AS p FROM events");
        assertThat(ev.get("type")).isEqualTo("document.updated");
        assertThat((String) ev.get("p"))
                .contains(id)
                .contains("\"status\": \"PROCESSING\"")
                .doesNotContain("tai-lieu-mat");
        // bị từ chối thì không có sự kiện
        upload("a.docx", new byte[] {1, 2, 3});
        assertThat(jdbc.queryForObject("SELECT count(*) FROM events", Integer.class)).isEqualTo(1);
    }

    @Test
    void T07_dua_viec_xu_ly_vao_hang_doi_dung_mot_lan_sau_khi_commit() throws Exception {
        MvcResult r = upload("a.pdf", pdf(100));
        UUID id =
                UUID.fromString(
                        com.jayway.jsonpath.JsonPath.read(
                                r.getResponse().getContentAsString(), "$.id"));
        verify(queue, times(1)).enqueue(id);
        // khi gọi, bản ghi đã tồn tại (commit trước khi đẩy việc)
        assertThat(documentCount()).isEqualTo(1);
    }

    @Test
    void T07_tieu_de_pdf_khong_o_byte_0_van_duoc_nhan_neu_trong_1024_byte_dau() throws Exception {
        byte[] junk = new byte[500];
        Arrays.fill(junk, (byte) ' ');
        byte[] withJunk = concat(junk, pdf(300));
        assertThat(upload("a.pdf", withJunk).getResponse().getStatus()).isEqualTo(202);

        byte[] late = new byte[1100];
        Arrays.fill(late, (byte) ' ');
        byte[] lateHeader = concat(late, pdf(300));
        MvcResult r = upload("b.pdf", lateHeader);
        assertThat(r.getResponse().getStatus()).isEqualTo(415);
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = Arrays.copyOf(a, a.length + b.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }

    // ---------------------------------------------------------------- từ chối loại tệp (US-003)

    @Test
    void T07_US003_AC1_AC2_AC4_tep_khong_phai_pdf_bi_tu_choi_va_khong_de_lai_gi() throws Exception {
        byte[] docx =
                concat("PK\u0003\u0004".getBytes(StandardCharsets.ISO_8859_1), new byte[2000]);
        byte[] jpeg = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3};
        for (Object[] c :
                new Object[][] {
                    {"bao-cao.docx", docx},
                    {"bang.xlsx", docx},
                    {"anh.jpg", jpeg},
                    {"gia-mao.pdf", jpeg}, // đổi đuôi .pdf nhưng nội dung không phải PDF
                    {"rong.pdf", new byte[0]},
                    {"van-ban.pdf", "chỉ là văn bản".getBytes(StandardCharsets.UTF_8)}
                }) {
            MvcResult r = upload((String) c[0], (byte[]) c[1]);
            assertThat(r.getResponse().getStatus()).as((String) c[0]).isEqualTo(415);
            assertThat(codeOf(r)).isEqualTo("NOT_PDF");
        }
        assertThat(documentCount()).isZero();
        assertThat(storedFiles()).isZero();
        assertThat(tmpFiles()).isZero();
        assertThat(eventCount("doc_upload_started")).isZero();
        assertThat(eventCount("doc_upload_rejected")).isEqualTo(6);
        verify(queue, never()).enqueue(any());
    }

    @Test
    void T07_ma_loi_ke_ca_ten_tep_doc_hai_khong_lot_vao_thong_diep() throws Exception {
        MvcResult r =
                upload("<script>alert(1)</script>.docx", "x".getBytes(StandardCharsets.UTF_8));
        assertThat(r.getResponse().getContentAsString()).doesNotContain("script");
    }

    // ---------------------------------------------------------------- dung lượng (US-003-AC3)

    @Test
    void T07_US003_AC3_dung_gioi_han_duoc_nhan_vuot_1_byte_bi_tu_choi() throws Exception {
        assertThat(upload("vua-du.pdf", pdf((int) MAX)).getResponse().getStatus()).isEqualTo(202);
        assertThat(documentCount()).isEqualTo(1);
        assertThat(storedFiles()).isEqualTo(1);

        MvcResult r = upload("qua-lon.pdf", pdf((int) MAX + 1));
        assertThat(r.getResponse().getStatus()).isEqualTo(413);
        assertThat(codeOf(r)).isEqualTo("FILE_TOO_LARGE");
        assertThat(documentCount()).isEqualTo(1); // không thêm bản ghi
        assertThat(storedFiles()).isEqualTo(1); // không thêm tệp (đã dọn)
        assertThat(tmpFiles()).isZero(); // không còn tệp tạm
        assertThat(eventCount("doc_upload_rejected")).isEqualTo(1);
    }

    // ---------------------------------------------------------------- giữ chỗ (US-006)

    @Test
    void T07_US006_AC3_du_20_tai_lieu_thi_409_va_khong_luu_tep() throws Exception {
        insertDocuments(20, "READY");
        MvcResult r = upload("them.pdf", pdf(100));
        assertThat(r.getResponse().getStatus()).isEqualTo(409);
        assertThat(codeOf(r)).isEqualTo("WORKSPACE_FULL");
        assertThat(documentCount()).isEqualTo(20);
        assertThat(storedFiles()).isZero();
        verify(queue, never()).enqueue(any());
    }

    @Test
    void T07_tai_lieu_loi_van_chiem_cho_con_tai_lieu_da_xoa_thi_khong() throws Exception {
        insertDocuments(19, "ERROR"); // ERROR vẫn tính vào 20
        assertThat(upload("a.pdf", pdf(100)).getResponse().getStatus()).isEqualTo(202);
        assertThat(upload("b.pdf", pdf(100)).getResponse().getStatus()).isEqualTo(409);

        jdbc.update(
                "UPDATE documents SET status='DELETED' WHERE id = (SELECT id FROM documents WHERE status='ERROR' LIMIT 1)");
        assertThat(upload("c.pdf", pdf(100)).getResponse().getStatus())
                .isEqualTo(202); // DELETED giải phóng chỗ
    }

    @Test
    void T07_dong_thoi_khi_con_1_cho_dung_1_yeu_cau_thanh_cong_lap_nhieu_lan() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            for (int round = 0; round < 15; round++) {
                jdbc.update("DELETE FROM documents");
                deleteStoredFiles();
                insertDocuments(19, "READY");

                CountDownLatch start = new CountDownLatch(1);
                List<Future<Integer>> results = new ArrayList<>();
                for (int i = 0; i < 8; i++) {
                    int n = i;
                    results.add(
                            pool.submit(
                                    () -> {
                                        start.await();
                                        return upload("t" + n + ".pdf", pdf(200))
                                                .getResponse()
                                                .getStatus();
                                    }));
                }
                start.countDown();
                int accepted = 0;
                int full = 0;
                for (Future<Integer> f : results) {
                    int s = f.get();
                    if (s == 202) {
                        accepted++;
                    } else if (s == 409) {
                        full++;
                    } else {
                        throw new AssertionError("Trạng thái lạ " + s + " ở vòng " + round);
                    }
                }
                assertThat(accepted).as("vòng %d", round).isEqualTo(1);
                assertThat(full).as("vòng %d", round).isEqualTo(7);
                assertThat(documentCount()).as("vòng %d", round).isEqualTo(20);
                assertThat(storedFiles()).as("không mồ côi, vòng %d", round).isEqualTo(1);
                assertThat(tmpFiles()).isZero();
            }
        } finally {
            pool.shutdownNow();
        }
    }

    private void deleteStoredFiles() throws IOException {
        Path dir = STORAGE_DIR.resolve("documents").resolve(userId.toString());
        if (Files.exists(dir)) {
            try (Stream<Path> s = Files.list(dir)) {
                for (Path p : s.toList()) {
                    Files.delete(p);
                }
            }
        }
    }

    // ---------------------------------------------------------------- tên tệp

    @Test
    void T07_chuan_hoa_ten_tep_nfc_bo_duong_dan_cat_do_dai_khong_vao_khoa_luu_tru()
            throws Exception {
        String nfd = "Ho\u0323\u0302p do\u0302\u0300ng.pdf"; // dạng NFD
        upload(nfd, pdf(100));
        upload("../../etc/passwd.pdf", pdf(100));
        upload("C:\\Users\\a\\b.pdf", pdf(100));
        upload("x".repeat(400) + ".pdf", pdf(100));

        List<String> names =
                jdbc.queryForList("SELECT name FROM documents ORDER BY uploaded_at", String.class);
        assertThat(names.get(0))
                .isEqualTo(java.text.Normalizer.normalize(nfd, java.text.Normalizer.Form.NFC));
        assertThat(names.get(1)).isEqualTo("passwd.pdf");
        assertThat(names.get(2)).isEqualTo("b.pdf");
        assertThat(names.get(3).codePointCount(0, names.get(3).length())).isEqualTo(255);
        for (String key : jdbc.queryForList("SELECT storage_key FROM documents", String.class)) {
            assertThat(key).matches("documents/[0-9a-f-]{36}/[0-9a-f-]{36}\\.pdf");
        }
    }

    @Test
    void T07_ten_tep_rong_tra_400() throws Exception {
        MvcResult r = upload("", pdf(100));
        assertThat(r.getResponse().getStatus()).isEqualTo(400);
        assertThat(codeOf(r)).isEqualTo("INVALID_REQUEST");
        assertThat(documentCount()).isZero();
    }

    // ---------------------------------------------------------------- xác thực, CSRF, định dạng
    // yêu cầu

    @Test
    void T07_can_phien_va_chong_csrf() throws Exception {
        mvc.perform(
                        multipart("/api/documents")
                                .file(
                                        new MockMultipartFile(
                                                "file", "a.pdf", "application/pdf", pdf(100))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(req("a.pdf", pdf(100)).header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_REJECTED"));
        assertThat(documentCount()).isZero();
        assertThat(storedFiles()).isZero();
    }

    @Test
    void T07_thieu_truong_file_tra_400_va_sai_kieu_noi_dung_tra_415() throws Exception {
        MvcResult missing =
                mvc.perform(
                                multipart("/api/documents")
                                        .file(
                                                new MockMultipartFile(
                                                        "khac",
                                                        "a.pdf",
                                                        "application/pdf",
                                                        pdf(100)))
                                        .cookie(session))
                        .andReturn();
        assertThat(missing.getResponse().getStatus()).isEqualTo(400);
        assertThat(codeOf(missing)).isEqualTo("INVALID_REQUEST");

        MvcResult wrong =
                mvc.perform(
                                post("/api/documents")
                                        .cookie(session)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{}"))
                        .andReturn();
        assertThat(wrong.getResponse().getStatus()).isEqualTo(415);
        assertThat(codeOf(wrong)).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
    }

    @Test
    void T07_content_type_do_client_gui_khong_duoc_tin() throws Exception {
        // khai báo application/pdf nhưng là ảnh → vẫn NOT_PDF; ngược lại khai báo text/plain nhưng
        // đúng PDF → nhận
        MvcResult fake =
                mvc.perform(
                                multipart("/api/documents")
                                        .file(
                                                new MockMultipartFile(
                                                        "file",
                                                        "a.pdf",
                                                        "application/pdf",
                                                        new byte[] {1, 2, 3}))
                                        .cookie(session))
                        .andReturn();
        assertThat(fake.getResponse().getStatus()).isEqualTo(415);
        MvcResult real =
                mvc.perform(
                                multipart("/api/documents")
                                        .file(
                                                new MockMultipartFile(
                                                        "file", "a.pdf", "text/plain", pdf(100)))
                                        .cookie(session))
                        .andReturn();
        assertThat(real.getResponse().getStatus()).isEqualTo(202);
    }
}
