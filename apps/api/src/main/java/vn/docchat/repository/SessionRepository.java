package vn.docchat.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.docchat.domain.AuthSession;

@Repository
public class SessionRepository {

    private final JdbcClient jdbc;

    public SessionRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(AuthSession s) {
        jdbc.sql(
                        """
                        INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at)
                        VALUES (:h, :u, :c, :e)
                        """)
                .param("h", s.tokenHash())
                .param("u", s.userId())
                .param("c", Timestamp.from(s.createdAt()))
                .param("e", Timestamp.from(s.expiresAt()))
                .update();
    }

    public Optional<AuthSession> findByTokenHash(String tokenHash) {
        return jdbc.sql("SELECT * FROM auth_sessions WHERE token_hash = :h")
                .param("h", tokenHash)
                .query(
                        (rs, i) ->
                                new AuthSession(
                                        rs.getString("token_hash"),
                                        rs.getObject("user_id", UUID.class),
                                        rs.getTimestamp("created_at").toInstant(),
                                        rs.getTimestamp("expires_at").toInstant()))
                .optional();
    }

    public void delete(String tokenHash) {
        jdbc.sql("DELETE FROM auth_sessions WHERE token_hash = :h").param("h", tokenHash).update();
    }

    public int deleteExpired(Instant now) {
        return jdbc.sql("DELETE FROM auth_sessions WHERE expires_at <= :n")
                .param("n", Timestamp.from(now))
                .update();
    }
}
