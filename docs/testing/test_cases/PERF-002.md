# PERF-002 — Tải

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-002 |
| Nhóm | PERF — hiệu năng |
| Truy vết | SAD §5.1, QAS-01 (`[Đề xuất]`) |
| Mức/loại, tự động hóa | Tải |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-002/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Tải
- **Tải:** 5 truy vấn đồng thời (quy mô pilot)
- **Thời lượng:** 30 phút
- **Chỉ tiêu (thử):** Token đầu ≤ 2 s
- **Nguồn ngưỡng:** SAD §5.1, QAS-01 (`[Đề xuất]`)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-002/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Công cụ ngoài: k6, môi trường staging có tài liệu "Sẵn sàng" (cần T08); ngưỡng theo SAD §5.1/QAS-01 là `[Đề xuất]`.
- 5 phiên đăng nhập (5 tài khoản hoặc 5 phiên cùng tài khoản) và bộ ≥ 20 câu hỏi; tài liệu mẫu quy mô pilot (khoảng 5–10 PDF, 20–50 trang) sinh vào `test_reports/PERF-002/data/`.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–5 vẫn chạy được để chứng minh. (chạy được bước đo cơ sở; cần hỏi đáp và k6 trên staging)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ đăng nhập `admin` rồi đo `GET /api/documents` trong DevTools > Network | Ghi thời gian phản hồi làm số đo cơ sở (không là tiêu chí Đạt) | Ảnh `01-do-co-so.png` |
| 2 | Tải bộ tài liệu pilot lên staging và chờ tất cả "Sẵn sàng" | Mọi hàng hiện "Sẵn sàng" (hiện sẽ kẹt "Đang xử lý") | Ảnh `02-tai-lieu-san-sang.png` |
| 3 | Viết `data/perf-002.js`: 5 VU, vòng lặp hỏi câu ngẫu nhiên, ghi `ttft` | Chạy thử 1 VU thấy `ttft` có giá trị | Ảnh `03-kich-ban-k6.png` |
| 4 | Chạy `k6 run --vus 5 --duration 30m data/perf-002.js` | k6 in thống kê `ttft` (p90, p95, max) và tỷ lệ lỗi | Ảnh `04-ket-qua-k6.png` |
| 5 | Đối chiếu kết quả với ngưỡng 2 giây | Mọi/đa số lượt `ttft` ≤ 2 s theo cách đo đã nêu (p90 hoặc tối đa, ghi rõ cách tính trong báo cáo) | Ảnh `05-doi-chieu-nguong.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Với 5 truy vấn đồng thời trong 30 phút, token đầu ≤ 2 s.
2. Không có lỗi 5xx/timeout đáng kể; số đo thực được lưu trong `data/`.
**Không đạt nếu:** token đầu vượt 2 s; lỗi tăng trong suốt phiên; không đo được.

**Lưu ý:** Test Plan ghi "Token đầu ≤ 2 s" mà không nói rõ phân vị; cần chốt (p90/p95/max) trước khi kết luận.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-002/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-002/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-002//video/PERF-002.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-002//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-002//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-002//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-002
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-002.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

