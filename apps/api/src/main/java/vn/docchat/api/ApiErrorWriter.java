package vn.docchat.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

/** Ghi thân lỗi JSON từ nơi không đi qua controller (bộ lọc). */
@Component
public class ApiErrorWriter {

    private final ObjectMapper mapper;

    public ApiErrorWriter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void write(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            String code,
            String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Cache-Control", "no-store");
        mapper.writeValue(
                response.getOutputStream(),
                new ApiError(code, message, RequestIdFilter.traceId(request)));
    }
}
