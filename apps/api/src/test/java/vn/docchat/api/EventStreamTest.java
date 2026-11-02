package vn.docchat.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.support.TransactionTemplate;
import vn.docchat.domain.Role;
import vn.docchat.service.DocumentEventService;
import vn.docchat.service.EventStreamService;
import vn.docchat.support.PostgresTestBase;

/**
 * T09 — GET /api/events (IF-06) qua HTTP thật: id tăng dần, phát bù theo Last-Event-ID, resync,
 * rollback không phát, heartbeat, nhiều kết nối, giải phóng khi đóng, đóng khi hết phiên.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
            "docchat.auth.login-rate-limit-per-minute=100000",
            "docchat.events.heartbeat=PT1S",
            "docchat.events.history-limit=5"
        })
class EventStreamTest extends PostgresTestBase {

    @LocalServerPort int port;
    @Autowired DocumentEventService documentEvents;
    @Autowired EventStreamService stream;
    @Autowired TransactionTemplate tx;

    private final HttpClient http = HttpClient.newHttpClient();
    private final List<Sse> open = new ArrayList<>();
    private String cookie;
    private UUID userId;

    /** Một sự kiện SSE đã đọc: {@code type} là ":ping" cho chú thích heartbeat. */
    record Ev(String id, String type, String data) {}

    /** Máy khách SSE tối giản: đọc từng dòng trên một luồng riêng, đẩy vào hàng đợi. */
    final class Sse {
        final BlockingQueue<Ev> events = new LinkedBlockingQueue<>();
        volatile boolean ended;
        volatile HttpResponse<java.util.stream.Stream<String>> response;
        volatile int status;
        private final Thread reader;

        Sse(String cookieHeader, String lastEventId) throws Exception {
            HttpRequest.Builder b =
                    HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/events"))
                            .header("Accept", "text/event-stream");
            if (cookieHeader != null) {
                b.header("Cookie", cookieHeader);
            }
            if (lastEventId != null) {
                b.header("Last-Event-ID", lastEventId);
            }
            response = http.send(b.build(), HttpResponse.BodyHandlers.ofLines());
            status = response.statusCode();
            reader =
                    Thread.ofVirtual()
                            .start(
                                    () -> {
                                        String id = null;
                                        String type = null;
                                        StringBuilder data = new StringBuilder();
                                        try {
                                            for (java.util.Iterator<String> it =
                                                            response.body().iterator();
                                                    it.hasNext(); ) {
                                                String line = it.next();
                                                if (line.isEmpty()) {
                                                    if (type != null) {
                                                        // jsonb thêm khoảng trắng và đổi thứ tự
                                                        // khóa:
                                                        // bỏ khoảng trắng, so sánh theo từng trường
                                                        events.add(
                                                                new Ev(
                                                                        id,
                                                                        type,
                                                                        data.toString()
                                                                                .replace(" ", "")));
                                                    }
                                                    id = null;
                                                    type = null;
                                                    data.setLength(0);
                                                } else if (line.startsWith(":")) {
                                                    events.add(new Ev(null, ":ping", line));
                                                } else if (line.startsWith("id:")) {
                                                    id = line.substring(3).trim();
                                                } else if (line.startsWith("event:")) {
                                                    type = line.substring(6).trim();
                                                } else if (line.startsWith("data:")) {
                                                    data.append(line.substring(5).trim());
                                                }
                                            }
                                        } catch (RuntimeException e) {
                                            // luồng bị đóng từ phía test
                                        } finally {
                                            ended = true;
                                        }
                                    });
            open.add(this);
        }

        /** Chờ sự kiện dữ liệu kế tiếp, bỏ qua heartbeat. */
        Ev next() throws InterruptedException {
            long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
            while (System.nanoTime() < end) {
                Ev e = events.poll(200, TimeUnit.MILLISECONDS);
                if (e != null && !e.type().equals(":ping")) {
                    return e;
                }
            }
            throw new AssertionError("Không nhận được sự kiện trong 10 giây");
        }

        Ev nextIncludingPing() throws InterruptedException {
            Ev e = events.poll(10, TimeUnit.SECONDS);
            assertThat(e).as("sự kiện/heartbeat trong 10 giây").isNotNull();
            return e;
        }

        void assertNoMoreData() throws InterruptedException {
            Thread.sleep(700);
            for (Ev e : events) {
                assertThat(e.type()).as("không còn sự kiện dữ liệu").isEqualTo(":ping");
            }
        }

        void close() {
            try {
                response.body().close();
            } catch (RuntimeException ignored) {
                // đã đóng
            }
        }
    }

    @BeforeEach
    void login() throws Exception {
        createUser("minh", PASSWORD, Role.MEMBER);
        userId = jdbc.queryForObject("SELECT id FROM users WHERE username='minh'", UUID.class);
        HttpResponse<String> r =
                http.send(
                        HttpRequest.newBuilder(
                                        URI.create("http://localhost:" + port + "/api/auth/login"))
                                .header("Content-Type", "application/json")
                                .POST(
                                        HttpRequest.BodyPublishers.ofString(
                                                "{\"username\":\"minh\",\"password\":\""
                                                        + PASSWORD
                                                        + "\"}"))
                                .build(),
                        HttpResponse.BodyHandlers.ofString());
        assertThat(r.statusCode()).isEqualTo(204);
        cookie =
                r.headers().allValues("set-cookie").stream()
                        .filter(c -> c.startsWith("DOCCHAT_SESSION="))
                        .map(c -> c.substring(0, c.indexOf(';')))
                        .findFirst()
                        .orElseThrow();
    }

    @AfterEach
    void closeAll() {
        open.forEach(Sse::close);
        open.clear();
    }

    // ---------------------------------------------------------------- tiện ích

    private UUID newDoc(String status) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                "INSERT INTO documents (id,name,size_bytes,status,storage_key,uploaded_by) VALUES (?,?,?,?,?,?)",
                id,
                "bi-mat-hop-dong.pdf",
                10,
                status,
                "k/" + id,
                userId);
        return id;
    }

    /** Đổi trạng thái và ghi sự kiện trong MỘT giao dịch, như T08 sẽ làm. */
    private void change(UUID id, String status) {
        tx.executeWithoutResult(
                s -> {
                    jdbc.update("UPDATE documents SET status = ? WHERE id = ?", status, id);
                    documentEvents.documentChanged(id);
                });
    }

    private long maxSeq() {
        return jdbc.queryForObject("SELECT COALESCE(max(seq),0) FROM events", Long.class);
    }

    // ---------------------------------------------------------------- kết nối

    @Test
    void T09_chua_dang_nhap_tra_401_truoc_khi_mo_luong() throws Exception {
        Sse s = new Sse(null, null);
        assertThat(s.status).isEqualTo(401);
        assertThat(s.response.headers().firstValue("content-type").orElse(""))
                .doesNotContain("event-stream");
    }

    @Test
    void T09_header_khong_dem_va_dung_content_type() throws Exception {
        Sse s = new Sse(cookie, null);
        assertThat(s.status).isEqualTo(200);
        assertThat(s.response.headers().firstValue("content-type").orElse(""))
                .startsWith("text/event-stream");
        assertThat(s.response.headers().firstValue("x-accel-buffering")).contains("no");
        assertThat(s.response.headers().firstValue("cache-control").orElse(""))
                .contains("no-cache");
    }

    // ---------------------------------------------------------------- phát trực tiếp

    @Test
    void T09_nhan_document_updated_truc_tiep_voi_id_tang_dan_va_khong_co_ten_tep()
            throws Exception {
        Sse s = new Sse(cookie, null);
        UUID id = newDoc("PROCESSING");
        change(id, "PROCESSING");
        change(id, "READY");

        Ev a = s.next();
        Ev b = s.next();
        assertThat(a.type()).isEqualTo("document.updated");
        assertThat(Long.parseLong(b.id())).isGreaterThan(Long.parseLong(a.id()));
        assertThat(a.data())
                .contains("\"id\":\"" + id + "\"")
                .contains("\"status\":\"PROCESSING\"")
                .contains("\"errorCode\":null")
                .contains("\"warning\":null")
                .contains("\"pageCount\":null")
                .doesNotContain("bi-mat");
        assertThat(b.data()).contains("\"status\":\"READY\"");
    }

    @Test
    void T09_warning_va_errorCode_di_theo_su_kien() throws Exception {
        UUID id = newDoc("PROCESSING");
        Sse s = new Sse(cookie, null);
        tx.executeWithoutResult(
                t -> {
                    jdbc.update(
                            "UPDATE documents SET status='READY', page_count=10, warning=CAST(? AS jsonb) WHERE id=?",
                            "{\"code\":\"UNREADABLE_PAGES\",\"pages\":[3,7]}",
                            id);
                    documentEvents.documentChanged(id);
                });
        assertThat(s.next().data())
                .contains("\"warning\":{\"code\":\"UNREADABLE_PAGES\",\"pages\":[3,7]}")
                .contains("\"pageCount\":10");
        UUID bad = newDoc("PROCESSING");
        tx.executeWithoutResult(
                t -> {
                    jdbc.update(
                            "UPDATE documents SET status='ERROR', error_code='CORRUPT' WHERE id=?",
                            bad);
                    documentEvents.documentChanged(bad);
                });
        assertThat(s.next().data())
                .contains("\"status\":\"ERROR\"")
                .contains("\"errorCode\":\"CORRUPT\"");
    }

    @Test
    void T09_giao_dich_bi_lui_thi_khong_co_su_kien() throws Exception {
        UUID id = newDoc("PROCESSING");
        Sse s = new Sse(cookie, null);
        long before = maxSeq();
        try {
            tx.executeWithoutResult(
                    t -> {
                        documentEvents.documentChanged(id);
                        throw new IllegalStateException("lùi");
                    });
        } catch (IllegalStateException expected) {
            // mong đợi
        }
        assertThat(maxSeq()).isEqualTo(before);
        s.assertNoMoreData();
    }

    // ---------------------------------------------------------------- nối lại không lỡ

    @Test
    void T09_ngat_tao_3_thay_doi_noi_lai_voi_Last_Event_ID_nhan_du_3_dung_thu_tu()
            throws Exception {
        UUID id = newDoc("PROCESSING");
        Sse first = new Sse(cookie, null);
        change(id, "PROCESSING");
        Ev seen = first.next();
        first.close(); // mất kết nối

        change(id, "PROCESSING");
        change(id, "READY");
        change(id, "READY");

        Sse again = new Sse(cookie, seen.id());
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            ids.add(Long.parseLong(again.next().id()));
        }
        assertThat(ids).isSorted().doesNotHaveDuplicates();
        assertThat(ids.get(0)).isGreaterThan(Long.parseLong(seen.id()));
        again.assertNoMoreData();
    }

    @Test
    void T09_id_qua_cu_thi_resync_roi_chi_nhan_su_kien_moi() throws Exception {
        UUID id = newDoc("PROCESSING");
        for (int i = 0; i < 3; i++) {
            change(id, "PROCESSING");
        }
        // lịch sử đã bị dọn mất phần đầu
        jdbc.update("DELETE FROM events WHERE seq < (SELECT max(seq) FROM events)");
        long max = maxSeq();

        Sse s = new Sse(cookie, "1");
        Ev r = s.next();
        assertThat(r.type()).isEqualTo("resync");
        assertThat(r.id()).isNull();
        assertThat(r.data()).isEqualTo("{}");

        change(id, "READY");
        Ev e = s.next();
        assertThat(e.type()).isEqualTo("document.updated");
        assertThat(Long.parseLong(e.id())).isGreaterThan(max);
    }

    @Test
    void T09_Last_Event_ID_tu_tuong_lai_hoac_qua_nhieu_su_kien_thi_resync() throws Exception {
        UUID id = newDoc("PROCESSING");
        for (int i = 0; i < 8; i++) { // history-limit = 5
            change(id, "PROCESSING");
        }
        long first = jdbc.queryForObject("SELECT min(seq) FROM events", Long.class);

        assertThat(new Sse(cookie, "999999999").next().type()).isEqualTo("resync");
        assertThat(new Sse(cookie, String.valueOf(first - 1)).next().type()).isEqualTo("resync");
        // vừa đủ trong giới hạn: phát bù, không resync
        long recent = maxSeq() - 5;
        Sse ok = new Sse(cookie, String.valueOf(recent));
        assertThat(ok.next().type()).isEqualTo("document.updated");
    }

    @Test
    void T09_Last_Event_ID_rac_duoc_coi_nhu_ket_noi_moi() throws Exception {
        Sse s = new Sse(cookie, "khong-phai-so");
        assertThat(s.status).isEqualTo(200);
        UUID id = newDoc("PROCESSING");
        change(id, "READY");
        assertThat(s.next().type()).isEqualTo("document.updated");
    }

    // ---------------------------------------------------------------- heartbeat, nhiều người xem,
    // rò rỉ

    @Test
    void T09_heartbeat_ping_dinh_ky() throws Exception {
        Sse s = new Sse(cookie, null);
        // chú thích đầu tiên (":connected") đẩy header xuống máy khách; sau đó là nhịp tim định kỳ
        Ev first = s.nextIncludingPing();
        assertThat(first.data()).isEqualTo(":connected");
        Ev beat = s.nextIncludingPing();
        assertThat(beat.data()).isEqualTo(":ping");
        assertThat(s.nextIncludingPing().data()).isEqualTo(":ping");
    }

    @Test
    void T09_20_ket_noi_cung_nhan_su_kien_va_dong_het_thi_khong_ro() throws Exception {
        waitConnections(0); // kết nối còn sót của test trước được giải phóng
        int base = 0;
        List<Sse> viewers = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            viewers.add(new Sse(cookie, null));
        }
        waitConnections(base + 20);

        UUID id = newDoc("PROCESSING");
        change(id, "READY");
        String expectedId = null;
        for (Sse v : viewers) {
            Ev e = v.next();
            assertThat(e.type()).isEqualTo("document.updated");
            if (expectedId == null) {
                expectedId = e.id();
            }
            assertThat(e.id()).isEqualTo(expectedId); // mọi người nhận cùng một sự kiện
        }

        viewers.forEach(Sse::close);
        waitConnections(base); // heartbeat 1 giây phát hiện kết nối đã đóng và giải phóng
    }

    private void waitConnections(int expected) throws InterruptedException {
        Instant end = Instant.now().plus(Duration.ofSeconds(15));
        while (Instant.now().isBefore(end)) {
            if (stream.connectionCount() == expected) {
                return;
            }
            Thread.sleep(100);
        }
        assertThat(stream.connectionCount()).isEqualTo(expected);
    }

    // ---------------------------------------------------------------- hết phiên

    @Test
    void T09_het_phien_thi_luong_bi_dong_o_nhip_tim_ke_tiep() throws Exception {
        Sse s = new Sse(cookie, null);
        clock.set(T0.plus(Duration.ofHours(9))); // quá hạn tuyệt đối 8 giờ
        Instant end = Instant.now().plus(Duration.ofSeconds(10));
        while (!s.ended && Instant.now().isBefore(end)) {
            Thread.sleep(100);
        }
        assertThat(s.ended).as("luồng đã được máy chủ đóng").isTrue();
        // nối lại: không còn phiên hợp lệ → 401 để FE chuyển về đăng nhập
        assertThat(new Sse(cookie, null).status).isEqualTo(401);
    }

    @Test
    void T09_su_kien_ghi_trong_giao_dich_di_qua_kenh() throws Exception {
        Sse s = new Sse(cookie, null);
        UUID id = newDoc("PROCESSING");
        tx.executeWithoutResult(t -> documentEvents.documentChanged(id));
        assertThat(s.next().data()).contains(id.toString());
    }
}
