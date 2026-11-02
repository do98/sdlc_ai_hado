package vn.docchat.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import vn.docchat.support.PostgresTestBase;

/** T03.e — /api/health và /api/ready công khai (không cần phiên); bình thường cả hai đều 200. */
class HealthReadyTest extends PostgresTestBase {

    @Test
    void T03_health_200_khong_can_phien() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void T03_ready_200_khi_csdl_va_thu_muc_luu_tep_san_sang() throws Exception {
        mvc.perform(get("/api/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.checks.database").value("UP"))
                .andExpect(jsonPath("$.checks.storage").value("UP"));
    }
}
