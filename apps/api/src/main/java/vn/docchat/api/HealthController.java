package vn.docchat.api;

import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.docchat.service.ReadinessService;

@RestController
@RequestMapping("/api")
public class HealthController {

    public record Readiness(String status, Map<String, String> checks) {}

    private final ReadinessService readiness;

    public HealthController(ReadinessService readiness) {
        this.readiness = readiness;
    }

    /** Tiến trình còn sống (không kiểm tra thành phần phụ thuộc). */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(Map.of("status", "UP"));
    }

    /** CSDL và thư mục lưu tệp; 503 nếu một trong hai lỗi. */
    @GetMapping("/ready")
    public ResponseEntity<Readiness> ready() {
        ReadinessService.Result r = readiness.check();
        Readiness body =
                new Readiness(
                        r.up() ? "UP" : "DOWN",
                        Map.of(
                                "database",
                                r.database() ? "UP" : "DOWN",
                                "storage",
                                r.storage() ? "UP" : "DOWN"));
        return ResponseEntity.status(r.up() ? 200 : 503)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body);
    }
}
