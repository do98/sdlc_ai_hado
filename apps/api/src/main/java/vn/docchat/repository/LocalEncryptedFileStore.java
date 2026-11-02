package vn.docchat.repository;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.UUID;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Lưu tệp trên đĩa cục bộ, mã hóa AES-256-GCM theo khối để đọc được theo khoảng byte.
 *
 * <p>Định dạng tệp: {@code MAGIC(4) | blockSize(4) | salt(16) | độ dài nội dung(8)} rồi các khối;
 * mỗi khối là {@code AES-GCM(nội dung ≤ 64 KiB) + thẻ 16 byte}.
 *
 * <ul>
 *   <li>Mỗi tệp có <b>khóa riêng</b> = HMAC-SHA256(khóa chủ, nhãn + salt ngẫu nhiên) nên nonce chỉ
 *       cần là số thứ tự khối mà không bao giờ trùng nonce giữa hai tệp.
 *   <li>Dữ liệu xác thực bổ sung (AAD) của khối gồm số thứ tự khối và cờ "khối cuối": đổi chỗ, cắt
 *       hay nối thêm khối đều bị phát hiện.
 *   <li>Ghi nguyên tử qua tệp tạm rồi đổi tên.
 * </ul>
 */
public final class LocalEncryptedFileStore implements FileStore {

    static final int BLOCK = 64 * 1024;
    static final int TAG = 16;
    static final int HEADER = 32;
    private static final byte[] MAGIC = {'D', 'C', 'F', '1'};
    private static final byte[] KDF_LABEL = "docchat-file-v1".getBytes(StandardCharsets.UTF_8);
    private static final Pattern SEGMENT = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{0,127}");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Path root;
    private final Path tmpDir;
    private final byte[] masterKey;

    public LocalEncryptedFileStore(Path root, byte[] masterKey) throws IOException {
        if (masterKey.length != 32) {
            throw new IllegalArgumentException("Khóa mã hóa phải đúng 32 byte (AES-256).");
        }
        this.root = root.toAbsolutePath().normalize();
        this.tmpDir = this.root.resolve(".tmp");
        this.masterKey = masterKey.clone();
        Files.createDirectories(tmpDir);
    }

    // ---------------------------------------------------------------- ghi

    @Override
    public long put(String key, InputStream data) throws IOException {
        Path target = resolve(key);
        Files.createDirectories(target.getParent());
        Path tmp = tmpDir.resolve(UUID.randomUUID() + ".part");
        try {
            long total = write(tmp, data);
            try {
                Files.move(
                        tmp,
                        target,
                        StandardCopyOption.ATOMIC_MOVE,
                        StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return total;
        } finally {
            Files.deleteIfExists(tmp); // không còn gì sau khi đổi tên; còn lại khi lỗi giữa chừng
        }
    }

    private long write(Path tmp, InputStream data) throws IOException {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] fileKey = fileKey(salt);
        try (RandomAccessFile out = new RandomAccessFile(tmp.toFile(), "rw")) {
            ByteBuffer header = ByteBuffer.allocate(HEADER);
            header.put(MAGIC).putInt(BLOCK).put(salt).putLong(0L);
            out.write(header.array());

            long total = 0;
            long index = 0;
            byte[] current = data.readNBytes(BLOCK);
            while (true) {
                byte[] next = current.length == BLOCK ? data.readNBytes(BLOCK) : new byte[0];
                boolean last = next.length == 0;
                out.write(crypt(Cipher.ENCRYPT_MODE, fileKey, index, last, current));
                total += current.length;
                if (last) {
                    break;
                }
                current = next;
                index++;
            }
            out.seek(HEADER - Long.BYTES);
            out.writeLong(total);
            out.getFD().sync();
            return total;
        }
    }

    // ---------------------------------------------------------------- đọc

    @Override
    public long size(String key) throws IOException {
        try (FileChannel ch = FileChannel.open(resolve(key), StandardOpenOption.READ)) {
            return readHeader(ch).length();
        }
    }

    @Override
    public InputStream open(String key) throws IOException {
        long length = size(key);
        if (length == 0) {
            return InputStream.nullInputStream();
        }
        return openRange(key, 0, length - 1);
    }

    @Override
    public InputStream openRange(String key, long start, long endInclusive) throws IOException {
        FileChannel ch = FileChannel.open(resolve(key), StandardOpenOption.READ);
        try {
            Header h = readHeader(ch);
            if (start < 0 || endInclusive < start || endInclusive >= h.length()) {
                throw new IllegalArgumentException(
                        "Dải " + start + "-" + endInclusive + " ngoài nội dung dài " + h.length());
            }
            return new RangeStream(ch, h, fileKey(h.salt()), start, endInclusive);
        } catch (IOException | RuntimeException e) {
            ch.close();
            throw e;
        }
    }

    private record Header(byte[] salt, long length, long blocks) {}

    private Header readHeader(FileChannel ch) throws IOException {
        ByteBuffer buf = ByteBuffer.allocate(HEADER);
        readFully(ch, buf, 0);
        buf.flip();
        byte[] magic = new byte[4];
        buf.get(magic);
        int block = buf.getInt();
        byte[] salt = new byte[16];
        buf.get(salt);
        long length = buf.getLong();
        if (!Arrays.equals(magic, MAGIC) || block != BLOCK || length < 0) {
            throw new IOException("Tệp lưu trữ không hợp lệ hoặc đã bị hỏng.");
        }
        long blocks = Math.max(1, (length + BLOCK - 1) / BLOCK);
        long expectedSize = HEADER + length + blocks * TAG;
        if (ch.size() != expectedSize) {
            throw new IOException("Tệp lưu trữ bị cắt hoặc bị nối thêm.");
        }
        return new Header(salt, length, blocks);
    }

    private static void readFully(FileChannel ch, ByteBuffer buf, long position)
            throws IOException {
        long pos = position;
        while (buf.hasRemaining()) {
            int n = ch.read(buf, pos);
            if (n < 0) {
                throw new EOFException("Tệp lưu trữ bị cắt.");
            }
            pos += n;
        }
    }

    /** Luồng giải mã từng khối theo yêu cầu, chỉ giải các khối nằm trong dải. */
    private final class RangeStream extends InputStream {
        private final FileChannel ch;
        private final Header h;
        private final byte[] fileKey;
        private final long endInclusive;
        private long nextOffset;
        private byte[] block = new byte[0];
        private int blockPos;
        private boolean closed;

        RangeStream(FileChannel ch, Header h, byte[] fileKey, long start, long endInclusive) {
            this.ch = ch;
            this.h = h;
            this.fileKey = fileKey;
            this.nextOffset = start;
            this.endInclusive = endInclusive;
        }

        private boolean fill() throws IOException {
            if (nextOffset > endInclusive) {
                return false;
            }
            long index = nextOffset / BLOCK;
            boolean last = index == h.blocks() - 1;
            int plainLen = (int) (last ? h.length() - index * BLOCK : BLOCK);
            ByteBuffer cipher = ByteBuffer.allocate(plainLen + TAG);
            readFully(ch, cipher, HEADER + index * (long) (BLOCK + TAG));
            byte[] plain = crypt(Cipher.DECRYPT_MODE, fileKey, index, last, cipher.array());
            int from = (int) (nextOffset - index * BLOCK);
            long blockEnd = index * (long) BLOCK + plain.length - 1;
            int to = (int) (Math.min(blockEnd, endInclusive) - index * BLOCK) + 1;
            block = Arrays.copyOfRange(plain, from, to);
            blockPos = 0;
            nextOffset += block.length;
            return true;
        }

        @Override
        public int read() throws IOException {
            byte[] one = new byte[1];
            return read(one, 0, 1) < 0 ? -1 : one[0] & 0xff;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (closed) {
                throw new IOException("Luồng đã đóng.");
            }
            if (len == 0) {
                return 0;
            }
            if (blockPos >= block.length && !fill()) {
                return -1;
            }
            int n = Math.min(len, block.length - blockPos);
            System.arraycopy(block, blockPos, b, off, n);
            blockPos += n;
            return n;
        }

        @Override
        public void close() throws IOException {
            closed = true;
            ch.close();
        }
    }

    // ---------------------------------------------------------------- xóa, kiểm tra

    @Override
    public boolean delete(String key) throws IOException {
        return Files.deleteIfExists(resolve(key));
    }

    @Override
    public boolean isWritable() {
        try {
            Files.createDirectories(tmpDir);
            Path probe = tmpDir.resolve("probe-" + UUID.randomUUID());
            Files.write(probe, new byte[] {1});
            Files.delete(probe);
            return true;
        } catch (IOException | RuntimeException e) {
            return false;
        }
    }

    // ---------------------------------------------------------------- mật mã, khóa

    private byte[] fileKey(byte[] salt) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(masterKey, "HmacSHA256"));
            mac.update(KDF_LABEL);
            return mac.doFinal(salt);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] crypt(int mode, byte[] fileKey, long index, boolean last, byte[] input)
            throws IOException {
        try {
            ByteBuffer nonce = ByteBuffer.allocate(12).putInt(0).putLong(index);
            ByteBuffer aad = ByteBuffer.allocate(9).putLong(index).put((byte) (last ? 1 : 0));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    mode,
                    new SecretKeySpec(fileKey, "AES"),
                    new GCMParameterSpec(128, nonce.array()));
            cipher.updateAAD(aad.array());
            return cipher.doFinal(input);
        } catch (javax.crypto.AEADBadTagException e) {
            throw new IOException("Dữ liệu lưu trữ bị sửa đổi hoặc sai khóa giải mã.", e);
        } catch (GeneralSecurityException e) {
            throw new IOException("Lỗi mã hóa/giải mã.", e);
        }
    }

    /**
     * Khóa chỉ gồm các đoạn {@code [A-Za-z0-9._-]} phân tách bởi '/', không bắt đầu bằng dấu chấm,
     * không thoát gốc.
     */
    Path resolve(String key) throws NoSuchFileException {
        if (key == null || key.isEmpty() || key.length() > 300) {
            throw new IllegalArgumentException("Khóa lưu trữ không hợp lệ.");
        }
        for (String segment : key.split("/", -1)) {
            if (!SEGMENT.matcher(segment).matches() || segment.contains("..")) {
                throw new IllegalArgumentException("Khóa lưu trữ không hợp lệ.");
            }
        }
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root) || p.startsWith(tmpDir)) {
            throw new IllegalArgumentException("Khóa lưu trữ không hợp lệ.");
        }
        return p;
    }
}
