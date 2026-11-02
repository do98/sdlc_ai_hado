package vn.docchat.service;

import org.springframework.stereotype.Service;
import vn.docchat.repository.DatabaseProbe;
import vn.docchat.repository.FileStore;

/**
 * Sẵn sàng = CSDL trả lời được và thư mục lưu tệp ghi được. Cố ý <b>không</b> kiểm tra dịch vụ AI
 * để sự cố AI không làm toàn hệ thống bị coi là chưa sẵn sàng.
 */
@Service
public class ReadinessService {

    public record Result(boolean database, boolean storage) {
        public boolean up() {
            return database && storage;
        }
    }

    private final DatabaseProbe database;
    private final FileStore files;

    public ReadinessService(DatabaseProbe database, FileStore files) {
        this.database = database;
        this.files = files;
    }

    public Result check() {
        boolean storage;
        try {
            storage = files.isWritable();
        } catch (RuntimeException e) {
            storage = false;
        }
        return new Result(database.isUp(), storage);
    }
}
