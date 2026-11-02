package vn.docchat.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.docchat.domain.WorkspaceEvent;

@Repository
public class EventRepository {

    /** Tuần tự hóa việc chèn: giữ tới hết giao dịch nên seq được cấp theo đúng thứ tự commit. */
    private static final long APPEND_LOCK_KEY = 7_000_002L;

    private final JdbcClient jdbc;

    public EventRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Phải gọi trong giao dịch của thay đổi tài liệu. */
    public void append(String type, String payloadJson) {
        jdbc.sql("SELECT pg_advisory_xact_lock(:k)")
                .param("k", APPEND_LOCK_KEY)
                .query((rs, i) -> 1)
                .single();
        jdbc.sql("INSERT INTO events (type, payload) VALUES (:t, CAST(:p AS jsonb))")
                .param("t", type)
                .param("p", payloadJson)
                .update();
    }

    public List<WorkspaceEvent> findAfter(long seq, int limit) {
        return jdbc.sql(
                        "SELECT seq, type, payload::text AS payload FROM events "
                                + "WHERE seq > :s ORDER BY seq LIMIT :l")
                .param("s", seq)
                .param("l", limit)
                .query(
                        (rs, i) ->
                                new WorkspaceEvent(
                                        rs.getLong("seq"),
                                        rs.getString("type"),
                                        rs.getString("payload")))
                .list();
    }

    public long maxSeq() {
        return jdbc.sql("SELECT COALESCE(max(seq), 0) FROM events").query(Long.class).single();
    }

    /** Seq nhỏ nhất còn lưu, rỗng nếu bảng trống. */
    public Optional<Long> minSeq() {
        return jdbc.sql("SELECT min(seq) FROM events")
                .query((rs, i) -> rs.getObject(1, Long.class))
                .optional()
                .filter(v -> v != null);
    }

    public long countAfter(long seq) {
        return jdbc.sql("SELECT count(*) FROM events WHERE seq > :s")
                .param("s", seq)
                .query(Long.class)
                .single();
    }

    public int deleteOlderThan(Instant cutoff) {
        return jdbc.sql("DELETE FROM events WHERE created_at < :c")
                .param("c", Timestamp.from(cutoff))
                .update();
    }
}
