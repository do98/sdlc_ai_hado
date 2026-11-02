# TC-TEL-02 — Quét mọi sự kiện/log/số đo/`audit_log` bằng chuỗi "canary" có trong câu hỏi, câu trả lời, nội dung và tên tệp

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-TEL-02 |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | QAS-06, NFR-006, RISK-02 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-TEL-02/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Quét mọi sự kiện/log/số đo/`audit_log` bằng chuỗi "canary" có trong câu hỏi, câu trả lời, nội dung và tên tệp
- **Kết quả mong đợi:** Không xuất hiện canary ở bất kỳ đâu
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** QAS-06, NFR-006, RISK-02

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-TEL-02/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Chuỗi canary cố định: `CANARY-7f3a9c21`. Truy cập CSDL dev bằng `psql -h localhost -p 54329 -U postgres -d postgres` (chỉ `SELECT`); cần xem log backend (cửa sổ terminal/tệp do người khởi động backend) — nếu không truy cập được, ghi "cần truy cập log".
- Tạo trong `test_reports/TC-TEL-02/data/`: `CANARY-7f3a9c21.pdf` có nội dung chứa chuỗi `CANARY-7f3a9c21` (soạn Word xuất PDF; hoặc tệp tối thiểu `%PDF-1.4 CANARY-7f3a9c21`).
- Câu hỏi canary: "CANARY-7f3a9c21 là gì?" (khi hỏi đáp hiện thực).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–10 vẫn chạy được để chứng minh. (phần tên tệp và nội dung tài liệu chạy được; phần câu hỏi/câu trả lời cần hỏi đáp chưa hiện thực)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn `data/CANARY-7f3a9c21.pdf` | Hàng `CANARY-7f3a9c21.pdf` xuất hiện (tên tệp chứa canary hiển thị trong giao diện là bình thường) | Ảnh `05-tai-tep-canary.png` |
| 6 | Đăng xuất rồi thử đăng nhập với tên `CANARY-7f3a9c21` và mật khẩu `sai-mat-khau-123` | Thấy thông báo lỗi chung (không cho biết sai tên hay mật khẩu) | Ảnh `06-dang-nhap-canary.png` |
| 7 | [Theo thiết kế, chưa chạy được] Hỏi "CANARY-7f3a9c21 là gì?" và chờ câu trả lời nhắc lại canary | Câu hỏi/câu trả lời có canary hiển thị trên giao diện | Ảnh `07-hoi-canary.png` |
| 8 | Quét `SELECT 'analytics' AS bang, id FROM analytics_events WHERE attributes::text ILIKE '%CANARY%' OR event_code ILIKE '%CANARY%' UNION ALL SELECT 'audit', id FROM audit_log WHERE attributes::text ILIKE '%CANARY%' OR action ILIKE '%CANARY%';` | 0 hàng | Ảnh `08-quet-csdl.png` |
| 9 | Quét log backend bằng `grep -n -i "CANARY" <tệp-log>` (hoặc tìm trong terminal chạy backend) và log trình duyệt Console | Không có kết quả | Ảnh `09-quet-log.png` |
| 10 | Quét số đo (nếu có endpoint `/actuator`/metrics; hiện chưa có) | Ghi "không có điểm số đo" hoặc 0 kết quả | Ảnh `10-quet-so-do.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Chuỗi canary không xuất hiện trong `analytics_events`, `audit_log`, log backend và số đo.
2. Quét có bằng chứng (lệnh và kết quả 0 hàng/0 dòng).
**Không đạt nếu:** canary xuất hiện ở bất kỳ nơi nào ngoài giao diện người dùng và bảng `documents` (nơi cần lưu tên hiển thị).

**Lưu ý:** Bảng `documents` có cột `name` lưu tên tệp để hiển thị, nên không thuộc phạm vi quét. Hai bảng telemetry chỉ cho phép khóa `sizeBytes`, `pageCount`, `reason`, `status`, `durationMs`.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-TEL-02/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-TEL-02/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-TEL-02//video/TC-TEL-02.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-TEL-02//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-TEL-02//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-TEL-02//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-TEL-02
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-TEL-02.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

