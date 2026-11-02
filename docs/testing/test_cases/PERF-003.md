# PERF-003 — Xử lý tài liệu

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-003 |
| Nhóm | PERF — hiệu năng |
| Truy vết | Kế hoạch TH-03 (`[TBD: OQ-005]`) |
| Mức/loại, tự động hóa | Xử lý tài liệu |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-003/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Xử lý tài liệu
- **Tải:** ≥ 20 mẫu 100 trang; 2 tệp song song
- **Thời lượng:** —
- **Chỉ tiêu (thử):** p90 ≤ 60 s
- **Nguồn ngưỡng:** Kế hoạch TH-03 (`[TBD: OQ-005]`)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-003/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- ≥ 20 mẫu PDF 100 trang có chữ trong `test_reports/PERF-003/data/` (mẫu 01..20), mỗi tệp < 10 MB; sinh bằng LibreOffice/ReportLab. Kho còn đủ chỗ (tối đa 20 tài liệu) — vì giới hạn 20 nên làm theo từng đợt (không có xóa hiện nay nên cần CSDL dev sạch giữa các đợt).
- Cách đo thời gian xử lý: từ `POST /api/documents` trả 202 đến sự kiện SSE `document.updated` có `status: "READY"` (tab Network > `/api/events` > EventStream hoặc `curl -N` có cookie).
- Công cụ: k6 hoặc script Playwright để lặp 20 lần, 2 tệp mỗi lượt; ngưỡng phụ thuộc `[TBD: OQ-005]`.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–8 vẫn chạy được để chứng minh. (chạy được 2 bước đầu để thấy tài liệu kẹt "Đang xử lý"; cần T08)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn đồng thời 2 tệp mẫu 100 trang | Hai hàng "Đã tải lên, đang xử lý"; ghi mốc thời gian `t0` từ dòng `POST /api/documents` trong Network | Ảnh `05-hai-tep-song-song.png` |
| 6 | Mở tab Network > `events` > EventStream và chờ sự kiện `document.updated` | Theo thiết kế: mỗi tệp có sự kiện `status: "READY"`; hiện nay không có sự kiện READY (kẹt "Đang xử lý") | Ảnh `06-cho-ready.png` |
| 7 | Ghi `t1` của từng tệp và tính `t1 - t0` | Ghi hai giá trị (giây) vào `data/perf-003.csv` | Ảnh `07-ghi-thoi-gian.png` |
| 8 | Lặp lại cho đủ ≥ 20 mẫu và tính p90 bằng bảng tính | Bảng có ≥ 20 dòng và giá trị p90 | Ảnh `08-tinh-p90.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. ≥ 20 mẫu 100 trang, xử lý 2 tệp song song, p90 thời gian từ tải lên đến "Sẵn sàng" ≤ 60 giây.
2. Mọi tệp đến "Sẵn sàng" (không lỗi) và số liệu thô được lưu.
**Không đạt nếu:** p90 > 60 s; có tệp lỗi; không đủ 20 mẫu.

**Lưu ý:** Tải lên đã chạy được nhưng chưa có xử lý nền nên chưa có điểm kết thúc đo.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-003/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-003/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-003//video/PERF-003.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-003//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-003//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-003//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-003
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-003.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

