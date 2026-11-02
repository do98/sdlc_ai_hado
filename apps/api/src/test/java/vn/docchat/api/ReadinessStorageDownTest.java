package vn.docchat.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.docchat.repository.FileStore;
import vn.docchat.support.PostgresTestBase;

/** T03.e — thư mục lưu tệp không ghi được (hoặc ném lỗi) → /api/ready 503. */
class ReadinessStorageDownTest extends PostgresTestBase {

    @MockBean FileStore files;

    @Test
    void T03_thu_muc_luu_tep_khong_ghi_duoc_thi_ready_503() throws Exception {
        when(files.isWritable()).thenReturn(false);
        mvc.perform(get("/api/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.checks.storage").value("DOWN"))
                .andExpect(jsonPath("$.checks.database").value("UP"));
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void T03_loi_bat_ngo_khi_kiem_tra_luu_tru_cung_tinh_la_tat() throws Exception {
        when(files.isWritable()).thenThrow(new IllegalStateException("đĩa lỗi"));
        mvc.perform(get("/api/ready")).andExpect(status().isServiceUnavailable());
    }
}
