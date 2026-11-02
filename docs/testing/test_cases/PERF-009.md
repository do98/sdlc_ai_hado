# PERF-009 — SSE

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-009 |
| Nhóm | PERF — hiệu năng |
| Truy vết | SAD §2.4, T06 spike |
| Mức/loại, tự động hóa | SSE |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-009/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** SSE
- **Tải:** 3 luồng đồng thời/người
- **Thời lượng:** 10 phút
- **Chỉ tiêu (thử):** Không bị proxy đóng/đệm; thứ tự đúng
- **Nguồn ngưỡng:** SAD §2.4, T06 spike

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-009/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Lấy cookie phiên: `curl -i -c cookie.txt -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"Docchat-Dev-2026!\"}"` (không ghi giá trị cookie vào báo cáo).
- Tạo `test_reports/PERF-009/data/hop-le.pdf` (`node -e "require('fs').writeFileSync('hop-le.pdf','%PDF-1.4\n1 0 obj\n<<>>\nendobj\n')"`) để gây sự kiện `document.updated` khi tải lên.
- Kho còn chỗ trống; thời lượng thử 10 phút.

## Các bước thực hiện
**Hiện trạng:** Phần luồng sự kiện `/api/events` đã hiện thực nên chạy được bằng trình duyệt và curl tại localhost:5173; phần luồng SSE hỏi đáp (IF-05) chưa hiện thực. Chạy qua proxy Vite dev chỉ chứng minh một phần; kiểm "proxy đóng/đệm" thật cần reverse proxy staging.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Mở thêm 2 tab trình duyệt cùng phiên tới `http://localhost:5173/` (tổng 3 tab) | Mỗi tab hiện "Xin chào, admin"; DevTools > Network của từng tab có 1 yêu cầu `/api/events` đang mở (Pending) | Ảnh `05-ba-tab.png` |
| 6 | Trong tab 1 chọn yêu cầu `events` > Headers | Có `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` | Ảnh `06-header-sse.png` |
| 7 | Mở tab EventStream của yêu cầu `events` và chờ 40 giây | Có dòng chú thích `:connected` ngay khi mở và `:ping` mỗi 15 giây; kết nối không bị đóng | Ảnh `07-heartbeat.png` |
| 8 | Ở tab 1 bấm "Tải PDF lên" và chọn `data/hop-le.pdf` | Cả 3 tab nhận sự kiện `document.updated` gần như tức thì (không phải chờ nhịp tim), hàng mới xuất hiện ở cả 3 tab | Ảnh `08-nhan-su-kien-3-tab.png` |
| 9 | Quan sát `id` của sự kiện ở từng tab | `id` là số nguyên tăng dần, giống nhau giữa 3 tab và đúng thứ tự (không đảo, không thiếu) | Ảnh `09-thu-tu-id.png` |
| 10 | Để 3 tab mở đủ 10 phút rồi kiểm tra từng tab | Cả 3 kết nối `events` vẫn mở (hoặc nếu bị đóng thì tự nối lại và chỉ báo "Đã mất kết nối thời gian thực — đang thử lại." thoáng qua); không có sự kiện bị mất sau nối lại | Ảnh `10-sau-10-phut.png` |
| 11 | Chạy `curl -N -b cookie.txt http://localhost:5173/api/events` trong terminal 1 phút | Dòng `:connected` hiện ngay lập tức (không bị đệm), rồi các `:ping` đều đặn | Ảnh `11-curl-khong-dem.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. 3 luồng `/api/events` đồng thời trong 10 phút đều giữ mở, nhận heartbeat (`:ping` ~15 giây).
2. Mỗi sự kiện đến cả 3 luồng, đúng thứ tự `id` tăng dần, không bị đệm (nhận ngay).
3. Header `X-Accel-Buffering: no` và `Content-Type: text/event-stream` có mặt.
**Không đạt nếu:** luồng bị proxy đóng giữa chừng; sự kiện bị dồn/đệm; thứ tự sai; mất sự kiện sau nối lại.

**Lưu ý:** Chuẩn kiểm cuối cùng cần chạy qua proxy thật (nginx/ingress) ở staging và có thêm 3 luồng hỏi đáp (IF-05) khi hiện thực. "3 luồng/người" hiểu là 3 kết nối cùng lúc của một người.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-009/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-009/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-009//video/PERF-009.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-009//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-009//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-009//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-009
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-009.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

