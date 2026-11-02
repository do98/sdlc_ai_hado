# TC-SEC-07 — Thu hồi quyền giữa phiên

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-07 |
| Nhóm | B.4 Bảo mật |
| Truy vết | US-021-AC3, US-001 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-07/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Thu hồi quyền giữa phiên
- **Kết quả mong đợi:** Yêu cầu kế tiếp bị chặn
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** US-021-AC3, US-001

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Cần hai cửa sổ trình duyệt. Hiện chưa có quản lý người dùng/thu hồi quyền; phần thu hồi bằng giao diện (bước 7–8) là đặc tả khi có.
- Phần chạy được ngay: hủy phiên phía máy chủ bằng đăng xuất ở cửa sổ khác — cookie cũ phải bị chặn ở yêu cầu kế tiếp (cùng cơ chế bảng `auth_sessions`).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–6 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Cửa sổ 1: đăng nhập `admin` tại `/login` | Vào `/`, thấy "Xin chào, admin" | Ảnh `01-cua-so-1-dang-nhap.png` |
| 2 | Cửa sổ 1: mở DevTools → Application → Cookies, sao chép giá trị `DOCCHAT_SESSION` vào `data/phien.txt` (che khi chụp ảnh) | Có cookie `DOCCHAT_SESSION` | Ảnh `02-sao-chep-cookie.png` |
| 3 | Cửa sổ 2 (ẩn danh): thêm thủ công cookie vừa sao chép cho `localhost`, mở `http://localhost:5173/` | Vào được `/` như đã đăng nhập (cùng một phiên) | Ảnh `03-cua-so-2-co-phien.png` |
| 4 | Cửa sổ 1: bấm "Đăng xuất" | Về `/login` | Ảnh `04-cua-so-1-dang-xuat.png` |
| 5 | Cửa sổ 2: chạy Console `(await fetch("/api/documents")).status` (yêu cầu kế tiếp) | Trả `401` (phiên bị hủy phía máy chủ) | Ảnh `05-yeu-cau-ke-tiep-401.png` |
| 6 | Cửa sổ 2: tải lại trang | Chuyển tới `/login?redirect=%2F`; giao diện không hiện dữ liệu cũ | Ảnh `06-chuyen-ve-dang-nhap.png` |
| 7 | (Chờ tính năng) Quản trị thu hồi quyền/vô hiệu hóa người dùng U khi U đang có phiên | Thao tác thu hồi thành công | Ảnh `07-thu-hoi-quyen.png` |
| 8 | (Chờ tính năng) U thực hiện yêu cầu kế tiếp (tải danh sách/hỏi) | Bị chặn ngay: 401/403 và giao diện đưa về đăng nhập hoặc báo không có quyền, không phải đợi hết hạn phiên | Ảnh `08-u-bi-chan.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Sau khi phiên bị hủy/quyền bị thu hồi, yêu cầu KẾ TIẾP bằng cookie cũ bị chặn (401/403), không phải chờ hết 8 giờ.
2. Giao diện đưa người dùng về đăng nhập, không hiển thị dữ liệu cũ.
**Không đạt nếu:** cookie cũ vẫn truy cập được dữ liệu sau khi phiên bị hủy/quyền bị thu hồi.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-07/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-07/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-07//video/TC-SEC-07.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-07//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-07//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-07//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-07
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-07.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

