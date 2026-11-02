package vn.docchat.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.docchat.domain.User;
import vn.docchat.service.AuthProperties;
import vn.docchat.service.AuthService;
import vn.docchat.service.LoginRateLimiter;

@RestController
@RequestMapping("/api")
public class AuthController {

    /** Giới hạn độ dài để không bắt máy chủ băm chuỗi khổng lồ. */
    public record LoginRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(max = 1024) String password) {}

    public record MeResponse(UUID id, String username, String role) {}

    private final AuthService auth;
    private final AuthProperties props;
    private final LoginRateLimiter limiter;

    public AuthController(AuthService auth, AuthProperties props, LoginRateLimiter limiter) {
        this.auth = auth;
        this.props = props;
        this.limiter = limiter;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Void> login(
            @Valid @RequestBody LoginRequest body, HttpServletRequest request) {
        limiter.check(request.getRemoteAddr());
        AuthService.Login result = auth.login(body.username(), body.password());
        return ResponseEntity.noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookie(result.sessionToken(), props.sessionTtl()).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        auth.logout(SessionAuthFilter.sessionToken(request, props.cookieName()));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(HttpServletRequest request, HttpServletResponse response) {
        User user = SessionAuthFilter.currentUser(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new MeResponse(user.id(), user.username(), user.role().name()));
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(props.cookieName(), value)
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite(props.cookieSameSite())
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
