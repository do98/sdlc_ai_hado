package vn.docchat.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import vn.docchat.common.Uuids;
import vn.docchat.repository.AuditRepository;

/**
 * Ghi nhật ký kiểm toán chỉ-thêm. Gọi TRONG cùng giao dịch với hành động nghiệp vụ để lùi giao dịch
 * thì không còn dòng audit. Chỉ nhận các khóa thuộc danh sách cho phép: không bao giờ chứa nội dung
 * hay tên tệp gốc.
 */
@Service
public class AuditService {

    static final Set<String> ALLOWED_KEYS = Set.of("sizeBytes", "pageCount", "reason", "status");

    private final AuditRepository repo;
    private final Clock clock;

    public AuditService(AuditRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    public void record(
            UUID userId,
            String action,
            String subjectType,
            UUID subjectId,
            Map<String, Object> attributes) {
        repo.insert(
                Uuids.v7(),
                userId,
                action,
                subjectType,
                subjectId,
                Json.of(attributes, ALLOWED_KEYS),
                Instant.now(clock));
    }
}
