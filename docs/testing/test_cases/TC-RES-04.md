# TC-RES-04 — Khởi động lại API trong lúc có luồng SSE

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-04 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | F-13 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-04/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Khởi động lại API trong lúc có luồng SSE
- **Kết quả mong đợi:** Trạng thái "Bị gián đoạn" + Tạo lại; không rò kết nối
- **Ưu:** C
- **Loại:** RT
- **Truy vết:** F-13

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Trình duyệt Edge/Chrome có DevTools (tab Network, lọc `events`); tùy chọn dùng Playwright `context.setOffline(true/false)`.
- Phần A (làm được qua trình duyệt, không cần hạ tầng): dùng chế độ Offline của DevTools hoặc "Block request URL" cho `*/api/events` để mô phỏng mất luồng SSE.
- Phần B (cần quyền hạ tầng, chỉ ghi cách làm): dừng rồi chạy lại DevServer (`./mvnw spring-boot:test-run -Dspring-boot.run.main-class=vn.docchat.DevServer` trong `apps/api`). Lưu ý DevServer chứa cả CSDL nhúng nên CSDL cũng dừng; dữ liệu và phiên vẫn còn do lưu ở `apps/api/target/dev-postgres`.
- Công cụ đếm kết nối cho phần "không rò kết nối": PowerShell `(Get-NetTCPConnection -LocalPort 8080 -State Established).Count` (cần quyền hạ tầng).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Mở DevTools (F12), tab Network, gõ `events` vào ô lọc | Có một yêu cầu `GET /api/events` trạng thái `pending` (luồng SSE đang mở), kiểu `fetch`/`eventsource` | Ảnh `05-sse-dang-mo.png` |
| 6 | Quan sát vùng "Tài liệu" | Không có cảnh báo "Đã mất kết nối thời gian thực — đang thử lại." | Ảnh `06-khong-canh-bao.png` |
| 7 | Bật Network → Throttling → Offline (Phần A) | Yêu cầu `events` kết thúc (failed/canceled) | Ảnh `07-chuyen-offline.png` |
| 8 | Quan sát vùng "Tài liệu" sau 1–2 giây | Hiện cảnh báo "Đã mất kết nối thời gian thực — đang thử lại." (vùng `conn-lost`); danh sách tài liệu vẫn hiển thị | Ảnh `08-canh-bao-mat-ket-noi.png` |
| 9 | Chờ 5–10 giây, quan sát tab Network | Các yêu cầu `events` mới xuất hiện cách nhau tăng dần (≈ 1 s, 2 s, 4 s … tối đa 30 s) và đều thất bại; không có nhiều hơn 1 yêu cầu `events` cùng lúc `pending` | Ảnh `09-thu-noi-lai-tang-dan.png` |
| 10 | Bật lại mạng (Throttling → No throttling) | Trong vài giây có một yêu cầu `events` mới `pending` (thường kèm header `Last-Event-ID` nếu đã từng nhận sự kiện); cảnh báo "Đã mất kết nối…" biến mất | Ảnh `10-noi-lai-thanh-cong.png` |
| 11 | Quan sát tab Network và đếm yêu cầu `events` đang `pending` | Chỉ còn đúng 1 yêu cầu `events` pending (các yêu cầu cũ đã kết thúc, không rò kết nối) | Ảnh `11-mot-ket-noi-duy-nhat.png` |
| 12 | (Phần B, cần hạ tầng) Dừng DevServer, chờ 10 s, chạy lại, rồi quan sát vùng "Tài liệu" | Giao diện hiện cảnh báo mất kết nối khi dừng; sau khi chạy lại, cảnh báo biến mất, danh sách được tải lại (có thể qua `resync`); `Get-NetTCPConnection` cổng 8080 không có kết nối thừa từ các lần nối cũ | Ảnh `12-khoi-dong-lai-api.png` |
| 13 | (Thiết kế — chạy khi có hỏi đáp) Khởi động lại API khi một câu trả lời đang stream | Câu trả lời hiển thị "Bị gián đoạn" kèm nút "Tạo lại"; bấm "Tạo lại" gửi lại câu hỏi và nhận trả lời đầy đủ | Ảnh `13-tra-loi-bi-gian-doan.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khi luồng SSE bị mất, giao diện báo mất kết nối ("Đã mất kết nối thời gian thực — đang thử lại.") và tự nối lại theo khoảng chờ tăng dần, không cần tải lại trang.
2. Sau khi nối lại, cảnh báo biến mất và danh sách tài liệu đúng trạng thái hiện tại (nhận bù theo `Last-Event-ID` hoặc tải lại do `resync`).
3. Không rò kết nối: sau khi nối lại chỉ có 1 luồng `events` đang mở từ trình duyệt; số kết nối ESTABLISHED trên cổng 8080 không tăng theo số lần nối lại.
4. Phần "Bị gián đoạn + Tạo lại" của luồng hỏi đáp (IF-05) chưa thể kiểm: ghi "Bị chặn" cho phần đó.

**Không đạt nếu:** không có cảnh báo hoặc không tự nối lại; nối lại liên tục không giãn khoảng (vòng lặp nóng); có nhiều luồng `events` cùng mở; danh sách tài liệu lệch trạng thái thật sau khi nối lại.

**Lưu ý:** Test Plan nói "Bị gián đoạn" + "Tạo lại" (luồng chat F-13). Với giao diện hiện tại chỉ có luồng sự kiện tài liệu: thông báo thực tế là "Đã mất kết nối thời gian thực — đang thử lại." Kết luận tổng thể của ca là "Đạt một phần (SSE tài liệu), phần chat Bị chặn".

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-04/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-04/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-04//video/TC-RES-04.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-04//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-04//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-04//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-04
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-04.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

