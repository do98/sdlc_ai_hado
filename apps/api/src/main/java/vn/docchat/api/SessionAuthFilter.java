package vn.docchat.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.docchat.domain.User;
import vn.docchat.service.AuthProperties;
import vn.docchat.service.AuthService;

/**
 * Mọi route dưới {@code /api/} đều yêu cầu phiên hợp lệ, <b>mặc định từ chối</b>; chỉ các route
 * trong danh sách công khai được bỏ qua. Route chưa tồn tại cũng trả 401 khi chưa đăng nhập (không
 * lộ cấu trúc API).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class SessionAuthFilter extends OncePerRequestFilter {

    static final String USER_ATTRIBUTE = "docchat.user";

    private static final Set<String> PUBLIC =
            Set.of(
                    "POST /api/auth/login",
                    "POST /api/auth/logout",
                    "GET /api/health",
                    "GET /api/ready");

    private final AuthService auth;
    private final AuthProperties props;
    private final ApiErrorWriter errors;

    public SessionAuthFilter(AuthService auth, AuthProperties props, ApiErrorWriter errors) {
        this.auth = auth;
        this.props = props;
        this.errors = errors;
    }

    static User currentUser(HttpServletRequest request) {
        return (User) request.getAttribute(USER_ATTRIBUTE);
    }

    static String sessionToken(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie c : cookies) {
            if (c.getName().equals(cookieName)) {
                return c.getValue();
            }
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !uri.startsWith("/api/") || PUBLIC.contains(request.getMethod() + " " + uri);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Optional<User> user = auth.authenticate(sessionToken(request, props.cookieName()));
        if (user.isEmpty()) {
            errors.write(request, response, 401, "UNAUTHENTICATED", "Authentication required.");
            return;
        }
        request.setAttribute(USER_ATTRIBUTE, user.get());
        chain.doFilter(request, response);
    }
}
