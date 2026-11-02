package vn.docchat.service;

import java.util.UUID;

/**
 * Cổng đẩy công việc xử lý nền (T08 hiện thực). Được gọi SAU KHI giao dịch ghi tài liệu đã commit,
 * nên công việc không bao giờ chạy trước khi bản ghi tồn tại. Lỗi ở đây không làm hỏng việc tải
 * lên: tài liệu vẫn ở trạng thái PROCESSING và T08 phải xử lý lại các tài liệu PROCESSING còn sót
 * khi khởi động.
 */
public interface DocumentProcessingQueue {

    void enqueue(UUID documentId);
}
