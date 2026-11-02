# PERF-006 — Đột biến

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-006 |
| Nhóm | PERF — hiệu năng |
| Truy vết | SAD §2.4 (20 câu/phút/người) |
| Mức/loại, tự động hóa | Đột biến |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-006/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Đột biến
- **Tải:** 0 → 20 người → 0
- **Thời lượng:** 10 phút
- **Chỉ tiêu (thử):** Phục hồi ≤ 1 phút; hạn mức `429` đúng
- **Nguồn ngưỡng:** SAD §2.4 (20 câu/phút/người)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-006/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Công cụ ngoài: k6 với kịch bản `stages` (0 → 20 VU → 0) trong 10 phút; staging có hỏi đáp; hạn mức theo SAD §2.4 (20 câu/phút/người).
- 20 tài khoản (hiện chỉ có 1 admin) hoặc 20 phiên; kết quả hạn mức `429 RATE_LIMITED` phải kèm `Retry-After` hoặc số giây chờ.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–5 vẫn chạy được để chứng minh. (hạn mức 20 câu/phút/người chỉ áp dụng cho hỏi đáp, chưa hiện thực; cần k6 trên staging)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ đăng nhập `admin` rồi đo `GET /api/documents` trong DevTools > Network | Ghi số đo cơ sở trước tải | Ảnh `01-do-co-so.png` |
| 2 | Viết `data/perf-006.js` với `stages`: 1 phút 0→20 VU, 8 phút giữ, 1 phút 20→0; mỗi VU vượt 20 câu/phút | Tệp kịch bản được lưu; chạy thử 1 VU | Ảnh `02-kich-ban.png` |
| 3 | Chạy `k6 run data/perf-006.js` trên staging | k6 báo thống kê theo thời gian; có phản hồi 429 khi một người vượt 20 câu/phút | Ảnh `03-ket-qua.png` |
| 4 | Sau khi giảm về 0, đo thời gian đến khi độ trễ/tỷ lệ lỗi về mức bình thường | Thời gian hồi phục ≤ 1 phút; ghi mốc | Ảnh `04-hoi-phuc.png` |
| 5 | Kiểm tra giao diện sau thử: mở http://localhost:5173/ và đăng nhập | Trang vào bình thường, `GET /api/ready` 200 | Ảnh `05-sau-thu.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Phục hồi về trạng thái bình thường ≤ 1 phút sau khi tải về 0.
2. Hạn mức hoạt động đúng: yêu cầu thứ 21 trong một phút của cùng một người nhận `429` (`RATE_LIMITED`); người khác không bị ảnh hưởng.
**Không đạt nếu:** hồi phục > 1 phút; 429 xuất hiện sai chỗ (hoặc không xuất hiện); lỗi 5xx kéo dài.

**Lưu ý:** Hiện chỉ có hạn mức đăng nhập (`login-rate-limit-per-minute: 20`) cho `POST /api/auth/login`; không thay thế cho hạn mức hỏi đáp. Giao diện chưa có chuỗi riêng cho `RATE_LIMITED` của hỏi đáp (chỉ có `auth.rateLimited`).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-006/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-006/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-006//video/PERF-006.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-006//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-006//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-006//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-006
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-006.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

