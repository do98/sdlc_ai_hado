package vn.docchat.repository;

import java.io.IOException;
import java.io.InputStream;

/**
 * Kho lưu tệp PDF gốc. Tệp được mã hóa khi lưu; hỗ trợ đọc theo khoảng byte (cho {@code Range},
 * T17) mà không phải giải mã cả tệp.
 *
 * <p>Khóa ({@code key}) do hệ thống sinh, dạng {@code documents/{ownerId}/{documentId}.pdf};
 * <b>không bao giờ</b> chứa tên tệp gốc của người dùng. Khóa không hợp lệ (đường dẫn thoát, ký tự
 * lạ) bị từ chối.
 */
public interface FileStore {

    /**
     * Ghi (hoặc ghi đè) tệp một cách nguyên tử: người đọc chỉ thấy bản cũ hoặc bản mới đầy đủ, lỗi
     * giữa chừng không để lại tệp dở hay tệp tạm.
     *
     * @return số byte nội dung đã lưu
     */
    long put(String key, InputStream data) throws IOException;

    /**
     * Kích thước nội dung (byte, chưa mã hóa). Ném {@link java.nio.file.NoSuchFileException} nếu
     * không có.
     */
    long size(String key) throws IOException;

    /** Đọc toàn bộ nội dung đã giải mã. Đọc hỏng (bị sửa/cắt) ném {@link IOException}. */
    InputStream open(String key) throws IOException;

    /**
     * Đọc khoảng {@code [start, endInclusive]} của nội dung; dải không hợp lệ ném {@link
     * IllegalArgumentException}.
     */
    InputStream openRange(String key, long start, long endInclusive) throws IOException;

    /**
     * @return true nếu có tệp bị xóa; không lỗi khi tệp không tồn tại (idempotent).
     */
    boolean delete(String key) throws IOException;

    /** Thư mục lưu ghi được không (dùng cho {@code /api/ready}). */
    boolean isWritable();
}
