package vn.docchat.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AnalyticsRepository {

    private final JdbcClient jdbc;

    public AnalyticsRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(UUID id, String eventCode, UUID userId, String attributesJson, Instant at) {
        jdbc.sql(
                        """
                        INSERT INTO analytics_events (id, event_code, user_id, attributes, at)
                        VALUES (:id, :c, :u, CAST(:attrs AS jsonb), :at)
                        """)
                .param("id", id)
                .param("c", eventCode)
                .param("u", userId)
                .param("attrs", attributesJson)
                .param("at", Timestamp.from(at))
                .update();
    }
}
