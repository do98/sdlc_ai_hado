package vn.docchat.service;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import vn.docchat.domain.DocumentSummary;
import vn.docchat.repository.DocumentRepository;
import vn.docchat.repository.EventRepository;

/**
 * Ghi sự kiện {@code document.updated} (T09). Gọi TRONG giao dịch của thay đổi tài liệu: lùi giao
 * dịch thì không còn sự kiện. Sau khi commit mới đánh thức các kết nối đang mở.
 */
@Service
public class DocumentEventService {

    public static final String DOCUMENT_UPDATED = "document.updated";

    private final DocumentRepository documents;
    private final EventRepository events;
    private final EventStreamService stream;

    public DocumentEventService(
            DocumentRepository documents, EventRepository events, EventStreamService stream) {
        this.documents = documents;
        this.events = events;
        this.stream = stream;
    }

    public void documentChanged(UUID documentId) {
        Optional<DocumentSummary> d = documents.findSummary(documentId);
        if (d.isEmpty()) {
            return;
        }
        events.append(DOCUMENT_UPDATED, payload(d.get()));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            stream.wake();
                        }
                    });
        } else {
            stream.wake();
        }
    }

    /** {@code {id,status,errorCode,warning,pageCount}} — không có tên tệp hay nội dung. */
    static String payload(DocumentSummary d) {
        return "{\"id\":\""
                + d.id()
                + "\",\"status\":\""
                + d.status().name()
                + "\",\"errorCode\":"
                + (d.errorCode() == null ? "null" : "\"" + d.errorCode() + "\"")
                + ",\"warning\":"
                + (d.warningJson() == null ? "null" : d.warningJson())
                + ",\"pageCount\":"
                + (d.pageCount() == null ? "null" : d.pageCount())
                + "}";
    }
}
