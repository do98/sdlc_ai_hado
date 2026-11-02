# PERF-008 — Truy hồi

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-008 |
| Nhóm | PERF — hiệu năng |
| Truy vết | SAD §5.1 (`[Đề xuất]`) |
| Mức/loại, tự động hóa | Truy hồi |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-008/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Truy hồi
- **Tải:** Kho giả lập ≥ 100 000 đoạn
- **Thời lượng:** —
- **Chỉ tiêu (thử):** Truy hồi lai p95 ≤ 150 ms (BE)
- **Nguồn ngưỡng:** SAD §5.1 (`[Đề xuất]`)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-008/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Công cụ ngoài: PostgreSQL 16 + pgvector dùng cho tải thử (`docker compose up -d db` ở thư mục gốc), bộ nạp dữ liệu và trình chạy đo (ví dụ JMH/k6/pgbench; công cụ chưa được chọn trong Test Plan → ghi công cụ thực dùng).
- Kho giả lập ≥ 100 000 đoạn: sinh embedding ngẫu nhiên đúng số chiều của bảng `chunks` kèm văn bản ngẫu nhiên, nạp vào `test_reports/PERF-008/data/` (kịch bản + kết quả). Không dùng dữ liệu thật.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–5 vẫn chạy được để chứng minh. (truy hồi lai chưa hiện thực; ca này là hiệu năng phía BE, không thể kiểm qua giao diện; bước 1 chỉ xác nhận hệ thống sống)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/api/ready trong trình duyệt | Trả 200 với `status: "UP"` (database, storage đều UP) | Ảnh `01-ready.png` |
| 2 | Dựng CSDL tải thử riêng và nạp ≥ 100 000 hàng vào `chunks` (kèm chỉ mục vector/văn bản như thiết kế) | `SELECT count(*) FROM chunks;` ≥ 100000 | Ảnh `02-so-luong-doan.png` |
| 3 | Chạy ≥ 1000 truy vấn truy hồi lai (vector + văn bản) với câu hỏi ngẫu nhiên, ghi thời gian từng truy vấn | Tệp `data/perf-008.csv` có ≥ 1000 dòng thời gian (ms) | Ảnh `03-chay-truy-van.png` |
| 4 | Tính phân vị p95 (ví dụ bằng bảng tính) | Giá trị p95 được ghi | Ảnh `04-tinh-p95.png` |
| 5 | Đối chiếu với ngưỡng 150 ms | p95 ≤ 150 ms | Ảnh `05-doi-chieu.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Với ≥ 100 000 đoạn, truy hồi lai p95 ≤ 150 ms (đo ở backend, không kể gọi LLM).
2. Kết quả đo, kịch bản và cấu hình máy được lưu.
**Không đạt nếu:** p95 > 150 ms; kho dưới 100 000 đoạn; đo gồm cả thời gian LLM.

**Lưu ý:** Ngưỡng là `[Đề xuất]` (SAD §5.1). Đo ở backend nên không có ảnh giao diện đáng kể; dùng ảnh chụp kết quả công cụ.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-008/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-008/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-008//video/PERF-008.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-008//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-008//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-008//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-008
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-008.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

