# TC-SEC-14 — Thông điệp lỗi không lộ stack trace, đường dẫn, SQL

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-14 |
| Nhóm | B.4 Bảo mật |
| Truy vết | UXS-06 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-14/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Thông điệp lỗi không lộ stack trace, đường dẫn, SQL
- **Kết quả mong đợi:** Đạt
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** UXS-06

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Trình duyệt Edge ở cửa sổ mới (hoặc ngữ cảnh Playwright mới), chưa có cookie `DOCCHAT_SESSION` của `localhost`.
- Máy chủ cấu hình `server.error.include-message: never`, `include-stacktrace: never`. Đầu vào gây lỗi (không phá hệ thống): thân JSON hỏng, sai kiểu nội dung, phương thức sai, route không tồn tại, thiếu tệp, id sai định dạng.
- Chuỗi KHÔNG được xuất hiện trong thân phản hồi/giao diện: `Exception`, `at vn.docchat`, `java.`, `org.springframework`, `PSQLException`, `select `, `Caused by`, đường dẫn dạng `E:\` hoặc `/home/`.
- Lưu thân phản hồi vào `test_reports/TC-SEC-14/data/loi-*.json`.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy `curl -i http://localhost:5173/api/documents` (không cookie) | HTTP 401, thân `{"code":"UNAUTHENTICATED","message":"Authentication required.","traceId":"…"}`; không có stack trace | Ảnh `01-loi-401.png` |
| 2 | Chạy `curl -i http://localhost:5173/api/khong-ton-tai` | HTTP 401 cùng khuôn (không lộ cấu trúc API) | Ảnh `02-loi-route-la.png` |
| 3 | Chạy `curl -i -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d "{bad"` | HTTP 400 `INVALID_REQUEST`, đúng khuôn; không có chi tiết trình phân tích JSON | Ảnh `03-loi-400-json-hong.png` |
| 4 | Chạy `curl -i -X POST http://localhost:5173/api/auth/login -H "Content-Type: text/plain" -d "x"` | HTTP 415 `UNSUPPORTED_MEDIA_TYPE`, đúng khuôn | Ảnh `04-loi-415.png` |
| 5 | Chạy `curl -i -X DELETE http://localhost:5173/api/auth/login` | HTTP 403 hoặc 405 (`METHOD_NOT_ALLOWED`), đúng khuôn, không lộ chi tiết nội bộ | Ảnh `05-loi-405.png` |
| 6 | Đăng nhập `admin`, mở Console, chạy `fetch("/api/documents",{method:"POST",body:new FormData()}).then(r=>r.text())` | Thân lỗi đúng khuôn `{code,message,traceId}` (400 `INVALID_REQUEST`); không lộ đường dẫn/SQL | Ảnh `06-loi-thieu-tep.png` |
| 7 | Chạy `fetch("/api/documents/%27%20OR%201%3D1--/file").then(r=>r.text())` | Thân lỗi đúng khuôn, không có chuỗi SQL/`PSQLException` | Ảnh `07-loi-sql-trong-id.png` |
| 8 | Đăng xuất, trên giao diện thử đăng nhập `admin` / `sai-mat-khau` | Chỉ hiện thông điệp tiếng Việt thân thiện, không hiện mã `INVALID_CREDENTIALS`, `traceId` hay chi tiết nội bộ | Ảnh `08-giao-dien-loi-dang-nhap.png` |
| 9 | Chạy `grep -riE "exception|at vn\.docchat|java\.|springframework|psql|select |caused by" test_reports/TC-SEC-14/data/` | Không có kết quả | Ảnh `09-quet-khong-lo.png` |

**Lưu ý:** Thân lỗi API dùng tiếng Anh ngắn ("Authentication required.") nhưng giao diện luôn ánh xạ sang thông điệp tiếng Việt theo `code`; Test Plan chỉ ghi "Đạt" nên tiêu chí cụ thể ở trên là diễn giải theo UXS-06.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mọi lỗi đều có dạng `{code,message,traceId}` với `message` ngắn, không chứa stack trace, đường dẫn tệp, tên lớp/phiên bản, hay câu SQL.
2. Giao diện chỉ hiện thông điệp tiếng Việt thân thiện (không mã kỹ thuật, không `traceId`).
3. Route lạ khi chưa đăng nhập đều 401 (không lộ cấu trúc).
**Không đạt nếu:** thân lỗi hoặc giao diện lộ stack trace, đường dẫn, SQL, tên lớp, phiên bản; trả trang lỗi HTML mặc định của framework.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-14/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-14/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-14//video/TC-SEC-14.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-14//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-14//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-14//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-14
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-14.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

