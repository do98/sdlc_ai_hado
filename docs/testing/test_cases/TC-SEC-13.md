# TC-SEC-13 — Giới hạn tần suất đăng nhập/câu hỏi

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-13 |
| Nhóm | B.4 Bảo mật |
| Truy vết | SAD §2.4 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-13/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Giới hạn tần suất đăng nhập/câu hỏi
- **Kết quả mong đợi:** `429` đúng; không bị lợi dụng dò tài khoản
- **Ưu:** T
- **Loại:** ST
- **Truy vết:** SAD §2.4

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Trình duyệt Edge ở cửa sổ mới (hoặc ngữ cảnh Playwright mới), chưa có cookie `DOCCHAT_SESSION` của `localhost`.
- Cấu hình hiện hành: tối đa 20 yêu cầu đăng nhập/phút/IP → 429 `RATE_LIMITED` (kèm số giây chờ); 5 lần sai liên tiếp → khóa 15 phút → 423 `ACCOUNT_LOCKED`. Giao diện dùng CHUNG một thông điệp cho 401 và 423: "Không đăng nhập được. Hãy kiểm tra tên đăng nhập và mật khẩu, hoặc thử lại sau ít phút."; riêng 429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút."
- **Cảnh báo:** ca này có thể KHÓA tài khoản `admin` 15 phút, ảnh hưởng ca khác. Dùng tên `khong-ton-tai-01` cho phần lặp; chỉ khóa `admin` ở bước 3 rồi chờ 15 phút trước khi chạy ca khác; không chạy song song.
- Giới hạn câu hỏi chưa có (chưa có hỏi đáp) → bước 9 là đặc tả.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–8 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login`, nhập `khong-ton-tai-01` và mật khẩu `sai-mat-khau-1`, bấm "Đăng nhập" | Cảnh báo lỗi đúng thông điệp chung "Không đăng nhập được. Hãy kiểm tra…"; mật khẩu bị xóa; Network thấy 401 | Ảnh `01-sai-lan-1.png` |
| 2 | Lặp bước 1 tổng cộng 6 lần (đổi mật khẩu mỗi lần) | Cả 6 lần cùng thông điệp, cùng bố cục; ghi mã HTTP mỗi lần (401 hoặc 423) từ tab Network | Ảnh `02-sai-lan-6.png` |
| 3 | Lặp đúng 6 lần với `admin` và mật khẩu sai (xem cảnh báo ở trên) | Thông điệp trên giao diện GIỐNG HỆT bước 2 (không lộ "tài khoản bị khóa"); ghi mã HTTP: lần thứ 6 có thể là 423 | Ảnh `03-admin-bi-khoa.png` |
| 4 | So sánh thân phản hồi của `khong-ton-tai-01` và của `admin` (Network → Response) | Giao diện không phân biệt được tên đúng/sai; ghi nhận nếu API trả mã khác nhau (`INVALID_CREDENTIALS` so với `ACCOUNT_LOCKED`) vì có thể dò tài khoản ở tầng API | Ảnh `04-so-sanh-phan-hoi.png` |
| 5 | Sau khi `admin` bị khóa, nhập ĐÚNG mật khẩu `Docchat-Dev-2026!` và bấm "Đăng nhập" | Vẫn bị từ chối với thông điệp chung (khóa giữ 15 phút) | Ảnh `05-dung-mat-khau-van-khoa.png` |
| 6 | Trong Console chạy `for(let i=0;i<30;i++){const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:"khong-ton-tai-02",password:"sai"})});console.log(i,r.status,r.headers.get("retry-after"))}` | Các lần đầu 401; khi vượt 20 yêu cầu trong cùng phút xuất hiện 429 mã `RATE_LIMITED`; ghi `Retry-After` nếu có | Ảnh `06-vong-lap-429.png` |
| 7 | Ngay sau vòng lặp, thử đăng nhập một lần trên giao diện | Hiện thông điệp "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút." | Ảnh `07-thong-bao-429.png` |
| 8 | Chờ sang phút kế tiếp, đăng nhập `khong-ton-tai-01` + mật khẩu sai | Trở lại 401 với thông điệp chung (hết giới hạn tần suất) | Ảnh `08-het-gioi-han.png` |
| 9 | (Chờ hỏi đáp) Gửi liên tục câu hỏi vượt hạn mức | 429 `RATE_LIMITED`; ô nhập hiện thông điệp và tự mở khóa sau thời gian chờ | Ảnh `09-han-muc-cau-hoi.png` |

**Lưu ý:** Test Plan viết "`429` đúng"; thực tế khóa tài khoản trả 423 (`ACCOUNT_LOCKED`), còn 429 chỉ dành cho giới hạn tần suất theo IP/phút. Hai cơ chế khác nhau, cả hai cần được thể hiện ở kết quả.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Vượt 20 yêu cầu đăng nhập/phút nhận 429 `RATE_LIMITED`, giao diện hiện "Bạn thao tác quá nhanh…".
2. 5 lần sai liên tiếp khóa tài khoản; giao diện dùng cùng một thông điệp cho sai tên, sai mật khẩu, bị khóa (không dò được tài khoản).
3. Hết thời gian chờ thì đăng nhập lại được.
**Không đạt nếu:** thông điệp giao diện khác nhau giữa tên đúng/sai/bị khóa; không bao giờ có 429; khóa tài khoản không có hiệu lực; lộ tên tồn tại.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-13/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-13/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-13//video/TC-SEC-13.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-13//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-13//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-13//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-13
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-13.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

