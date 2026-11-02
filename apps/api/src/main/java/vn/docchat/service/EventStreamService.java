package vn.docchat.service;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.docchat.domain.WorkspaceEvent;
import vn.docchat.repository.EventRepository;

/**
 * Phát sự kiện workspace tới mọi kết nối SSE đang mở (IF-06). Mỗi kết nối nhớ {@code seq} cuối đã
 * gửi; mỗi lần được đánh thức hoặc tới nhịp heartbeat, kết nối đọc các sự kiện có seq lớn hơn từ
 * CSDL nên không bao giờ bỏ sót, kể cả khi nhiều thay đổi dồn lại. Nối lại với {@code
 * Last-Event-ID} thì phát bù; quá cũ hoặc quá nhiều → {@code resync}.
 */
@Service
public class EventStreamService {

    private static final Logger log = LoggerFactory.getLogger(EventStreamService.class);

    private final class Subscriber {
        final EventSink sink;
        long lastSeq;

        Subscriber(EventSink sink, long lastSeq) {
            this.sink = sink;
            this.lastSeq = lastSeq;
        }

        /** Mỗi kết nối chỉ một luồng gửi tại một thời điểm: giữ đúng thứ tự. */
        synchronized void drain() {
            try {
                while (true) {
                    List<WorkspaceEvent> batch = events.findAfter(lastSeq, 200);
                    if (batch.isEmpty()) {
                        return;
                    }
                    for (WorkspaceEvent e : batch) {
                        sink.send(e.seq(), e.type(), e.payloadJson());
                        lastSeq = e.seq();
                    }
                }
            } catch (IOException e) {
                drop(this); // máy khách đã đi
            } catch (RuntimeException e) {
                log.warn("Lỗi khi phát sự kiện cho một kết nối", e);
                drop(this);
            }
        }
    }

    private final EventRepository events;
    private final EventsProperties props;
    private final Clock clock;
    private final Set<Subscriber> subscribers = ConcurrentHashMap.newKeySet();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public EventStreamService(EventRepository events, EventsProperties props, Clock clock) {
        this.events = events;
        this.props = props;
        this.clock = clock;
    }

    /**
     * Đăng ký một kết nối. {@code lastEventId} null: kết nối mới, chỉ nhận từ giờ trở đi. Có giá
     * trị: phát bù những gì đã lỡ, hoặc gửi {@code resync} nếu không thể bù đủ.
     *
     * @return hàm hủy đăng ký (gọi khi kết nối đóng)
     */
    public Runnable subscribe(EventSink sink, Long lastEventId) {
        long start;
        boolean resync = false;
        if (lastEventId == null) {
            start = events.maxSeq();
        } else {
            long max = events.maxSeq();
            long oldest = events.minSeq().orElse(max + 1);
            boolean tooOld = lastEventId + 1 < oldest && lastEventId < max;
            boolean fromFuture = lastEventId > max;
            boolean tooMany = !tooOld && events.countAfter(lastEventId) > props.historyLimit();
            if (tooOld || fromFuture || tooMany) {
                resync = true;
                start = max;
            } else {
                start = lastEventId;
            }
        }
        Subscriber sub = new Subscriber(sink, start);
        subscribers.add(sub);
        boolean needResync = resync;
        executor.execute(
                () -> {
                    synchronized (sub) {
                        if (needResync) {
                            try {
                                sink.send(null, "resync", "{}");
                            } catch (IOException e) {
                                drop(sub);
                                return;
                            }
                        }
                        sub.drain();
                    }
                });
        return () -> subscribers.remove(sub);
    }

    /** Gọi sau khi một giao dịch có ghi sự kiện đã commit. */
    public void wake() {
        for (Subscriber s : subscribers) {
            executor.execute(s::drain);
        }
    }

    public int connectionCount() {
        return subscribers.size();
    }

    private void drop(Subscriber s) {
        if (subscribers.remove(s)) {
            s.sink.close();
        }
    }

    /** Nhịp tim: giữ kết nối không bị proxy cắt, bắt kịp sự kiện lỡ, đóng kết nối hết phiên. */
    @Scheduled(fixedDelayString = "${docchat.events.heartbeat:PT15S}")
    void heartbeat() {
        for (Subscriber s : subscribers) {
            executor.execute(
                    () -> {
                        if (!s.sink.sessionStillValid()) {
                            drop(s);
                            return;
                        }
                        try {
                            synchronized (s) {
                                s.sink.ping();
                            }
                        } catch (IOException e) {
                            drop(s);
                            return;
                        }
                        s.drain();
                    });
        }
    }

    /** Dọn sự kiện quá hạn lưu giữ. */
    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1M")
    void purge() {
        int n = events.deleteOlderThan(Instant.now(clock).minus(props.retention()));
        if (n > 0) {
            log.info("Đã dọn {} sự kiện cũ", n);
        }
    }
}
