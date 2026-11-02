package vn.docchat.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import vn.docchat.common.Uuids;
import vn.docchat.domain.Role;
import vn.docchat.support.PostgresTestBase;

/**
 * T03.c — migration chạy sạch trên CSDL trống, {@code flyway validate} xanh, ràng buộc
 * CHECK/UNIQUE/FK hoạt động. Test chạy trên PostgreSQL nhúng (không có pgvector) nên chỉ gồm {@code
 * db/migration}; migration {@code db/vector} (cột embedding) chưa được kiểm chứng ở đây.
 */
class MigrationTest extends PostgresTestBase {

    @Autowired Flyway flyway;

    private UUID user() {
        createUser("u-" + UUID.randomUUID(), PASSWORD, Role.MEMBER);
        return jdbc.queryForObject(
                "SELECT id FROM users ORDER BY created_at DESC LIMIT 1", UUID.class);
    }

    private UUID document(UUID owner, String status, String errorCode) {
        UUID id = Uuids.v7();
        jdbc.update(
                "INSERT INTO documents (id, name, size_bytes, status, error_code, storage_key, uploaded_by) VALUES (?,?,?,?,?,?,?)",
                id,
                "a.pdf",
                10,
                status,
                errorCode,
                "documents/x/" + id + ".pdf",
                owner);
        return id;
    }

    private UUID message(UUID owner) {
        UUID conv = Uuids.v7();
        jdbc.update("INSERT INTO conversations (id, owner_id) VALUES (?,?)", conv, owner);
        UUID msg = Uuids.v7();
        jdbc.update(
                "INSERT INTO messages (id, conversation_id, question) VALUES (?,?,?)",
                msg,
                conv,
                "câu hỏi?");
        return msg;
    }

    @Test
    void T03_migration_tao_du_bang_va_validate_xanh() {
        flyway.validate();
        List<String> tables =
                jdbc.queryForList(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
                        String.class);
        assertThat(tables)
                .containsAll(
                        Set.of(
                                "users",
                                "auth_sessions",
                                "documents",
                                "chunks",
                                "conversations",
                                "messages",
                                "citations"));
        assertThat(flyway.info().applied())
                .extracting(i -> i.getVersion().getVersion())
                .containsExactly("1", "2", "3", "5");
        assertThat(flyway.info().pending()).isEmpty();
    }

    @Test
    void T03_migration_chay_lai_khong_loi() {
        assertThatCode(flyway::migrate).doesNotThrowAnyException();
    }

    @Test
    void T03_chi_muc_can_thiet_ton_tai() {
        List<String> idx =
                jdbc.queryForList(
                        "SELECT indexname FROM pg_indexes WHERE schemaname='public'", String.class);
        assertThat(idx)
                .contains(
                        "users_username_lower_uq",
                        "documents_status_uploaded_ix",
                        "chunks_doc_page_ix",
                        "messages_conversation_ix",
                        "citations_document_ix");
    }

    // ---- documents ----

    @Test
    void T03_documents_trang_thai_va_ma_loi_hop_le() {
        UUID u = user();
        document(u, "PROCESSING", null);
        document(u, "READY", null);
        document(u, "ERROR", "SCANNED_NO_TEXT");
        document(u, "DELETED", "CORRUPT"); // đã lỗi rồi bị xóa: vẫn giữ mã lỗi
        assertThatThrownBy(() -> document(u, "UNKNOWN", null))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> document(u, "ERROR", null))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> document(u, "ERROR", "KHONG-CO"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void T03_documents_kich_thuoc_am_va_khoa_ngoai_bi_tu_choi() {
        UUID u = user();
        assertThatThrownBy(
                        () ->
                                jdbc.update(
                                        "INSERT INTO documents (id,name,size_bytes,status,storage_key,uploaded_by) VALUES (?,?,?,?,?,?)",
                                        Uuids.v7(),
                                        "a",
                                        -1,
                                        "READY",
                                        "k",
                                        u))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> document(Uuids.v7(), "READY", null)) // người tải không tồn tại
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // ---- chunks ----

    @Test
    void T03_chunks_rang_buoc_trang_offset_va_xoa_day_chuyen() {
        UUID doc = document(user(), "READY", null);
        assertThatCode(() -> chunk(doc, 1, 0, 10)).doesNotThrowAnyException();
        assertThatThrownBy(() -> chunk(doc, 0, 0, 10))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> chunk(doc, 1, 5, 5))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> chunk(doc, 1, -1, 5))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> chunk(UUID.randomUUID(), 1, 0, 10))
                .isInstanceOf(DataIntegrityViolationException.class);

        jdbc.update("DELETE FROM documents WHERE id = ?", doc);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM chunks", Integer.class)).isZero();
    }

    private void chunk(UUID doc, int page, int start, int end) {
        jdbc.update(
                "INSERT INTO chunks (id, document_id, page, char_start, char_end, content) VALUES (?,?,?,?,?,?)",
                Uuids.v7(),
                doc,
                page,
                start,
                end,
                "nội dung");
    }

    // ---- messages, citations ----

    @Test
    void T03_messages_ket_qua_hop_le() {
        UUID msg = message(user());
        for (String ok :
                List.of(
                        "ANSWERED",
                        "NOT_FOUND",
                        "PARTIAL",
                        "STOPPED",
                        "INTERRUPTED",
                        "TIMEOUT",
                        "ERROR")) {
            assertThatCode(() -> jdbc.update("UPDATE messages SET result=? WHERE id=?", ok, msg))
                    .doesNotThrowAnyException();
        }
        assertThatThrownBy(() -> jdbc.update("UPDATE messages SET result='XYZ' WHERE id=?", msg))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(
                        () -> jdbc.update("UPDATE messages SET prompt_tokens=-1 WHERE id=?", msg))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void T03_citations_duy_nhat_theo_thu_tu_va_giu_ten_tai_lieu() {
        UUID u = user();
        UUID doc = document(u, "READY", null);
        UUID msg = message(u);
        cite(msg, doc, 1, 3);
        assertThatThrownBy(() -> cite(msg, doc, 1, 4))
                .isInstanceOf(DataIntegrityViolationException.class); // trùng [1]
        assertThatThrownBy(() -> cite(msg, doc, 0, 3))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> cite(msg, doc, 2, 0))
                .isInstanceOf(DataIntegrityViolationException.class);
        // tài liệu đang được trích dẫn không bị xóa cứng (xóa mềm bằng status)
        assertThatThrownBy(() -> jdbc.update("DELETE FROM documents WHERE id=?", doc))
                .isInstanceOf(DataIntegrityViolationException.class);
        // xóa tin nhắn thì trích dẫn đi theo
        jdbc.update("DELETE FROM messages WHERE id=?", msg);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM citations", Integer.class)).isZero();
    }

    private void cite(UUID msg, UUID doc, int idx, int page) {
        jdbc.update(
                "INSERT INTO citations (id, message_id, idx, document_id, document_name, page) VALUES (?,?,?,?,?,?)",
                Uuids.v7(),
                msg,
                idx,
                doc,
                "a.pdf",
                page);
    }

    @Test
    void T03_conversations_can_chu_so_huu_hop_le() {
        assertThatThrownBy(
                        () ->
                                jdbc.update(
                                        "INSERT INTO conversations (id, owner_id) VALUES (?,?)",
                                        Uuids.v7(),
                                        UUID.randomUUID()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
