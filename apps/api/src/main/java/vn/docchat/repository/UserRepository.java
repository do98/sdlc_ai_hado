package vn.docchat.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.docchat.domain.Role;
import vn.docchat.domain.User;

@Repository
public class UserRepository {

    private final JdbcClient jdbc;

    public UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByUsername(String username) {
        return jdbc.sql("SELECT * FROM users WHERE lower(username) = lower(:u)")
                .param("u", username)
                .query(UserRepository::map)
                .optional();
    }

    public Optional<User> findById(UUID id) {
        return jdbc.sql("SELECT * FROM users WHERE id = :id")
                .param("id", id)
                .query(UserRepository::map)
                .optional();
    }

    /**
     * @return false nếu tên đăng nhập đã tồn tại (không phân biệt hoa thường).
     */
    public boolean insertIfAbsent(
            UUID id, String username, String passwordHash, Role role, Instant now) {
        return jdbc.sql(
                                """
                                INSERT INTO users (id, username, password_hash, role, created_at)
                                VALUES (:id, :u, :h, :r, :t)
                                ON CONFLICT DO NOTHING
                                """)
                        .param("id", id)
                        .param("u", username)
                        .param("h", passwordHash)
                        .param("r", role.name())
                        .param("t", Timestamp.from(now))
                        .update()
                == 1;
    }

    /**
     * Ghi nhận một lần sai mật khẩu, nguyên tử (không mất đếm khi nhiều yêu cầu song song). Đủ
     * {@code max} lần thì khóa đến {@code lockUntil} và đặt lại bộ đếm.
     */
    public void registerFailure(UUID id, int max, Instant lockUntil) {
        jdbc.sql(
                        """
                        UPDATE users SET
                          failed_logins = CASE WHEN failed_logins + 1 >= :max THEN 0 ELSE failed_logins + 1 END,
                          locked_until  = CASE WHEN failed_logins + 1 >= :max THEN :lock ELSE locked_until END
                        WHERE id = :id
                        """)
                .param("max", max)
                .param("lock", Timestamp.from(lockUntil))
                .param("id", id)
                .update();
    }

    public void resetFailures(UUID id) {
        jdbc.sql("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = :id")
                .param("id", id)
                .update();
    }

    private static User map(ResultSet rs, int row) throws SQLException {
        Timestamp locked = rs.getTimestamp("locked_until");
        return new User(
                rs.getObject("id", UUID.class),
                rs.getString("username"),
                rs.getString("password_hash"),
                Role.valueOf(rs.getString("role")),
                rs.getInt("failed_logins"),
                locked == null ? null : locked.toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }
}
