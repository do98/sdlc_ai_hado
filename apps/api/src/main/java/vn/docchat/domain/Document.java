package vn.docchat.domain;

import java.time.Instant;
import java.util.UUID;

/** Tài liệu trong workspace. {@code storageKey} không bao giờ chứa tên tệp gốc của người dùng. */
public record Document(
        UUID id,
        String name,
        long sizeBytes,
        Integer pageCount,
        DocumentStatus status,
        String errorCode,
        String storageKey,
        UUID uploadedBy,
        Instant uploadedAt) {}
