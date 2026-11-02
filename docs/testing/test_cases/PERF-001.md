# PERF-001 — Tải

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-001 |
| Nhóm | PERF — hiệu năng |
| Truy vết | Kế hoạch TH-01/02 (`[TBD: OQ-006]`) |
| Mức/loại, tự động hóa | Tải |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-001/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Tải
- **Tải:** 10 người đồng thời × 20 tài liệu × 100 trang
- **Thời lượng:** 30 phút
- **Chỉ tiêu (thử):** Token đầu p90 ≤ 3 s; hoàn chỉnh p90 ≤ 15 s
- **Nguồn ngưỡng:** Kế hoạch TH-01/02 (`[TBD: OQ-006]`)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-001/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Công cụ ngoài: k6 (https://k6.io) và môi trường staging (không chạy tải nặng trên máy dev); trước khi chạy cần chốt `[TBD: OQ-006]` cho ngưỡng. Ghi rõ phiên bản k6, cấu hình máy, bản dựng.
- Dữ liệu: 20 tài liệu PDF, mỗi tệp 100 trang có chữ thật, sinh vào `test_reports/PERF-001/data/` (ví dụ tạo bằng LibreOffice/ReportLab; mỗi tệp < 10 MB), đã "Sẵn sàng" trên staging (cần T08).
- 10 tài khoản kiểm thử (hiện chỉ có 1 admin) hoặc 10 phiên cùng tài khoản; bộ câu hỏi ≥ 30 câu có đáp án trong tài liệu.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–5 vẫn chạy được để chứng minh. (chạy được bước chuẩn bị và đo cơ sở; cần hỏi đáp, T08 và k6 trên staging nên kết luận dự kiến 'Bị chặn' / 'Không thể kiểm qua giao diện')

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ đăng nhập `admin`, mở DevTools > Network rồi tải lại trang chính | Ghi lại thời gian của `GET /api/documents` và `GET /api/me` làm số đo cơ sở (không phải tiêu chí Đạt) | Ảnh `01-do-co-so.png` |
| 2 | Chuẩn bị 20 PDF 100 trang và tải lên staging (tối đa 20 tài liệu) | Danh sách có "Đã dùng 20/20 tài liệu"; mọi hàng "Sẵn sàng" (hiện sẽ kẹt "Đang xử lý") | Ảnh `02-kho-20-tai-lieu.png` |
| 3 | Viết kịch bản k6 `data/perf-001.js`: 10 VU, 30 phút, mỗi VU đăng nhập rồi gọi hỏi đáp và đọc SSE, ghi hai số đo tùy chỉnh `ttft` (đến `delta` đầu) và `total` (đến `done`) | Tệp kịch bản được lưu; chạy thử 1 VU thấy có `ttft` và `total` | Ảnh `03-kich-ban-k6.png` |
| 4 | Chạy lệnh `k6 run --vus 10 --duration 30m data/perf-001.js` trên máy tải riêng | Kết thúc 30 phút, k6 in thống kê `ttft` và `total` với p(90), tỷ lệ lỗi `http_req_failed` | Ảnh `04-ket-qua-k6.png` |
| 5 | Đối chiếu p(90) của `ttft` và `total` với ngưỡng | `ttft` p90 ≤ 3 s và `total` p90 ≤ 15 s; ghi các giá trị thực | Ảnh `05-doi-chieu-nguong.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Với 10 người đồng thời × 20 tài liệu × 100 trang trong 30 phút: token đầu (delta đầu tiên) p90 ≤ 3 s.
2. Câu trả lời hoàn chỉnh (đến `done`) p90 ≤ 15 s.
3. Có xuất log k6 và số đo thực; không bịa số.
**Không đạt nếu:** bất kỳ p90 vượt ngưỡng; có lỗi/timeout đáng kể; không thực hiện được bằng k6/staging.

**Lưu ý:** Ngưỡng đang là chỉ tiêu thử, phụ thuộc OQ-006. Hỏi đáp (IF-05) và T08 chưa hiện thực nên chưa đo được.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-001/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-001/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-001//video/PERF-001.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-001//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-001//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-001//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-001
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-001.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

