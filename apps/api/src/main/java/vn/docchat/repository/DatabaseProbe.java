package vn.docchat.repository;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Kiểm tra kết nối CSDL cho {@code /api/ready}. */
@Repository
public class DatabaseProbe {

    private final JdbcClient jdbc;

    public DatabaseProbe(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean isUp() {
        try {
            return Integer.valueOf(1).equals(jdbc.sql("SELECT 1").query(Integer.class).single());
        } catch (RuntimeException e) {
            return false;
        }
    }
}
