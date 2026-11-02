# TC-SEC-01 — Cookie phiên

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-01 |
| Nhóm | B.4 Bảo mật |
| Truy vết | QAS-02, NFR-003 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-01/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Cookie phiên
- **Kết quả mong đợi:** `HttpOnly`, `Secure`, `SameSite`; JS không đọc được; hết hạn 8 giờ
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** QAS-02, NFR-003

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Trình duyệt Edge ở cửa sổ mới (hoặc ngữ cảnh Playwright mới), chưa có cookie `DOCCHAT_SESSION` của `localhost`.
- Cookie phiên tên `DOCCHAT_SESSION` (cấu hình `docchat.auth`: `session-ttl: PT8H`, `cookie-secure: true`, `cookie-same-site: Lax`). Nếu dev chạy với `DOCCHAT_AUTH_COOKIE_SECURE=false` thì không có cờ `Secure` → ghi nhận là sai khác cấu hình, không bịa kết quả.
- Ghi lại giờ đăng nhập (đồng hồ máy) để tính hạn cookie; lưu giá trị header `Set-Cookie` (đã che phần giá trị phiên) vào `test_reports/TC-SEC-01/data/set-cookie.txt`.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login`, Mở DevTools (F12) của Edge → tab Application → Storage → Cookies → `http://localhost:5173` | Danh sách cookie không có `DOCCHAT_SESSION` (chưa đăng nhập) | Ảnh `01-cookie-truoc-dang-nhap.png` |
| 2 | Mở tab Network, bật "Preserve log" | Tab Network trống, sẵn sàng ghi | Ảnh `02-network-san-sang.png` |
| 3 | Nhập `admin` vào "Tên đăng nhập", `Docchat-Dev-2026!` vào "Mật khẩu", bấm "Đăng nhập" | Chuyển sang `/`, thấy "Xin chào, admin" | Ảnh `03-dang-nhap-thanh-cong.png` |
| 4 | Trong Network chọn yêu cầu `login` (POST, trạng thái 204) → Headers → Response Headers → dòng `Set-Cookie` | Có `DOCCHAT_SESSION=…; Max-Age=28800; Expires=…; Path=/; Secure; HttpOnly; SameSite=Lax` | Ảnh `04-set-cookie-header.png` |
| 5 | Mở Application → Cookies → chọn `DOCCHAT_SESSION`, đọc các cột HttpOnly, Secure, SameSite, Expires | HttpOnly = ✓; Secure = ✓ (theo cấu hình mặc định); SameSite = Lax; Path = `/`; Expires cách giờ đăng nhập 8 giờ (±1 phút) | Ảnh `05-cookie-co-cac-co.png` |
| 6 | Mở tab Console, chạy `document.cookie` | Trả chuỗi KHÔNG chứa `DOCCHAT_SESSION` (JS không đọc được cookie HttpOnly) | Ảnh `06-document-cookie.png` |
| 7 | Trong Console chạy `await cookieStore.get("DOCCHAT_SESSION")` (nếu trình duyệt hỗ trợ) | Trả `null` | Ảnh `07-cookiestore-null.png` |
| 8 | Trong Console chạy `(await fetch("/api/me")).status` | Trả `200` (trình duyệt tự gửi cookie mà JS không cần đọc) | Ảnh `08-api-me-200.png` |
| 9 | Tính chênh lệch `Expires` trừ giờ đăng nhập đã ghi | Bằng 8 giờ = 28 800 giây (khớp `Max-Age=28800`) | Ảnh `09-tinh-han-8-gio.png` |
| 10 | Bấm "Đăng xuất", rồi xem lại Application → Cookies | Cookie `DOCCHAT_SESSION` biến mất; yêu cầu `logout` trả 204 kèm `Set-Cookie` có `Max-Age=0` | Ảnh `10-sau-dang-xuat.png` |
| 11 | Trong Console chạy `(await fetch("/api/me")).status` | Trả `401` (phiên đã bị hủy phía máy chủ) | Ảnh `11-api-me-401.png` |

**Lưu ý:** Không đợi đủ 8 giờ: hạn "8 giờ" được xác nhận qua `Max-Age=28800`/`Expires` và cấu hình `session-ttl: PT8H`; việc hết hạn thật chỉ kiểm được ở môi trường riêng đặt TTL ngắn (ngoài phạm vi ca này). Cờ `Secure` trên `http://localhost` vẫn được Chromium/Edge lưu vì `localhost` được coi là ngữ cảnh an toàn; Firefox/Safari có thể không lưu.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Cookie `DOCCHAT_SESSION` có đủ `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` (thấy ở header `Set-Cookie` và tab Cookies).
2. `document.cookie` và `cookieStore.get` không trả giá trị phiên (JS không đọc được).
3. `Max-Age=28800` (8 giờ); `Expires` cách lúc đăng nhập 8 giờ.
4. Sau đăng xuất cookie bị xóa và `/api/me` trả 401.
**Không đạt nếu:** thiếu bất kỳ cờ `HttpOnly`/`Secure`/`SameSite`; `document.cookie` lộ giá trị phiên; thời hạn khác 8 giờ; cookie còn hiệu lực sau đăng xuất.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-01/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-01/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-01//video/TC-SEC-01.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-01//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-01//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-01//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-01
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-01.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

