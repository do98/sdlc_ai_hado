package vn.docchat.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.docchat.service.AuthProperties;

/**
 * Chống CSRF cho yêu cầu làm thay đổi dữ liệu (POST/PUT/PATCH/DELETE) trên {@code /api/**}, kết hợp
 * cookie {@code SameSite}:
 *
 * <ul>
 *   <li>{@code Sec-Fetch-Site} là {@code cross-site}/{@code same-site} → từ chối.
 *   <li>{@code Origin} có mặt → phải thuộc {@code allowed-origins}; nếu danh sách rỗng thì phải
 *       trùng scheme/host/port của yêu cầu. {@code Origin: null} bị từ chối.
 *   <li>Không có cả hai (client không phải trình duyệt, ví dụ công cụ dòng lệnh/test) → cho qua;
 *       vẫn cần cookie phiên hợp lệ cho mọi API ngoại trừ đăng nhập.
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class OriginCheckFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final AuthProperties props;
    private final ApiErrorWriter errors;

    public OriginCheckFilter(AuthProperties props, ApiErrorWriter errors) {
        this.props = props;
        this.errors = errors;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/")
                || SAFE_METHODS.contains(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!allowed(request)) {
            errors.write(request, response, 403, "CSRF_REJECTED", "Request origin not allowed.");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean allowed(HttpServletRequest request) {
        String site = request.getHeader("Sec-Fetch-Site");
        if (site != null && !site.equals("same-origin") && !site.equals("none")) {
            return false;
        }
        String origin = request.getHeader("Origin");
        if (origin == null) {
            return true;
        }
        List<String> configured = props.allowedOrigins();
        if (!configured.isEmpty()) {
            return configured.contains(origin);
        }
        return origin.equals(selfOrigin(request));
    }

    static String selfOrigin(HttpServletRequest request) {
        String scheme = request.getScheme();
        int port = request.getServerPort();
        boolean defaultPort =
                ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
        return scheme + "://" + request.getServerName() + (defaultPort ? "" : ":" + port);
    }
}
