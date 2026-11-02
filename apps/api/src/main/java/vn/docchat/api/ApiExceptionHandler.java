package vn.docchat.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.ErrorCode;

/**
 * Ánh xạ mọi lỗi sang {@link ApiError} {@code {code, message, traceId}} với HTTP status theo danh
 * mục {@link ErrorCode}. Không bao giờ đưa stack trace, đường dẫn, SQL hay chi tiết nội bộ vào phản
 * hồi.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> api(ApiException e, HttpServletRequest req) {
        return respond(e.code(), req, e.retryAfterSeconds(), null);
    }

    @ExceptionHandler({
        MethodArgumentNotValidException.class,
        HttpMessageNotReadableException.class,
        ConstraintViolationException.class,
        MissingServletRequestParameterException.class,
        MissingServletRequestPartException.class,
        TypeMismatchException.class,
        HttpMediaTypeNotAcceptableException.class
    })
    ResponseEntity<ApiError> invalid(Exception e, HttpServletRequest req) {
        return respond(ErrorCode.INVALID_REQUEST, req, 0, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> methodNotAllowed(
            HttpRequestMethodNotSupportedException e, HttpServletRequest req) {
        String allow =
                e.getSupportedHttpMethods() == null
                        ? null
                        : e.getSupportedHttpMethods().stream()
                                .map(HttpMethod::name)
                                .collect(Collectors.joining(", "));
        return respond(ErrorCode.METHOD_NOT_ALLOWED, req, 0, allow);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> unsupportedMediaType(
            HttpMediaTypeNotSupportedException e, HttpServletRequest req) {
        return respond(ErrorCode.UNSUPPORTED_MEDIA_TYPE, req, 0, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> tooLarge(MaxUploadSizeExceededException e, HttpServletRequest req) {
        return respond(ErrorCode.FILE_TOO_LARGE, req, 0, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> notFound(NoResourceFoundException e, HttpServletRequest req) {
        return respond(ErrorCode.NOT_FOUND, req, 0, null);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception e, HttpServletRequest req) {
        // Chi tiết chỉ ghi vào log kèm traceId để truy vết; phản hồi chỉ có thông điệp chung
        log.error("Lỗi không lường trước, traceId={}", RequestIdFilter.traceId(req), e);
        return respond(ErrorCode.INTERNAL, req, 0, null);
    }

    private static ResponseEntity<ApiError> respond(
            ErrorCode code, HttpServletRequest req, long retryAfter, String allow) {
        ResponseEntity.BodyBuilder b =
                ResponseEntity.status(HttpStatusCode.valueOf(code.httpStatus()))
                        .header(HttpHeaders.CACHE_CONTROL, "no-store");
        if (retryAfter > 0) {
            b.header(HttpHeaders.RETRY_AFTER, Long.toString(retryAfter));
        }
        if (allow != null) {
            b.header(HttpHeaders.ALLOW, allow);
        }
        return b.body(new ApiError(code.name(), message(code), RequestIdFilter.traceId(req)));
    }

    /** Thông điệp ngắn, chung; không nêu sai tên hay sai mật khẩu, không nêu lý do chi tiết. */
    private static String message(ErrorCode code) {
        return switch (code) {
            case INTERNAL -> "Internal error.";
            case NOT_FOUND -> "Not found.";
            case INVALID_REQUEST -> "Invalid request.";
            default -> "Request could not be completed.";
        };
    }
}
