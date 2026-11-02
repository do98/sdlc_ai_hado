# TC-SEC-03 — CSRF: POST từ origin lạ

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-03 |
| Nhóm | B.4 Bảo mật |
| Truy vết | NFR-003 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** CSRF: POST từ origin lạ
- **Kết quả mong đợi:** Bị từ chối
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** NFR-003

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Cần `curl` (Git Bash) và trình duyệt Edge. Ca dùng `POST /api/auth/login` và `POST /api/auth/logout` vì đã có thật; `OriginCheckFilter` áp dụng cho mọi POST/PUT/PATCH/DELETE dưới `/api/`.
- Quy tắc cần đạt: `Sec-Fetch-Site` khác `same-origin`/`none` → 403; `Origin` có mặt thì phải trùng origin máy chủ (`http://localhost:5173`); `Origin: null` → 403.
- Ghi lệnh và phản hồi vào `test_reports/TC-SEC-03/data/curl-log.txt`.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy `curl -i -X POST http://localhost:5173/api/auth/login -H "Origin: http://evil.example" -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"x\"}"` | HTTP 403; thân `{"code":"CSRF_REJECTED","message":"Request origin not allowed.","traceId":"…"}`; không có `Set-Cookie` | Ảnh `01-origin-la-403.png` |
| 2 | Chạy lại với `-H "Origin: null"` | HTTP 403 `CSRF_REJECTED` | Ảnh `02-origin-null-403.png` |
| 3 | Chạy lại với `-H "Sec-Fetch-Site: cross-site"` (không có Origin) | HTTP 403 `CSRF_REJECTED` | Ảnh `03-cross-site-403.png` |
| 4 | Chạy lại với `-H "Sec-Fetch-Site: same-site"` | HTTP 403 `CSRF_REJECTED` (cùng site khác origin cũng bị chặn) | Ảnh `04-same-site-403.png` |
| 5 | Đối chứng: chạy `curl -i -X POST http://localhost:5173/api/auth/login -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -d "{bad"` | HTTP 400 `INVALID_REQUEST` (qua bộ lọc Origin, lỗi do thân JSON hỏng) — chứng minh 403 ở các bước trên là do Origin | Ảnh `05-doi-chung-400.png` |
| 6 | Đăng nhập bằng trình duyệt tại `http://localhost:5173/login` | Vào `/`, thấy "Xin chào, admin" | Ảnh `06-dang-nhap.png` |
| 7 | Mở tab mới `http://127.0.0.1:5173/login` (origin khác), mở Console, chạy `fetch("http://localhost:5173/api/auth/logout",{method:"POST",credentials:"include",mode:"no-cors"})` | Trong Network yêu cầu `logout` có trạng thái 403 (Origin `http://127.0.0.1:5173` bị từ chối) | Ảnh `07-post-cheo-origin-403.png` |
| 8 | Quay về tab `http://localhost:5173/`, chạy `(await fetch("/api/me")).status` | Trả `200` — phiên không bị hủy bởi yêu cầu giả mạo | Ảnh `08-phien-con-nguyen.png` |
| 9 | Đối chứng cùng origin: chạy `(await fetch("/api/auth/logout",{method:"POST"})).status` | Trả `204` (yêu cầu cùng origin được chấp nhận) | Ảnh `09-cung-origin-204.png` |

**Lưu ý:** Yêu cầu KHÔNG có `Origin` và `Sec-Fetch-Site` (ví dụ `curl` trơn) được cho qua theo thiết kế (client không phải trình duyệt), vẫn cần cookie phiên cho mọi API trừ đăng nhập/đăng xuất; không phải lỗi. Test Plan chỉ nói "Bị từ chối" — thực tế là HTTP 403 mã `CSRF_REJECTED`.
**Lưu ý:** Đừng lặp bước sai mật khẩu với `admin`: 5 lần sai liên tiếp khóa tài khoản 15 phút (xem TC-SEC-13).

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mọi POST với `Origin` lạ, `Origin: null`, `Sec-Fetch-Site: cross-site`/`same-site` trả HTTP 403 mã `CSRF_REJECTED`, thân đúng dạng `{code,message,traceId}`, không cấp cookie.
2. POST từ trang origin khác (`127.0.0.1:5173`) bị 403 và phiên người dùng không bị ảnh hưởng.
3. Yêu cầu cùng origin vẫn thành công (đối chứng 400/204).
**Không đạt nếu:** bất kỳ POST thay đổi dữ liệu từ origin lạ nào trả khác 403, hoặc có `Set-Cookie` cấp cho yêu cầu bị từ chối.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-03//video/TC-SEC-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

