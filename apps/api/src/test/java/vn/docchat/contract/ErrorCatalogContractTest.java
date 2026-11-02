package vn.docchat.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import vn.docchat.domain.ErrorCode;

/**
 * T05.f — danh mục mã lỗi: enum Java phải khớp {@code ErrorCode.x-catalog} trong openapi.yaml
 * (nguồn sự thật).
 */
class ErrorCatalogContractTest {

    private final OpenApiSpec spec = new OpenApiSpec();

    @Test
    void T05_tap_ma_loi_java_bang_tap_ma_loi_trong_hop_dong() {
        assertThat(Arrays.stream(ErrorCode.values()).map(Enum::name).toList())
                .containsExactlyInAnyOrderElementsOf(spec.errorCodes());
    }

    @Test
    void T05_catalog_co_du_ma_va_khong_thua() {
        assertThat(spec.catalog().keySet()).containsExactlyInAnyOrderElementsOf(spec.errorCodes());
    }

    @Test
    void T05_http_status_va_retryable_khop_hop_dong() {
        for (ErrorCode code : ErrorCode.values()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> entry = (Map<String, Object>) spec.catalog().get(code.name());
            assertThat(entry).as(code.name()).isNotNull();
            assertThat(entry.get("status"))
                    .as(code.name() + " status")
                    .isEqualTo(code.httpStatus());
            assertThat(entry.get("retryable"))
                    .as(code.name() + " retryable")
                    .isEqualTo(code.retryable());
        }
    }

    @Test
    void T05_hop_dong_khai_bao_du_thao_tac_theo_ke_hoach() {
        List<String> expected =
                List.of(
                        "login",
                        "logout",
                        "getMe",
                        "getHealth",
                        "getReady",
                        "listDocuments",
                        "uploadDocument",
                        "getDocumentFile",
                        "streamEvents",
                        "createConversation",
                        "askQuestion");
        assertThat(spec.allOperations()).containsExactlyInAnyOrderElementsOf(expected);
    }
}
