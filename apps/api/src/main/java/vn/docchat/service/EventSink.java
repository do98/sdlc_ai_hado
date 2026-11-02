package vn.docchat.service;

import java.io.IOException;

/** Nơi nhận sự kiện của một kết nối SSE (tầng api hiện thực bằng {@code SseEmitter}). */
public interface EventSink {

    /** Gửi một sự kiện dữ liệu; {@code id} null nghĩa là không có dòng {@code id:}. */
    void send(Long id, String type, String dataJson) throws IOException;

    /** Dòng chú thích {@code : ping}. */
    void ping() throws IOException;

    /** Phiên còn hợp lệ không; hết hạn thì kết nối bị đóng ở lần heartbeat kế tiếp. */
    boolean sessionStillValid();

    /** Đóng kết nối phía máy chủ. */
    void close();
}
