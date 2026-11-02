package vn.docchat.service;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Đọc tối đa {@code limit} byte; byte thứ {@code limit + 1} làm ném {@link TooLargeException} ngay
 * (không đọc hết).
 */
final class LimitedInputStream extends FilterInputStream {

    /** Vượt giới hạn dung lượng. */
    static final class TooLargeException extends IOException {
        TooLargeException(long limit) {
            super("Vượt giới hạn " + limit + " byte");
        }
    }

    private final long limit;
    private long read;

    LimitedInputStream(InputStream in, long limit) {
        super(in);
        this.limit = limit;
    }

    private void count(long n) throws IOException {
        read += n;
        if (read > limit) {
            throw new TooLargeException(limit);
        }
    }

    @Override
    public int read() throws IOException {
        int b = super.read();
        if (b >= 0) {
            count(1);
        }
        return b;
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        int n = super.read(b, off, len);
        if (n > 0) {
            count(n);
        }
        return n;
    }
}
