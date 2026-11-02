# TC-RES-08 — Tải lặp 50 lần Dừng/gián đoạn

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-08 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | F-13 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-08/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Tải lặp 50 lần Dừng/gián đoạn
- **Kết quả mong đợi:** Không rò bộ nhớ, bộ đếm, ReadableStream
- **Ưu:** T
- **Loại:** RT
- **Truy vết:** F-13

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Trình duyệt Edge/Chrome: DevTools → Performance monitor (JS heap size, DOM nodes, Event listeners) hoặc Memory → Heap snapshot; Playwright có thể dùng CDP `Performance.getMetrics`.
- Phần làm được hiện tại: vòng lặp 50 lần mở/đóng luồng sự kiện tài liệu (IF-06) bằng Offline/Online hoặc điều hướng `/` ↔ `/login`. Phần "Dừng" của luồng chat (IF-05) chưa có.
- Công cụ đếm kết nối phía máy chủ (cần hạ tầng): `(Get-NetTCPConnection -LocalPort 8080 -State Established).Count`.
- Đoạn lệnh Console để lặp 50 lần mở/hủy luồng: `for(let i=0;i<50;i++){const a=new AbortController();const r=await fetch('/api/events',{signal:a.signal});const rd=r.body.getReader();await rd.read();a.abort();}` (đã đăng nhập; chạy sau khi ghi nhận số liệu nền).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Mở DevTools → Performance monitor, đợi 10 giây rồi ghi nhận JS heap, DOM nodes, Event listeners (số nền) | Có ba số nền, ổn định (không tăng đáng kể trong 10 giây) | Ảnh `05-so-lieu-nen.png` |
| 6 | (Cần hạ tầng) Ghi nhận số kết nối ESTABLISHED tới cổng 8080 | Số nền (ví dụ 1–2 kết nối cho luồng `events` của tab) | Tệp/log `data/ket-noi-nen.txt` kèm ảnh màn hình `06-ket-noi-nen.png` |
| 7 | Chạy trong Console vòng lặp 50 lần mở rồi hủy luồng `/api/events` | Vòng lặp kết thúc không lỗi; mỗi lần nhận được dòng `:connected` rồi bị hủy chủ động | Ảnh `07-chay-50-lan.png` |
| 8 | Chờ 30 giây rồi bấm biểu tượng thùng rác (Collect garbage) trong Performance monitor | JS heap giảm trở lại gần số nền | Ảnh `08-sau-gc.png` |
| 9 | Ghi nhận lại JS heap, DOM nodes, Event listeners | Mỗi số không vượt số nền quá ngưỡng cho phép [Unverified: Test Plan không nêu ngưỡng, đề xuất ≤ 10% so với nền]; không tăng tuyến tính theo 50 lần | Ảnh `09-so-lieu-sau.png` |
| 10 | (Cần hạ tầng) Đếm lại kết nối ESTABLISHED tới cổng 8080 | Bằng số nền (các kết nối hủy đã đóng, không rò) | Tệp/log `data/ket-noi-sau.txt` kèm ảnh màn hình `10-ket-noi-sau.png` |
| 11 | Mở tab Network, lọc `events` | Chỉ có đúng 1 yêu cầu `events` đang `pending` của chính giao diện (không phải 50) | Ảnh `11-chi-1-luong-pending.png` |
| 12 | (Thiết kế — chạy khi có hỏi đáp) Lặp 50 lần: gửi câu hỏi rồi bấm "Dừng" (và 50 lần gián đoạn bằng Offline) | Mỗi lần luồng đóng sạch; số liệu bộ nhớ, bộ đếm "đang trả lời" và số ReadableStream đang mở không tăng | Ảnh `12-lap-dung-50-lan.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Sau 50 lần mở/hủy luồng: JS heap, DOM nodes, Event listeners trở về gần số nền (không tăng tuyến tính).
2. Số kết nối máy chủ (ESTABLISHED) trở về số nền; không có luồng `events` thừa trong tab Network.
3. Phần Dừng/gián đoạn của chat (bộ đếm "đang trả lời", `ReadableStream` của IF-05) chưa kiểm được → "Bị chặn" cho phần đó.

**Không đạt nếu:** heap hoặc listeners tăng đều theo số lần lặp; số kết nối máy chủ tăng thêm; còn luồng pending sau khi hủy.

**Lưu ý:** Test Plan không nêu ngưỡng số học cho "không rò" nên ngưỡng 10% là đề xuất của người chạy; phải ghi rõ trong báo cáo.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-08/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-08/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-08//video/TC-RES-08.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-08//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-08//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-08//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-08
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-08.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

