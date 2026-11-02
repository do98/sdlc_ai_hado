package vn.docchat.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * T03.f — FileStore: round-trip, tệp trên đĩa không đọc được thô, đọc theo khoảng, phát hiện
 * sửa/cắt, an toàn khóa.
 */
class FileStoreTest {

    private static final int BLOCK = LocalEncryptedFileStore.BLOCK;

    @TempDir Path dir;
    private LocalEncryptedFileStore store;

    private static byte[] key(int seed) {
        byte[] k = new byte[32];
        new Random(seed).nextBytes(k);
        return k;
    }

    private static byte[] data(int size) {
        byte[] b = new byte[size];
        new Random(size).nextBytes(b);
        return b;
    }

    @BeforeEach
    void setUp() throws IOException {
        store = new LocalEncryptedFileStore(dir, key(1));
    }

    private long put(String k, byte[] bytes) throws IOException {
        return store.put(k, new ByteArrayInputStream(bytes));
    }

    private byte[] read(InputStream in) throws IOException {
        try (in) {
            return in.readAllBytes();
        }
    }

    // ---- round-trip ----

    @ParameterizedTest
    @ValueSource(
            ints = {0, 1, 100, BLOCK - 1, BLOCK, BLOCK + 1, 2 * BLOCK, 3 * BLOCK + 17, 300_000})
    void round_trip_moi_kich_thuoc_bien(int size) throws IOException {
        byte[] original = data(size);
        assertThat(put("documents/u1/a.pdf", original)).isEqualTo(size);
        assertThat(store.size("documents/u1/a.pdf")).isEqualTo(size);
        assertThat(read(store.open("documents/u1/a.pdf"))).isEqualTo(original);
    }

    @Test
    void tep_tren_dia_khong_doc_duoc_tho_va_khong_chua_noi_dung() throws IOException {
        byte[] secret =
                ("%PDF-1.7 NOI-DUNG-BI-MAT-12345 ".repeat(5000)).getBytes(StandardCharsets.UTF_8);
        put("documents/u1/s.pdf", secret);
        byte[] onDisk = Files.readAllBytes(dir.resolve("documents/u1/s.pdf"));

        assertThat(indexOf(onDisk, "NOI-DUNG-BI-MAT".getBytes(StandardCharsets.UTF_8)))
                .isNegative();
        assertThat(indexOf(onDisk, "%PDF-".getBytes(StandardCharsets.UTF_8))).isNegative();
        assertThat(onDisk.length).isGreaterThan(secret.length); // có thẻ xác thực và tiêu đề
    }

    @Test
    void cung_noi_dung_luu_hai_lan_cho_hai_ban_ma_khac_nhau() throws IOException {
        byte[] same = data(1000);
        put("documents/u1/a.pdf", same);
        put("documents/u1/b.pdf", same);
        assertThat(Files.readAllBytes(dir.resolve("documents/u1/a.pdf")))
                .isNotEqualTo(Files.readAllBytes(dir.resolve("documents/u1/b.pdf")));
    }

    @Test
    void ghi_de_thay_noi_dung_va_khong_con_tep_tam() throws IOException {
        put("documents/u1/a.pdf", data(500));
        byte[] newer = data(70_000);
        put("documents/u1/a.pdf", newer);
        assertThat(read(store.open("documents/u1/a.pdf"))).isEqualTo(newer);
        try (Stream<Path> tmp = Files.list(dir.resolve(".tmp"))) {
            assertThat(tmp.toList()).isEmpty();
        }
    }

    // ---- đọc theo khoảng ----

    @ParameterizedTest
    @ValueSource(
            longs = {
                0,
                1,
                100,
                BLOCK - 2,
                BLOCK - 1,
                BLOCK,
                BLOCK + 1,
                2L * BLOCK - 1,
                2L * BLOCK,
                3L * BLOCK + 16
            })
    void doc_khoang_dung_tai_cac_bien_khoi(long start) throws IOException {
        int size = 3 * BLOCK + 17;
        byte[] original = data(size);
        put("documents/u1/r.pdf", original);
        for (long end : new long[] {start, start + 1, start + BLOCK, size - 1L}) {
            if (end >= size || end < start) {
                continue;
            }
            byte[] got = read(store.openRange("documents/u1/r.pdf", start, end));
            assertThat(got)
                    .as("dải %d-%d", start, end)
                    .isEqualTo(Arrays.copyOfRange(original, (int) start, (int) end + 1));
        }
    }

    @Test
    void doc_byte_cuoi_va_byte_dau() throws IOException {
        byte[] original = data(BLOCK + 5);
        put("documents/u1/r.pdf", original);
        assertThat(read(store.openRange("documents/u1/r.pdf", BLOCK + 4, BLOCK + 4)))
                .containsExactly(original[BLOCK + 4]);
        assertThat(read(store.openRange("documents/u1/r.pdf", 0, 0))).containsExactly(original[0]);
    }

    @Test
    void doc_khoang_chi_giai_ma_cac_khoi_can_thiet() throws IOException {
        // Làm hỏng khối cuối: đọc dải nằm hoàn toàn ở khối đầu vẫn thành công, dải chạm khối cuối
        // thì lỗi
        int size = 3 * BLOCK;
        byte[] original = data(size);
        put("documents/u1/r.pdf", original);
        Path file = dir.resolve("documents/u1/r.pdf");
        flip(
                file,
                LocalEncryptedFileStore.HEADER + 2L * (BLOCK + LocalEncryptedFileStore.TAG) + 10);

        assertThat(read(store.openRange("documents/u1/r.pdf", 5, 1000)))
                .isEqualTo(Arrays.copyOfRange(original, 5, 1001));
        assertThatThrownBy(
                        () ->
                                read(
                                        store.openRange(
                                                "documents/u1/r.pdf", 2L * BLOCK, 2L * BLOCK + 5)))
                .isInstanceOf(IOException.class);
    }

    @Test
    void dai_khong_hop_le_bi_tu_choi() throws IOException {
        put("documents/u1/r.pdf", data(100));
        assertThatThrownBy(() -> store.openRange("documents/u1/r.pdf", -1, 5))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.openRange("documents/u1/r.pdf", 10, 5))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.openRange("documents/u1/r.pdf", 0, 100))
                .isInstanceOf(IllegalArgumentException.class);
        put("documents/u1/empty.pdf", new byte[0]);
        assertThatThrownBy(() -> store.openRange("documents/u1/empty.pdf", 0, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ---- phát hiện sửa, cắt, sai khóa ----

    @Test
    void sua_mot_byte_cua_noi_dung_bi_phat_hien() throws IOException {
        put("documents/u1/t.pdf", data(1000));
        flip(dir.resolve("documents/u1/t.pdf"), LocalEncryptedFileStore.HEADER + 50);
        assertThatThrownBy(() -> read(store.open("documents/u1/t.pdf")))
                .isInstanceOf(IOException.class);
    }

    @Test
    void sua_tieu_de_hoac_do_dai_bi_phat_hien() throws IOException {
        put("documents/u1/t.pdf", data(1000));
        Path f = dir.resolve("documents/u1/t.pdf");
        flip(f, 30); // byte trong trường độ dài
        assertThatThrownBy(() -> store.size("documents/u1/t.pdf")).isInstanceOf(IOException.class);
        put("documents/u1/m.pdf", data(1000));
        flip(dir.resolve("documents/u1/m.pdf"), 0); // MAGIC
        assertThatThrownBy(() -> store.size("documents/u1/m.pdf")).isInstanceOf(IOException.class);
    }

    @Test
    void tep_bi_cat_hoac_noi_them_bi_phat_hien() throws IOException {
        put("documents/u1/c.pdf", data(3 * BLOCK));
        Path f = dir.resolve("documents/u1/c.pdf");
        try (RandomAccessFile raf = new RandomAccessFile(f.toFile(), "rw")) {
            raf.setLength(raf.length() - 1);
        }
        assertThatThrownBy(() -> store.open("documents/u1/c.pdf")).isInstanceOf(IOException.class);

        put("documents/u1/d.pdf", data(100));
        Files.write(
                dir.resolve("documents/u1/d.pdf"),
                new byte[] {1, 2, 3},
                java.nio.file.StandardOpenOption.APPEND);
        assertThatThrownBy(() -> store.open("documents/u1/d.pdf")).isInstanceOf(IOException.class);
    }

    @Test
    void doi_cho_hai_khoi_bi_phat_hien() throws IOException {
        put("documents/u1/s.pdf", data(2 * BLOCK));
        Path f = dir.resolve("documents/u1/s.pdf");
        byte[] all = Files.readAllBytes(f);
        int cipherBlock = BLOCK + LocalEncryptedFileStore.TAG;
        int h = LocalEncryptedFileStore.HEADER;
        byte[] swapped = all.clone();
        System.arraycopy(all, h + cipherBlock, swapped, h, cipherBlock);
        System.arraycopy(all, h, swapped, h + cipherBlock, cipherBlock);
        Files.write(f, swapped);
        assertThatThrownBy(() -> read(store.open("documents/u1/s.pdf")))
                .isInstanceOf(IOException.class);
    }

    @Test
    void sai_khoa_giai_ma_khong_doc_duoc() throws IOException {
        put("documents/u1/k.pdf", data(1000));
        LocalEncryptedFileStore other = new LocalEncryptedFileStore(dir, key(2));
        assertThatThrownBy(() -> read(other.open("documents/u1/k.pdf")))
                .isInstanceOf(IOException.class);
    }

    @Test
    void khoa_ma_hoa_phai_dung_32_byte() {
        assertThatThrownBy(() -> new LocalEncryptedFileStore(dir, new byte[16]))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ---- khóa lưu trữ an toàn ----

    @ParameterizedTest
    @ValueSource(
            strings = {
                "", "../x", "documents/../../x", "/etc/passwd", "documents//a.pdf",
                        "documents/a b.pdf",
                "documents/.hidden", ".tmp/x", "documents\\a.pdf", "a/./b", "documents/a..b",
                        "../../x.pdf",
                "documents/tên-tệp-gốc.pdf"
            })
    void khoa_khong_hop_le_bi_tu_choi(String badKey) {
        assertThatThrownBy(() -> put(badKey, data(10)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.size(badKey)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> store.delete(badKey)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void khoa_hop_le_theo_quy_uoc_he_thong() throws IOException {
        put(
                "documents/0197a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b/0197a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c.pdf",
                data(10));
        assertThat(
                        store.size(
                                "documents/0197a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b/0197a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c.pdf"))
                .isEqualTo(10);
    }

    // ---- ghi nguyên tử, xóa, kiểm tra ----

    @Test
    void loi_giua_chung_khong_de_lai_tep_do_hay_tep_tam_va_giu_ban_cu() throws IOException {
        byte[] old = data(1000);
        put("documents/u1/a.pdf", old);

        InputStream failing =
                new InputStream() {
                    private int n;

                    @Override
                    public int read() throws IOException {
                        throw new IOException("mất kết nối giữa chừng");
                    }

                    @Override
                    public int read(byte[] b, int off, int len) throws IOException {
                        if (n++ == 0) {
                            Arrays.fill(b, off, off + len, (byte) 7);
                            return len;
                        }
                        throw new IOException("mất kết nối giữa chừng");
                    }
                };
        assertThatThrownBy(() -> store.put("documents/u1/a.pdf", failing))
                .isInstanceOf(IOException.class);

        assertThat(read(store.open("documents/u1/a.pdf"))).isEqualTo(old); // bản cũ còn nguyên
        try (Stream<Path> tmp = Files.list(dir.resolve(".tmp"))) {
            assertThat(tmp.toList()).isEmpty();
        }
        assertThatThrownBy(() -> store.put("documents/u1/new.pdf", failing))
                .isInstanceOf(IOException.class);
        assertThat(Files.exists(dir.resolve("documents/u1/new.pdf"))).isFalse();
    }

    @Test
    void xoa_la_idempotent() throws IOException {
        put("documents/u1/a.pdf", data(10));
        assertThat(store.delete("documents/u1/a.pdf")).isTrue();
        assertThat(store.delete("documents/u1/a.pdf")).isFalse();
        assertThatThrownBy(() -> store.size("documents/u1/a.pdf"))
                .isInstanceOf(NoSuchFileException.class);
        assertThatThrownBy(() -> store.open("documents/u1/a.pdf"))
                .isInstanceOf(NoSuchFileException.class);
    }

    @Test
    void ghi_duoc_la_true_khi_thu_muc_ghi_duoc() {
        assertThat(store.isWritable()).isTrue();
    }

    @Test
    void ghi_nhieu_tep_dong_thoi_khong_lan_noi_dung() throws Exception {
        List<Thread> threads =
                java.util.stream.IntStream.range(0, 8)
                        .mapToObj(
                                i ->
                                        new Thread(
                                                () -> {
                                                    try {
                                                        put(
                                                                "documents/u1/c" + i + ".pdf",
                                                                data(1000 + i));
                                                    } catch (IOException e) {
                                                        throw new IllegalStateException(e);
                                                    }
                                                }))
                        .toList();
        threads.forEach(Thread::start);
        for (Thread t : threads) {
            t.join();
        }
        for (int i = 0; i < 8; i++) {
            assertThat(read(store.open("documents/u1/c" + i + ".pdf"))).isEqualTo(data(1000 + i));
        }
    }

    // ---- tiện ích ----

    private static void flip(Path file, long position) throws IOException {
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "rw")) {
            raf.seek(position);
            int b = raf.read();
            raf.seek(position);
            raf.write(b ^ 0x01);
        }
    }

    private static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    continue outer;
                }
            }
            return i;
        }
        return -1;
    }
}
