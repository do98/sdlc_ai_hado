package vn.docchat.repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.docchat.domain.Document;
import vn.docchat.domain.DocumentStatus;
import vn.docchat.domain.DocumentSummary;

@Repository
public class DocumentRepository {

    /** Khóa tư vấn mức giao dịch bảo vệ việc đếm-rồi-chèn (giới hạn số tài liệu của workspace). */
    private static final long WORKSPACE_LOCK_KEY = 7_000_001L;

    private final JdbcClient jdbc;

    public DocumentRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Giữ khóa cho tới hết giao dịch hiện tại: hai yêu cầu giữ chỗ không bao giờ chạy đồng thời.
     */
    public void lockWorkspace() {
        jdbc.sql("SELECT pg_advisory_xact_lock(:k)")
                .param("k", WORKSPACE_LOCK_KEY)
                .query((rs, i) -> 1)
                .single();
    }

    /** Số tài liệu còn trong workspace: mọi trạng thái trừ DELETED (kể cả ERROR). */
    public int countActive() {
        return jdbc.sql("SELECT count(*) FROM documents WHERE status <> 'DELETED'")
                .query(Integer.class)
                .single();
    }

    public void insert(Document d) {
        jdbc.sql(
                        """
                        INSERT INTO documents (id, name, size_bytes, page_count, status, error_code,
                                               storage_key, uploaded_by, uploaded_at)
                        VALUES (:id, :name, :size, :pages, :status, :err, :key, :by, :at)
                        """)
                .param("id", d.id())
                .param("name", d.name())
                .param("size", d.sizeBytes())
                .param("pages", d.pageCount())
                .param("status", d.status().name())
                .param("err", d.errorCode())
                .param("key", d.storageKey())
                .param("by", d.uploadedBy())
                .param("at", Timestamp.from(d.uploadedAt()))
                .update();
    }

    private static final String SUMMARY_SELECT =
            "SELECT id, name, size_bytes, page_count, status, error_code, warning::text AS warning, "
                    + "uploaded_by, uploaded_at FROM documents ";

    private static DocumentSummary toSummary(java.sql.ResultSet rs, int i)
            throws java.sql.SQLException {
        return new DocumentSummary(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getLong("size_bytes"),
                (Integer) rs.getObject("page_count"),
                DocumentStatus.valueOf(rs.getString("status")),
                rs.getString("error_code"),
                rs.getString("warning"),
                rs.getObject("uploaded_by", UUID.class),
                rs.getTimestamp("uploaded_at").toInstant());
    }

    /** Tài liệu chưa xóa, mới nhất trước (IF-02). */
    public List<DocumentSummary> listActive() {
        return jdbc.sql(
                        SUMMARY_SELECT
                                + "WHERE status <> 'DELETED' ORDER BY uploaded_at DESC, id DESC")
                .query(DocumentRepository::toSummary)
                .list();
    }

    public Optional<DocumentSummary> findSummary(UUID id) {
        return jdbc.sql(SUMMARY_SELECT + "WHERE id = :id")
                .param("id", id)
                .query(DocumentRepository::toSummary)
                .optional();
    }

    public Optional<Document> findById(UUID id) {
        return jdbc.sql("SELECT * FROM documents WHERE id = :id")
                .param("id", id)
                .query(
                        (rs, i) ->
                                new Document(
                                        rs.getObject("id", UUID.class),
                                        rs.getString("name"),
                                        rs.getLong("size_bytes"),
                                        (Integer) rs.getObject("page_count"),
                                        DocumentStatus.valueOf(rs.getString("status")),
                                        rs.getString("error_code"),
                                        rs.getString("storage_key"),
                                        rs.getObject("uploaded_by", UUID.class),
                                        rs.getTimestamp("uploaded_at").toInstant()))
                .optional();
    }
}
