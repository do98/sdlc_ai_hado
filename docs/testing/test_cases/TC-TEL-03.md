# TC-TEL-03 — Danh sách khóa `attributes` được phép

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-TEL-03 |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | QAS-06 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | UT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-TEL-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Danh sách khóa `attributes` được phép
- **Kết quả mong đợi:** Khóa lạ làm kiểm thử thất bại
- **Ưu:** T
- **Loại:** UT
- **Truy vết:** QAS-06

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-TEL-03/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Mã nguồn tại `apps/api/src/main/java/vn/docchat/service/` (`AuditService.java`, `AnalyticsService.java`, `Json.java`). Danh sách cho phép hiện tại: audit `sizeBytes, pageCount, reason, status`; analytics `sizeBytes, pageCount, reason, durationMs`.
- Không sửa mã; chỉ đọc và chạy kiểm thử hiện có (`cd apps/api && ./mvnw -q test -Dtest=DocumentUploadApiTest`; trên Windows dùng `mvnw.cmd`). Nếu chạy Maven không phù hợp, ghi "chỉ xem xét mã".
- Truy cập CSDL dev (`psql -h localhost -p 54329 -U postgres -d postgres`) chỉ `SELECT`.

## Các bước thực hiện
**Hiện trạng:** Không thể kiểm qua giao diện (ca kiểm thử đơn vị ở mã nguồn); chỉ có thể kiểm bằng đọc mã và lệnh Maven; có thể bổ sung kiểm tra dữ liệu thực qua CSDL dev.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `AuditService.java` và `AnalyticsService.java`, tìm hằng `ALLOWED_KEYS` | Chụp hai hằng với đúng các khóa nêu trên | Ảnh `01-danh-sach-khoa.png` |
| 2 | Mở `Json.java` và đọc phương thức `of(...)` | Khóa không thuộc danh sách phải bị loại hoặc gây lỗi (ghi hành vi thật) | Ảnh `02-hanh-vi-khoa-la.png` |
| 3 | Tìm kiểm thử đơn vị có chủ đích về khóa lạ: `grep -rn "ALLOWED_KEYS\|khóa lạ\|unknown key" apps/api/src/test` | Liệt kê kết quả; nếu không có, ghi "chưa có kiểm thử khóa lạ" | Ảnh `03-tim-kiem-test.png` |
| 4 | Chạy `cd apps/api && ./mvnw -q test -Dtest=DocumentUploadApiTest` (nếu cho phép) | Kết quả thông báo thành công/thất bại được chụp từ terminal | Ảnh `04-chay-maven.png` |
| 5 | Quét thuộc tính thực tế: `SELECT DISTINCT jsonb_object_keys(attributes) FROM analytics_events UNION SELECT DISTINCT jsonb_object_keys(attributes) FROM audit_log;` | Mọi khóa thuộc `{sizeBytes, pageCount, reason, status, durationMs}` | Ảnh `05-khoa-thuc-te.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Danh sách khóa cho phép được định nghĩa tập trung và có kiểm thử.
2. Khóa lạ làm kiểm thử thất bại (hoặc bị loại, hành vi được xác định rõ).
3. Dữ liệu thực tế không có khóa ngoài danh sách.
**Không đạt nếu:** có khóa thuộc tính lạ trong CSDL; không có kiểm thử cho khóa lạ; khóa lạ được ghi mà không ai biết.

**Lưu ý:** Hiện `Json.of(attributes, ALLOWED_KEYS)` lọc theo danh sách; Test Plan yêu cầu "Khóa lạ làm kiểm thử thất bại" — cần kiểm xem là lọc im lặng hay ném lỗi (nếu lọc im lặng thì chưa khớp Test Plan).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-TEL-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-TEL-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-TEL-03//video/TC-TEL-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-TEL-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-TEL-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-TEL-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-TEL-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-TEL-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

