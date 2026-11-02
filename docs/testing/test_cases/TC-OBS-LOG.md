# TC-OBS-LOG — Chạy luồng E2E đầy đủ rồi quét log

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-OBS-LOG |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | RISK-02 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-OBS-LOG/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Chạy luồng E2E đầy đủ rồi quét log
- **Kết quả mong đợi:** Không có token, cookie, nội dung câu hỏi/trả lời/tài liệu
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** RISK-02

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-OBS-LOG/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Cần đọc được log backend (đầu ra terminal chạy `spring-boot:run`/DevServer hoặc tệp log do người vận hành cung cấp; định dạng có `[traceId]`). Nếu không truy cập được, ghi "cần truy cập log".
- Chuỗi cần quét (ghi vào `data/quet.txt`, KHÔNG ghi giá trị thật vào báo cáo): giá trị cookie `DOCCHAT_SESSION`, mật khẩu `Docchat-Dev-2026!`, chuỗi canary `CANARY-LOG-5521` đặt trong tên và nội dung tệp, câu hỏi `CANARY-LOG-5521 là gì?`.
- Tạo `test_reports/TC-OBS-LOG/data/CANARY-LOG-5521.pdf` (PDF có chữ chứa canary).

## Các bước thực hiện
**Hiện trạng:** Phần đăng nhập/tải tệp chạy được và quét log có thể thực hiện ngay; phần hỏi/đáp/trích dẫn chưa hiện thực nên log chưa chứng minh đủ luồng E2E đầy đủ → kết luận dự kiến 'Bị chặn' cho phần đó (bước 1–6 vẫn chạy được).

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn `data/CANARY-LOG-5521.pdf` | Hàng "Đã tải lên, đang xử lý" | Ảnh `05-tai-tep.png` |
| 6 | Mở DevTools > Application > Cookies, ghi nhận tên cookie `DOCCHAT_SESSION` (chép 6 ký tự đầu để quét, không chụp giá trị đầy đủ) | Có cookie `DOCCHAT_SESSION` (HttpOnly) | Ảnh `06-cookie.png` |
| 7 | Đăng xuất (nút "Đăng xuất") rồi đăng nhập lại | Về `/login` rồi vào lại "Xin chào, admin" | Ảnh `07-dang-xuat-nhap-lai.png` |
| 8 | [Theo thiết kế, chưa chạy được] Hỏi "CANARY-LOG-5521 là gì?" và bấm trích dẫn | Hiển thị câu trả lời và nguồn | Ảnh `08-hoi-dap.png` |
| 9 | Quét log: `grep -n -i -E "Docchat-Dev-2026|DOCCHAT_SESSION|Set-Cookie|Authorization|CANARY-LOG-5521|<6-ký-tự-cookie>" <tệp-log>` | 0 dòng (hoặc chụp màn hình terminal đã tìm Ctrl+F không thấy) | Ảnh `09-quet-log.png` |
| 10 | Đọc ngẫu nhiên 20 dòng log quanh các lần đăng nhập/tải | Chỉ có id, mã trạng thái, kích thước, `traceId`; không có nội dung nhạy cảm | Ảnh `10-doc-mau-log.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Log không chứa token/cookie phiên, mật khẩu, tên tệp có canary, câu hỏi/câu trả lời, nội dung tài liệu.
2. Mọi dòng log có thể truy vết bằng `traceId` mà không lộ nội dung.
**Không đạt nếu:** tìm thấy bất kỳ chuỗi nhạy cảm nào trong log; log của tầng proxy/Vite chứa cookie hay nội dung.

**Lưu ý:** Quét cả log của Vite (terminal `npm run dev`) và log backend. Log chỉ dựa trên phần đã hiện thực (đăng nhập, tải lên, SSE); phải chạy lại khi có hỏi đáp.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-OBS-LOG/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-OBS-LOG/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-OBS-LOG//video/TC-OBS-LOG.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-OBS-LOG//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-OBS-LOG//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-OBS-LOG//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-OBS-LOG
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-OBS-LOG.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

