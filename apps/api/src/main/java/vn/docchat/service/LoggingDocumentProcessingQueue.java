package vn.docchat.service;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Bản mặc định cho tới khi T08 có hàng đợi thật: chỉ ghi log (không có tên tệp/nội dung). */
@Component
class LoggingDocumentProcessingQueue implements DocumentProcessingQueue {

    private static final Logger log = LoggerFactory.getLogger(LoggingDocumentProcessingQueue.class);

    @Override
    public void enqueue(UUID documentId) {
        log.info("Tài liệu {} chờ xử lý nền (chưa có bộ xử lý T08).", documentId);
    }
}
