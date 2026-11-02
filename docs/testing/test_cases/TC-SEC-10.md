# TC-SEC-10 — Tải lên tệp độc hại: PDF có JavaScript nhúng, PDF polyglot, PDF cực lớn, "PDF bomb"

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-10 |
| Nhóm | B.4 Bảo mật |
| Truy vết | RISK-04 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-10/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Tải lên tệp độc hại: PDF có JavaScript nhúng, PDF polyglot, PDF cực lớn, "PDF bomb"
- **Kết quả mong đợi:** Không thực thi mã; từ chối hoặc báo lỗi an toàn; không treo worker
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** RISK-04

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Dữ liệu thử độc hại GIẢ LẬP, chỉ dùng cho hệ thống dev của dự án; tạo bằng script Node ghi nhị phân vào `test_reports/TC-SEC-10/data/`:
- - `js-nhung.pdf`: PDF tối thiểu bắt đầu `%PDF-1.4`, có `/OpenAction << /S /JavaScript /JS (app.alert\("pdf-js"\)) >>` (vô hại).
- - `polyglot.pdf`: `%PDF-1.4` ở đầu, phần đuôi là HTML `<script>window.__xss=1</script>` (tệp vừa là PDF vừa là HTML).
- - `qua-lon.pdf`: bắt đầu `%PDF-1.4`, 11 MB (vượt 10 MB); `rat-lon.pdf`: 13 MB (vượt giới hạn multipart 12 MB).
- - `bom.pdf`: PDF có luồng nén lặp/cây trang lồng sâu (bom giải nén nhỏ). Xử lý nền (T08) chưa có nên chưa kiểm được tác động lên worker.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–9 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Đăng nhập `admin`, mở `http://localhost:5173/` | Thấy "Xin chào, admin" và nút "Tải PDF lên" | Ảnh `01-trang-chinh.png` |
| 2 | Bấm "Tải PDF lên", chọn `data/js-nhung.pdf` | Hàng `js-nhung.pdf` hiện (được nhận, "Đang xử lý"); KHÔNG có hộp thoại alert "pdf-js" | Ảnh `02-js-nhung-khong-chay.png` |
| 3 | Quan sát Console DevTools | Không có lỗi/dấu hiệu thực thi mã; `window.__xss` là `undefined` | Ảnh `03-console-sach.png` |
| 4 | Bấm "Tải PDF lên", chọn `data/polyglot.pdf` | Hàng `polyglot.pdf` hiện; không chạy script (hoặc tệp bị từ chối với thông điệp an toàn) | Ảnh `04-polyglot.png` |
| 5 | Bấm "Tải PDF lên", chọn `data/qua-lon.pdf` (11 MB) | Hàng ở trạng thái "Lỗi", dòng phụ "Tệp vượt giới hạn cho phép (tối đa 10 MB và 100 trang)."; không gửi tệp lên mạng | Ảnh `05-qua-lon-bi-tu-choi.png` |
| 6 | Trong Console chạy `const fd=new FormData(); fd.append("file",new Blob(["%PDF-"+"a".repeat(13*1024*1024)]),"x.pdf"); (await fetch("/api/documents",{method:"POST",body:fd})).status` | Trả `413` (mã `FILE_TOO_LARGE`), phản hồi nhanh, không treo | Ảnh `06-api-413-13mb.png` |
| 7 | Chạy lại bước 6 với `"a".repeat(11*1024*1024)` | Trả `413` `FILE_TOO_LARGE` (giới hạn nghiệp vụ 10 MB do máy chủ kiểm khi truyền) | Ảnh `07-api-413-11mb.png` |
| 8 | Gửi nội dung không phải PDF: `fd.append("file",new Blob(["<html>"]),"gia.pdf")` rồi POST như bước 6 | Trả `415` mã `NOT_PDF` | Ảnh `08-api-415.png` |
| 9 | Chạy `(await fetch("/api/ready")).status` sau các bước trên | Trả `200` — máy chủ không bị treo | Ảnh `09-ready-sau-tai.png` |
| 10 | (Chờ T08) Tải `data/bom.pdf` và chờ | Tài liệu chuyển "Lỗi" (ví dụ "Xử lý tệp chưa thành công. Vui lòng tải lên lại.") trong thời gian giới hạn; tài liệu khác vẫn xử lý; worker không treo | Ảnh `10-bom-pdf.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Không mã nào trong PDF (JavaScript nhúng, polyglot) được thực thi ở trình duyệt hoặc phía máy chủ.
2. Tệp vượt 10 MB bị từ chối an toàn (giao diện: "Tệp vượt giới hạn…"; API: 413 `FILE_TOO_LARGE`); tệp không phải PDF bị 415 `NOT_PDF`.
3. Máy chủ vẫn sống (`/api/ready` 200) sau mọi tệp thử; "PDF bomb" không treo worker (kiểm khi có T08).
**Không đạt nếu:** xuất hiện alert/thực thi mã; máy chủ lỗi 5xx hoặc không phản hồi; tệp quá lớn được nhận; thông điệp lỗi lộ nội bộ.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-10/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-10/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-10//video/TC-SEC-10.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-10//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-10//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-10//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-10
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-10.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

