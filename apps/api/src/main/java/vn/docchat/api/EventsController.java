package vn.docchat.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import vn.docchat.service.AuthProperties;
import vn.docchat.service.AuthService;
import vn.docchat.service.EventSink;
import vn.docchat.service.EventStreamService;

/** IF-06: luồng cập nhật trạng thái tài liệu của workspace (xem api/sse-events.md). */
@RestController
@RequestMapping("/api")
public class EventsController {

    private final EventStreamService stream;
    private final AuthService auth;
    private final AuthProperties authProps;

    public EventsController(EventStreamService stream, AuthService auth, AuthProperties authProps) {
        this.stream = stream;
        this.auth = auth;
        this.authProps = authProps;
    }

    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            HttpServletRequest request,
            HttpServletResponse response) {
        // Proxy không được đệm luồng; Cache-Control: no-cache do SseEmitter/Spring đặt thêm
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");

        String token = SessionAuthFilter.sessionToken(request, authProps.cookieName());
        SseEmitter emitter = new SseEmitter(0L); // không hết hạn; phiên được kiểm lại mỗi nhịp tim
        EventSink sink =
                new EventSink() {
                    @Override
                    public void send(Long id, String type, String dataJson) throws IOException {
                        SseEmitter.SseEventBuilder b = SseEmitter.event().name(type).data(dataJson);
                        if (id != null) {
                            b.id(Long.toString(id));
                        }
                        emitter.send(b);
                    }

                    @Override
                    public void ping() throws IOException {
                        emitter.send(SseEmitter.event().comment("ping"));
                    }

                    @Override
                    public boolean sessionStillValid() {
                        return auth.authenticate(token).isPresent();
                    }

                    @Override
                    public void close() {
                        emitter.complete();
                    }
                };

        // Gửi ngay một chú thích để đẩy header 200 xuống máy khách, không phải đợi nhịp tim đầu
        // tiên
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        Runnable unsubscribe = stream.subscribe(sink, parse(lastEventId));
        emitter.onCompletion(unsubscribe);
        emitter.onTimeout(unsubscribe);
        emitter.onError(e -> unsubscribe.run());
        return emitter;
    }

    private static Long parse(String header) {
        if (header == null || header.isBlank()) {
            return null;
        }
        try {
            long v = Long.parseLong(header.trim());
            return v < 0 ? null : v;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
