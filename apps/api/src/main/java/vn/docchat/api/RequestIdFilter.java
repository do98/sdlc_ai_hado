package vn.docchat.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gán {@code X-Request-Id} (nhận từ client nếu hợp lệ, nếu không thì sinh mới) vào phản hồi, log
 * (MDC) và lỗi.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    static final String ATTRIBUTE = "docchat.traceId";
    private static final Pattern SAFE = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    public static String traceId(HttpServletRequest request) {
        Object v = request.getAttribute(ATTRIBUTE);
        return v == null ? null : v.toString();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String id =
                incoming != null && SAFE.matcher(incoming).matches()
                        ? incoming
                        : UUID.randomUUID().toString();
        request.setAttribute(ATTRIBUTE, id);
        response.setHeader(HEADER, id);
        MDC.put("traceId", id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("traceId");
        }
    }
}
