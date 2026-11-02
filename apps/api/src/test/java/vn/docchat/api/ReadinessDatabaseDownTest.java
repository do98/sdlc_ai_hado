package vn.docchat.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.docchat.repository.DatabaseProbe;
import vn.docchat.support.PostgresTestBase;

/** T03.e — CSDL lỗi → /api/ready 503 nhưng /api/health vẫn 200. */
class ReadinessDatabaseDownTest extends PostgresTestBase {

    @MockBean DatabaseProbe database;

    @Test
    void T03_csdl_tat_thi_ready_503_con_health_van_200() throws Exception {
        when(database.isUp()).thenReturn(false);
        mvc.perform(get("/api/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.checks.database").value("DOWN"))
                .andExpect(jsonPath("$.checks.storage").value("UP"));
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }
}
