# TC-SEC-08 — Vai trò: người dùng thường gọi API/menu của PO/Admin

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-08 |
| Nhóm | B.4 Bảo mật |
| Truy vết | US-023-AC4 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-08/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Vai trò: người dùng thường gọi API/menu của PO/Admin
- **Kết quả mong đợi:** `403`; menu không hiển thị; route SPA bị chặn
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** US-023-AC4

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Mô hình dữ liệu có vai trò `ADMIN` (tài khoản `admin`) và `MEMBER` nhưng CHƯA có menu/route/API quản trị cho PO/Admin và chưa tạo được người dùng thường. Phần so sánh theo vai trò (bước 5–8) là đặc tả khi có; phần chạy được: route lạ và API lạ bị từ chối.
- Thiết kế (`docs/design/html_design/scr-06-bao-cao-tuan.html`, `scr-07-quan-ly-nguoi-dung.html`): báo cáo tuần và quản lý người dùng chỉ dành cho PO/Admin → API quản trị trả 403 cho người dùng thường.
- Đường dẫn minh họa (chưa tồn tại): SPA `/quan-tri/nguoi-dung`; API `/api/admin/users`. Cập nhật theo route thật khi có.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–4 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chưa đăng nhập, mở `http://localhost:5173/quan-tri/nguoi-dung` | Chuyển tới `/login?redirect=%2Fquan-tri%2Fnguoi-dung` (mọi route SPA mặc định yêu cầu đăng nhập) | Ảnh `01-route-chua-dang-nhap.png` |
| 2 | Chạy `curl -i http://localhost:5173/api/admin/users` (không cookie) | HTTP 401 `UNAUTHENTICATED` (route chưa tồn tại cũng 401, không lộ cấu trúc) | Ảnh `02-api-quan-tri-401.png` |
| 3 | Đăng nhập `admin`, mở `http://localhost:5173/quan-tri/nguoi-dung` | Hiện "Không tìm thấy trang" kèm liên kết "Về trang chính" (route chưa có) | Ảnh `03-route-chua-co.png` |
| 4 | Quan sát thanh đầu trang | Chỉ có "Xin chào, admin", "Đăng xuất" (và "Mở danh sách tài liệu"/"Mở ngăn nguồn" ở màn hình hẹp); chưa có menu quản trị | Ảnh `04-khong-co-menu-quan-tri.png` |
| 5 | (Chờ tính năng) Đăng nhập bằng người dùng thường (MEMBER) | Vào `/` thành công | Ảnh `05-dang-nhap-member.png` |
| 6 | (Chờ tính năng) Quan sát menu | Không hiển thị mục dành riêng PO/Admin (báo cáo tuần, quản lý người dùng) | Ảnh `06-menu-member.png` |
| 7 | (Chờ tính năng) Gõ trực tiếp URL route quản trị | Bị chặn: hiện "Không tìm thấy nội dung này." hoặc quay về `/`; không lộ nội dung quản trị | Ảnh `07-route-bi-chan.png` |
| 8 | (Chờ tính năng) Trong Console gọi `fetch` tới API quản trị (ví dụ `/api/admin/users`) | HTTP 403 thân `{code,message,traceId}` | Ảnh `08-api-bi-403.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Người dùng thường: API quản trị trả 403; menu quản trị không hiển thị; route SPA quản trị bị chặn.
2. Người chưa đăng nhập: API 401 và route SPA chuyển tới đăng nhập.
**Không đạt nếu:** người dùng thường thấy menu quản trị, vào được route hoặc gọi được API quản trị (2xx).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-08/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-08/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-08//video/TC-SEC-08.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-08//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-08//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-08//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-08
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-08.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

