# TC-TEL-AUDIT — Hành động tải lên, xóa, truy vấn, đăng nhập/từ chối

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-TEL-AUDIT |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | NFR-006 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-TEL-AUDIT/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Hành động tải lên, xóa, truy vấn, đăng nhập/từ chối
- **Kết quả mong đợi:** Có dòng audit đúng; không sửa/xóa được bằng vai trò ứng dụng
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** NFR-006

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-TEL-AUDIT/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Truy cập CSDL dev bằng `psql -h localhost -p 54329 -U postgres -d postgres`. Bảng `audit_log(id, user_id, action, subject_type, subject_id, attributes, at)` có trigger `audit_log_no_update` chặn UPDATE/DELETE.
- Tạo `test_reports/TC-TEL-AUDIT/data/hop-le.pdf` (`node -e "require('fs').writeFileSync('hop-le.pdf','%PDF-1.4\n1 0 obj\n<<>>\nendobj\n')"`).
- Thử sửa/xóa chỉ thực hiện trong giao dịch có `ROLLBACK` để không đổi dữ liệu (đây là lệnh thử, được phép vì kết thúc bằng ROLLBACK).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–10 vẫn chạy được để chứng minh. (chỉ hành động UPLOAD đã ghi `audit_log`; đăng nhập/từ chối, xóa và truy vấn chưa ghi audit)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn `data/hop-le.pdf` | Hàng "Đã tải lên, đang xử lý" | Ảnh `05-tai-tep.png` |
| 6 | Chạy `SELECT user_id, action, subject_type, subject_id, attributes, at FROM audit_log ORDER BY at DESC LIMIT 5;` | Có đúng 1 dòng `action = 'UPLOAD'`, `subject_type = 'document'`, `subject_id` = id tài liệu vừa tải, `attributes` chỉ có `sizeBytes`; không có tên tệp | Ảnh `06-dong-upload.png` |
| 7 | Đối chiếu `subject_id` với `GET /api/documents` trong Console (`fetch('/api/documents').then(r=>r.json()).then(console.log)`) | `id` của tài liệu vừa tải trùng `subject_id` | Ảnh `07-doi-chieu-id.png` |
| 8 | Đăng nhập sai rồi đúng, và truy vấn lại `audit_log` | Theo thiết kế có dòng cho đăng nhập/từ chối; hiện nay không có dòng nào → ghi chưa hiện thực. Tương tự với "xóa" và "truy vấn" | Ảnh `08-dang-nhap-chua-co.png` |
| 9 | Chạy `BEGIN; UPDATE audit_log SET action = 'SUA'; ROLLBACK;` trong `psql` | Báo `ERROR: audit_log is append-only`; không dòng nào bị đổi | Ảnh `09-chan-sua.png` |
| 10 | Chạy `BEGIN; DELETE FROM audit_log; ROLLBACK;` trong `psql` | Báo `ERROR: audit_log is append-only`; số dòng không đổi (`SELECT count(*)` trước/sau bằng nhau) | Ảnh `10-chan-xoa.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi hành động (tải lên, đăng nhập/từ chối, xóa, truy vấn) có đúng một dòng `audit_log` với `action`, `subject_*` đúng.
2. Dòng audit không chứa tên tệp, nội dung hay mật khẩu.
3. UPDATE/DELETE trên `audit_log` bị chặn (lỗi `audit_log is append-only`).
**Không đạt nếu:** thiếu/trùng dòng audit; có dữ liệu nhạy cảm; sửa/xóa được.

**Lưu ý:** Test Plan nói "không sửa/xóa được bằng vai trò ứng dụng". Bản dev kết nối bằng `postgres` (siêu người dùng) và chỉ có trigger chặn; vai trò ứng dụng riêng không có quyền UPDATE/DELETE chưa được thiết lập, nên chỉ kiểm chứng được qua trigger. Siêu người dùng vẫn có thể vô hiệu trigger.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-TEL-AUDIT/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-TEL-AUDIT/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-TEL-AUDIT//video/TC-TEL-AUDIT.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-TEL-AUDIT//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-TEL-AUDIT//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-TEL-AUDIT//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-TEL-AUDIT
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-TEL-AUDIT.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

