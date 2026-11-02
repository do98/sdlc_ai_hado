package vn.docchat.contract;

import static com.atlassian.oai.validator.mockmvc.OpenApiValidationMatchers.openApi;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.atlassian.oai.validator.OpenApiInteractionValidator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.docchat.repository.DatabaseProbe;
import vn.docchat.support.PostgresTestBase;

/** T05.e — phản hồi 503 của /api/ready khớp schema {@code Readiness} trong hợp đồng. */
class ReadinessContractTest extends PostgresTestBase {

    @MockBean DatabaseProbe database;

    @Test
    void T05_ready_503_khop_hop_dong() throws Exception {
        when(database.isUp()).thenReturn(false);
        OpenApiInteractionValidator validator =
                OpenApiInteractionValidator.createFor(OpenApiSpec.FILE.toUri().toString()).build();
        mvc.perform(get("/api/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(openApi().isValid(validator));
    }
}
