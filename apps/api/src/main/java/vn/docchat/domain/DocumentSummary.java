package vn.docchat.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Dạng đọc của tài liệu cho danh sách và sự kiện. {@code warningJson} là JSON thô của cột {@code
 * warning} (hoặc null), ví dụ {@code {"code":"UNREADABLE_PAGES","pages":[3,7]}}.
 */
public record DocumentSummary(
        UUID id,
        String name,
        long sizeBytes,
        Integer pageCount,
        DocumentStatus status,
        String errorCode,
        String warningJson,
        UUID uploadedBy,
        Instant uploadedAt) {}
