# PERF-005 — Bền

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-005 |
| Nhóm | PERF — hiệu năng |
| Truy vết | SAD §4.2 |
| Mức/loại, tự động hóa | Bền |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-005/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Bền
- **Tải:** 3 người, hỏi liên tục
- **Thời lượng:** 4 giờ `[Đề xuất]`
- **Chỉ tiêu (thử):** Không rò bộ nhớ/kết nối; tỷ lệ lỗi không tăng
- **Nguồn ngưỡng:** SAD §4.2

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-005/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Công cụ ngoài: k6, giám sát JVM (ví dụ `jcmd <pid> GC.heap_info` hoặc JMX/VisualVM), `psql` hoặc truy vấn `pg_stat_activity` để đếm kết nối; staging có hỏi đáp (chưa có).
- Thời lượng 4 giờ `[Đề xuất]`; 3 người hỏi liên tục, bộ ≥ 30 câu; ghi lại mốc đo đều đặn (mỗi 15 phút).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–9 vẫn chạy được để chứng minh. (chỉ làm được phần giao diện: mở trang và để SSE chạy dài, theo dõi bộ nhớ JS trong DevTools; phần hỏi liên tục 4 giờ cần k6, hỏi đáp và giám sát JVM trên staging)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Mở DevTools > Performance monitor, bật "JS heap size" và "DOM Nodes" | Biểu đồ bắt đầu ghi; ghi giá trị khởi đầu | Ảnh `05-heap-ban-dau.png` |
| 6 | Để trang mở 30 phút (kết nối `/api/events` luôn mở) rồi chụp lại Performance monitor | Heap dao động nhưng không tăng đơn điệu; số DOM node ổn định; Network vẫn có `events` đang mở | Ảnh `06-heap-sau-30-phut.png` |
| 7 | Gọi `GET http://localhost:5173/api/ready` trong tab mới sau 30 phút | Trả 200 với `status: "UP"` | Ảnh `07-ready-sau-30-phut.png` |
| 8 | Trên staging chạy `k6 run --vus 3 --duration 4h data/perf-005.js` (hỏi liên tục) và ghi heap/kết nối mỗi 15 phút | Bảng `data/perf-005.csv` có heap JVM, số kết nối DB, tỷ lệ lỗi theo thời gian | Ảnh `08-so-do-4-gio.png` |
| 9 | So sánh giá trị đầu và cuối | Heap/kết nối không tăng đều; tỷ lệ lỗi giờ cuối không cao hơn giờ đầu | Ảnh `09-doi-chieu.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Trong 4 giờ với 3 người hỏi liên tục: không có xu hướng tăng bộ nhớ/kết nối (so sánh các mốc đo).
2. Tỷ lệ lỗi không tăng theo thời gian.
**Không đạt nếu:** bộ nhớ hoặc kết nối tăng đều; tỷ lệ lỗi tăng; dịch vụ ngừng phản hồi.

**Lưu ý:** Test Plan không ghi ngưỡng số cụ thể; cần người phụ trách chốt (ví dụ độ tăng heap tối đa) trước khi chạy.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-005/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-005/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-005//video/PERF-005.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-005//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-005//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-005//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-005
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-005.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

