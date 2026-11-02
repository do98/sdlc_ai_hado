package vn.docchat.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.ErrorCode;
import vn.docchat.domain.User;
import vn.docchat.service.DocumentQueryService;
import vn.docchat.service.DocumentUploadService;

@RestController
@RequestMapping("/api")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    public record UploadAccepted(UUID id, String status) {}

    public record DocumentItem(
            UUID id,
            String name,
            long sizeBytes,
            Integer pageCount,
            String status,
            String errorCode,
            JsonNode warning,
            UUID uploadedBy,
            Instant uploadedAt) {}

    public record DocumentList(List<DocumentItem> items, int count, int limit) {}

    private final DocumentUploadService uploads;
    private final DocumentQueryService queries;
    private final ObjectMapper json;

    public DocumentController(
            DocumentUploadService uploads, DocumentQueryService queries, ObjectMapper json) {
        this.uploads = uploads;
        this.queries = queries;
        this.json = json;
    }

    /** IF-02: tài liệu của workspace, mới nhất trước, không gồm tài liệu đã xóa. */
    @GetMapping("/documents")
    public ResponseEntity<DocumentList> list() {
        DocumentQueryService.Listing l = queries.list();
        List<DocumentItem> items =
                l.items().stream()
                        .map(
                                d ->
                                        new DocumentItem(
                                                d.id(),
                                                d.name(),
                                                d.sizeBytes(),
                                                d.pageCount(),
                                                d.status().name(),
                                                d.errorCode(),
                                                parseWarning(d.warningJson()),
                                                d.uploadedBy(),
                                                d.uploadedAt()))
                        .toList();
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new DocumentList(items, items.size(), l.limit()));
    }

    private JsonNode parseWarning(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return json.readTree(raw);
        } catch (IOException e) {
            log.error("Cột warning không phải JSON hợp lệ", e);
            return null;
        }
    }

    /**
     * IF-03: một tệp mỗi yêu cầu (trường {@code file}); xử lý nền diễn ra sau, kết quả báo qua
     * IF-06.
     */
    @PostMapping(path = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadAccepted> upload(
            @RequestPart("file") MultipartFile file, HttpServletRequest request) {
        User user = SessionAuthFilter.currentUser(request);
        DocumentUploadService.Accepted accepted;
        try (InputStream in = file.getInputStream()) {
            accepted = uploads.upload(user, file.getOriginalFilename(), in);
        } catch (IOException e) {
            log.error("Không đọc được tệp tải lên", e);
            throw new ApiException(ErrorCode.INTERNAL);
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new UploadAccepted(accepted.id(), accepted.status().name()));
    }
}
