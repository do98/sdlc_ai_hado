package vn.docchat.service;

import java.util.List;
import org.springframework.stereotype.Service;
import vn.docchat.domain.DocumentSummary;
import vn.docchat.repository.DocumentRepository;

/** Đọc danh sách tài liệu cho IF-02. */
@Service
public class DocumentQueryService {

    /** Danh sách và giới hạn workspace, tính trong cùng một lần đọc. */
    public record Listing(List<DocumentSummary> items, int limit) {}

    private final DocumentRepository documents;
    private final LimitsProperties limits;

    public DocumentQueryService(DocumentRepository documents, LimitsProperties limits) {
        this.documents = documents;
        this.limits = limits;
    }

    public Listing list() {
        return new Listing(documents.listActive(), limits.maxDocuments());
    }
}
