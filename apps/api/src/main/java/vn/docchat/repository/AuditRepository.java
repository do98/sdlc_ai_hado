package vn.docchat.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AuditRepository {

    private final JdbcClient jdbc;

    public AuditRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(
            UUID id,
            UUID userId,
            String action,
            String subjectType,
            UUID subjectId,
            String attributesJson,
            Instant at) {
        jdbc.sql(
                        """
                        INSERT INTO audit_log (id, user_id, action, subject_type, subject_id, attributes, at)
                        VALUES (:id, :u, :a, :st, :sid, CAST(:attrs AS jsonb), :at)
                        """)
                .param("id", id)
                .param("u", userId)
                .param("a", action)
                .param("st", subjectType)
                .param("sid", subjectId)
                .param("attrs", attributesJson)
                .param("at", Timestamp.from(at))
                .update();
    }
}
