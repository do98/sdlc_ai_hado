package vn.docchat.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import vn.docchat.domain.ApiException;
import vn.docchat.domain.ErrorCode;

/** Chỉ có trong test: tạo từng loại lỗi để kiểm tra bộ xử lý lỗi toàn cục (T03.d). */
@RestController
@RequestMapping("/api/_probe")
class ErrorProbeController {

    record Body(@NotBlank String name) {}

    @GetMapping("/error/{code}")
    String error(@PathVariable ErrorCode code, @RequestParam(defaultValue = "0") long retryAfter) {
        throw new ApiException(code, retryAfter);
    }

    @GetMapping("/boom")
    String boom() {
        throw new IllegalStateException(
                "chi tiết nội bộ bí mật /etc/passwd jdbc:postgresql://db password=hunter2");
    }

    @GetMapping("/typed")
    String typed(@RequestParam int n) {
        return "n=" + n;
    }

    @PostMapping("/body")
    String body(@Valid @RequestBody Body body) {
        return body.name();
    }

    @PostMapping("/toolarge")
    String tooLarge() {
        throw new MaxUploadSizeExceededException(1);
    }
}
