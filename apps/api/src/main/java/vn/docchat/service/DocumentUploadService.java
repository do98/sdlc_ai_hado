package vn.docchat.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import vn.docchat.common.Uuids;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.Document;
import vn.docchat.domain.DocumentStatus;
import vn.docchat.domain.ErrorCode;
import vn.docchat.domain.User;
import vn.docchat.repository.DocumentRepository;
import vn.docchat.repository.FileStore;

/**
 * Nhận một tệp PDF (T07). Thứ tự kiểm tra: tên tệp → loại (%PDF- trong 1024 byte đầu, KHÔNG tin
 * đuôi tệp hay Content-Type của client) → chỗ trống (kiểm nhanh) → dung lượng (đọc theo luồng, dừng
 * ngay khi vượt) → giữ chỗ nguyên tử. Tệp bị từ chối không để lại bản ghi, tệp lưu trữ hay việc xử
 * lý nào.
 *
 * <p>Số trang và các lỗi nội dung (mật khẩu, scan, hỏng, quá nhiều trang) do T08 kết luận ở xử lý
 * nền.
 */
@Service
public class DocumentUploadService {

    private static final Logger log = LoggerFactory.getLogger(DocumentUploadService.class);
    private static final int HEAD_BYTES = 1024;
    private static final int MAX_NAME_CODE_POINTS = 255;

    /** Kết quả nhận tệp. */
    public record Accepted(UUID id, DocumentStatus status) {}

    private final DocumentRepository documents;
    private final FileStore files;
    private final LimitsProperties limits;
    private final AuditService audit;
    private final AnalyticsService analytics;
    private final TransactionTemplate tx;
    private final List<DocumentProcessingQueue> queues;
    private final DocumentEventService documentEvents;
    private final Clock clock;

    public DocumentUploadService(
            DocumentRepository documents,
            FileStore files,
            LimitsProperties limits,
            AuditService audit,
            AnalyticsService analytics,
            TransactionTemplate tx,
            List<DocumentProcessingQueue> queues,
            DocumentEventService documentEvents,
            Clock clock) {
        this.documentEvents = documentEvents;
        this.documents = documents;
        this.files = files;
        this.limits = limits;
        this.audit = audit;
        this.analytics = analytics;
        this.tx = tx;
        this.queues = queues;
        this.clock = clock;
    }

    public Accepted upload(User user, String originalName, InputStream data) {
        String name = sanitizeName(originalName);
        if (name.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 1. Loại tệp: nhìn vào nội dung, không tin đuôi tệp
        byte[] head;
        try {
            head = data.readNBytes(HEAD_BYTES);
        } catch (IOException e) {
            throw internal("đọc tệp tải lên", e);
        }
        if (!looksLikePdf(head)) {
            throw reject(user, ErrorCode.NOT_PDF);
        }

        // 2. Chỗ trống (kiểm nhanh để khỏi lưu tệp vô ích; giữ chỗ thật nằm trong giao dịch ở bước
        // 4)
        if (documents.countActive() >= limits.maxDocuments()) {
            throw reject(user, ErrorCode.WORKSPACE_FULL);
        }

        // 3. Lưu tệp (mã hóa), đọc theo luồng và dừng ngay khi vượt dung lượng
        UUID id = Uuids.v7();
        String key = "documents/" + user.id() + "/" + id + ".pdf";
        long size;
        try (InputStream limited =
                new LimitedInputStream(
                        new SequenceInputStream(new ByteArrayInputStream(head), data),
                        limits.maxFileBytes())) {
            size = files.put(key, limited);
        } catch (LimitedInputStream.TooLargeException e) {
            throw reject(user, ErrorCode.FILE_TOO_LARGE);
        } catch (IOException e) {
            throw internal("lưu tệp", e);
        }

        // 4. Giữ chỗ nguyên tử + ghi bản ghi, audit, analytics trong MỘT giao dịch
        Document doc =
                new Document(
                        id,
                        name,
                        size,
                        null,
                        DocumentStatus.PROCESSING,
                        null,
                        key,
                        user.id(),
                        Instant.now(clock));
        try {
            tx.executeWithoutResult(status -> register(user, doc));
        } catch (ApiException e) {
            deleteQuietly(key);
            throw reject(user, e.code());
        } catch (RuntimeException e) {
            deleteQuietly(key);
            throw internal("ghi nhận tài liệu", e);
        }
        return new Accepted(id, DocumentStatus.PROCESSING);
    }

    private void register(User user, Document doc) {
        documents.lockWorkspace();
        if (documents.countActive() >= limits.maxDocuments()) {
            throw new ApiException(ErrorCode.WORKSPACE_FULL);
        }
        documents.insert(doc);
        audit.record(
                user.id(), "UPLOAD", "document", doc.id(), Map.of("sizeBytes", doc.sizeBytes()));
        analytics.emit("doc_upload_started", user.id(), Map.of("sizeBytes", doc.sizeBytes()));
        documentEvents.documentChanged(doc.id()); // cùng giao dịch: lùi thì không còn sự kiện
        // Chỉ đẩy việc xử lý SAU KHI commit: công việc không bao giờ chạy trước khi bản ghi tồn tại
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (DocumentProcessingQueue q : queues) {
                            try {
                                q.enqueue(doc.id());
                            } catch (RuntimeException e) {
                                // Không làm hỏng việc tải lên; T08 xử lý lại tài liệu PROCESSING
                                // còn sót
                                log.error("Không đẩy được việc xử lý cho tài liệu {}", doc.id(), e);
                            }
                        }
                    }
                });
    }

    // ------------------------------------------------------------------ tiện ích

    private ApiException reject(User user, ErrorCode code) {
        try {
            analytics.emit("doc_upload_rejected", user.id(), Map.of("reason", code.name()));
        } catch (RuntimeException e) {
            log.warn("Không ghi được sự kiện từ chối tải lên", e);
        }
        return new ApiException(code);
    }

    private ApiException internal(String what, Exception cause) {
        log.error("Lỗi khi {}", what, cause); // chi tiết chỉ ở log; phản hồi chỉ có mã INTERNAL
        return new ApiException(ErrorCode.INTERNAL);
    }

    private void deleteQuietly(String key) {
        try {
            files.delete(key);
        } catch (IOException | RuntimeException e) {
            log.error("Không xóa được tệp lưu trữ mồ côi {}", key, e);
        }
    }

    /** %PDF- trong 1024 byte đầu (đặc tả PDF cho phép tiêu đề không ở byte 0). */
    static boolean looksLikePdf(byte[] head) {
        return new String(head, StandardCharsets.ISO_8859_1).contains("%PDF-");
    }

    /**
     * Chuẩn hóa tên tệp: NFC, bỏ đường dẫn (cả / và \), bỏ ký tự điều khiển, cắt tối đa 255 điểm
     * mã. Tên chỉ để hiển thị; khóa lưu trữ không bao giờ dùng tên này.
     */
    static String sanitizeName(String raw) {
        if (raw == null) {
            return "";
        }
        String s = Normalizer.normalize(raw, Normalizer.Form.NFC);
        int slash = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
        s = s.substring(slash + 1);
        StringBuilder sb = new StringBuilder();
        s.codePoints()
                .filter(cp -> !Character.isISOControl(cp))
                .limit(MAX_NAME_CODE_POINTS)
                .forEach(sb::appendCodePoint);
        return sb.toString().strip();
    }
}
