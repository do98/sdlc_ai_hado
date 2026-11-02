# TC-OBS-COST — Mỗi câu trả lời

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-OBS-COST |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | RISK-10 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-OBS-COST/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Mỗi câu trả lời
- **Kết quả mong đợi:** `prompt_tokens`, `completion_tokens`, chi phí được lưu; cảnh báo khi vượt ngưỡng ngày
- **Ưu:** T
- **Loại:** IT
- **Truy vết:** RISK-10

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-OBS-COST/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Truy cập CSDL dev: `psql -h localhost -p 54329 -U postgres -d postgres` (chỉ `SELECT`).
- Cần tài liệu "Sẵn sàng" `test_reports/TC-OBS-COST/data/tai-lieu.pdf` (PDF có chữ) và LLM hoạt động; ngưỡng chi phí ngày chưa định nghĩa (khóa cấu hình chưa có) → cần số liệu từ người phụ trách; để thử cảnh báo cần đặt ngưỡng thấp ở cấu hình staging.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–7 vẫn chạy được để chứng minh. (cần hỏi đáp để có câu trả lời; bảng `messages` đã có cột `prompt_tokens`, `completion_tokens`, `cost_usd` nhưng chưa có luồng ghi; chưa có cơ chế cảnh báo ngưỡng ngày)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm nút "Tải PDF lên" (với Playwright: `page.waitForEvent('filechooser')` rồi bấm nút) | Hộp thoại chọn tệp của hệ điều hành mở (chọn được nhiều tệp) | Ảnh `05-mo-hop-thoai-chon-tep.png` |
| 6 | Chọn tệp `data/tai-lieu.pdf` trong hộp thoại | Xuất hiện hàng `tai-lieu.pdf` với trạng thái "Đã tải lên, đang xử lý" rồi "Đang xử lý"; bộ đếm "Đã dùng n/20 tài liệu" tăng 1 | Ảnh `06-da-tai-len.png` |
| 7 | Quan sát trạng thái tài liệu | Hiện nay vẫn "Đang xử lý", ô hỏi khóa — điểm bị chặn | Ảnh `07-bi-chan.png` |
| 8 | [Theo thiết kế] Hỏi 3 câu liên tiếp và chờ mỗi câu hoàn tất (`done`) | Mỗi câu có sự kiện `done` với `usage.promptTokens` và `usage.completionTokens` (xem Network > luồng `messages`) | Ảnh `08-usage-trong-done.png` |
| 9 | [Theo thiết kế] Chạy `SELECT id, result, prompt_tokens, completion_tokens, cost_usd FROM messages ORDER BY created_at DESC LIMIT 3;` | 3 dòng; `prompt_tokens`/`completion_tokens` khác NULL và khớp `usage` của từng `done`; `cost_usd` > 0 | Ảnh `09-bang-messages.png` |
| 10 | [Theo thiết kế] Cộng chi phí ngày: `SELECT date(created_at), sum(cost_usd) FROM messages GROUP BY 1;` và vượt ngưỡng cấu hình | Tổng khớp số cộng tay; khi vượt ngưỡng có dòng cảnh báo trong log backend (mức WARN) mà không lộ nội dung | Ảnh `10-canh-bao-nguong.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi câu trả lời lưu `prompt_tokens`, `completion_tokens` và `cost_usd` (khác NULL) khớp `usage` trong `done`.
2. Khi tổng chi phí trong ngày vượt ngưỡng, có cảnh báo (log/số đo) và cảnh báo không chứa nội dung câu hỏi/đáp.
**Không đạt nếu:** thiếu số token/chi phí; số không khớp; không có cảnh báo khi vượt ngưỡng.

**Lưu ý:** Test Plan không nêu giá trị ngưỡng; cần chốt (RISK-10).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-OBS-COST/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-OBS-COST/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-OBS-COST//video/TC-OBS-COST.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-OBS-COST//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-OBS-COST//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-OBS-COST//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-OBS-COST
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-OBS-COST.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

