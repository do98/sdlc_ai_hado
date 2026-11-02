# TC-US017-AC1 — US-017 — Xem danh sách tài liệu tôi được phép truy cập — tiêu chí AC1

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-017 — Xem danh sách tài liệu tôi được phép truy cập (P0, Pha 1)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US017-AC1 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Cao |
| Mức/loại, tự động hóa | API+E2E (Tự động) |
| Trạng thái điều kiện | Sẵn sàng |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US017-AC1/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Tôi được phép truy cập đúng 3 tài liệu

### Các bước (When)

Tôi mở danh sách

### Kết quả mong đợi (Then)

Tôi thấy đúng 3 tài liệu với tên tệp và trạng thái

### Dữ liệu / ghi chú

Theo AC

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Kho đang trống (0 tài liệu) hoặc đã ghi nhận số tài liệu ban đầu N: kiểm bằng cách mở `http://localhost:5173/api/documents` sau khi đăng nhập, ghi `count`. Hiện chưa có chức năng xóa, nên kho dùng chung và cộng dồn giữa các ca; chỉ khi N = 0 thì "đúng 3" kiểm được nguyên văn, ngược lại kiểm "N + 3".
- Tạo 3 PDF tối thiểu (TD-01, tên có dấu) trong `./test_reports/TC-US017-AC1/data/`: `bao-cao-quy-1.pdf`, `hop-dong-thuê.pdf`, `huong-dan-van-hanh.pdf`. Tạo PDF tối thiểu (đủ qua kiểm tra `%PDF-`), chạy tại thư mục gốc repo: `node -e "const fs=require('fs');fs.mkdirSync('test_reports/TC-US017-AC1/data',{recursive:true});fs.writeFileSync('test_reports/TC-US017-AC1/data/bao-cao-quy-1.pdf','%PDF-1.4\n%%EOF\n')"` (lặp với hai tên còn lại).
- Trình duyệt ở viewport từ 1280 px trở lên để thấy khu "Tài liệu".

## Các bước thực hiện
**Lưu ý:** Test Plan nêu "được phép truy cập đúng 3 tài liệu" nhưng ứng dụng hiện dùng một kho chung (không có phân quyền theo tài liệu) và không xóa được; vì vậy đây là kiểm số lượng và nội dung, không kiểm phạm vi truy cập. Trạng thái luôn là "Đang xử lý" do T08 chưa có (trạng thái "Sẵn sàng" chưa quan sát được).

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Mở `http://localhost:5173/api/documents` ở thẻ mới và ghi lại `count` ban đầu (N) | Phản hồi 200, JSON có `items`, `count`, `limit` = 20; ghi N (N = 0 nếu kho trống) | Ảnh `04-so-luong-ban-dau.png` |
| 5 | Bấm nút "Tải PDF lên" rồi chọn tệp `./test_reports/TC-US017-AC1/data/bao-cao-quy-1.pdf` (tự động hóa: đưa tệp vào ô nhập có nhãn "Chọn tệp PDF để tải lên") | Hàng của `bao-cao-quy-1.pdf` hiện ở vùng tải lên với trạng thái "Đang tải N%" rồi "Đã tải lên, đang xử lý"; tab mạng: `POST /api/documents` trả 202 | Ảnh `05-tai-bao-cao-quy-1.png` |
| 6 | Chờ 5 giây rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Hàng `bao-cao-quy-1.pdf` có tên tệp, dung lượng và trạng thái "Đang xử lý"; trạng thái KHÔNG chuyển sang "Sẵn sàng" (xử lý nền T08 chưa có) | Ảnh `06-trang-thai-bao-cao-quy-1.png` |
| 7 | Bấm nút "Tải PDF lên" rồi chọn tệp `./test_reports/TC-US017-AC1/data/hop-dong-thuê.pdf` (tự động hóa: đưa tệp vào ô nhập có nhãn "Chọn tệp PDF để tải lên") | Hàng của `hop-dong-thuê.pdf` hiện ở vùng tải lên với trạng thái "Đang tải N%" rồi "Đã tải lên, đang xử lý"; tab mạng: `POST /api/documents` trả 202 | Ảnh `07-tai-hop-dong-thue.png` |
| 8 | Chờ 5 giây rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Hàng `hop-dong-thuê.pdf` có tên tệp, dung lượng và trạng thái "Đang xử lý"; trạng thái KHÔNG chuyển sang "Sẵn sàng" (xử lý nền T08 chưa có) | Ảnh `08-trang-thai-hop-dong-thue.png` |
| 9 | Bấm nút "Tải PDF lên" rồi chọn tệp `./test_reports/TC-US017-AC1/data/huong-dan-van-hanh.pdf` (tự động hóa: đưa tệp vào ô nhập có nhãn "Chọn tệp PDF để tải lên") | Hàng của `huong-dan-van-hanh.pdf` hiện ở vùng tải lên với trạng thái "Đang tải N%" rồi "Đã tải lên, đang xử lý"; tab mạng: `POST /api/documents` trả 202 | Ảnh `09-tai-huong-dan-van-hanh.png` |
| 10 | Chờ 5 giây rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Hàng `huong-dan-van-hanh.pdf` có tên tệp, dung lượng và trạng thái "Đang xử lý"; trạng thái KHÔNG chuyển sang "Sẵn sàng" (xử lý nền T08 chưa có) | Ảnh `10-trang-thai-huong-dan-van-hanh.png` |
| 11 | Tải lại trang (F5) rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Danh sách có đúng 3 hàng mới (cộng với N hàng cũ nếu có): `bao-cao-quy-1.pdf`, `hop-dong-thuê.pdf`, `huong-dan-van-hanh.pdf`; mỗi hàng có tên tệp, dung lượng, trạng thái "Đang xử lý"; bộ đếm hiện "Đã dùng N+3/20 tài liệu" | Ảnh `11-danh-sach-3.png` |
| 12 | Mở lại `http://localhost:5173/api/documents` và so sánh với giao diện | `count` = N + 3; mỗi `items[].name` và `items[].status` (= `PROCESSING`) khớp hàng trên giao diện; thứ tự mới nhất trước | Ảnh `12-api-3.png` |
| 13 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `13-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Danh sách hiển thị đúng 3 tài liệu vừa tải (tổng N + 3; khi N = 0 là đúng 3).
2. Mỗi hàng có tên tệp đúng (kể cả dấu) và trạng thái "Đang xử lý".
3. `GET /api/documents` trả `count` = N + 3, khớp giao diện.
**Không đạt nếu:** thiếu/thừa hàng so với API, tên tệp sai dấu, hoặc hàng không có trạng thái.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US017-AC1/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US017-AC1/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US017-AC1//video/TC-US017-AC1.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US017-AC1//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US017-AC1//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US017-AC1//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US017-AC1
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US017-AC1.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

