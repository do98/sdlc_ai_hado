package vn.docchat.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import vn.docchat.common.Uuids;
import vn.docchat.repository.AnalyticsRepository;

/**
 * Sự kiện đo lường (PRD §5.2). Chỉ định danh và số đo; khóa thuộc tính ngoài danh sách cho phép bị
 * từ chối ngay (lỗi lập trình) để không thể vô tình ghi nội dung, tên tệp hay câu hỏi.
 */
@Service
public class AnalyticsService {

    static final Set<String> ALLOWED_KEYS =
            Set.of("sizeBytes", "pageCount", "reason", "durationMs");

    private final AnalyticsRepository repo;
    private final Clock clock;

    public AnalyticsService(AnalyticsRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    public void emit(String eventCode, UUID userId, Map<String, Object> attributes) {
        repo.insert(
                Uuids.v7(),
                eventCode,
                userId,
                Json.of(attributes, ALLOWED_KEYS),
                Instant.now(clock));
    }
}
