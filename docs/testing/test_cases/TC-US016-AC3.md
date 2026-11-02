# TC-US016-AC3 — US-016 — Xem đoạn nội dung gốc ứng với mỗi trích dẫn — tiêu chí AC3

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-016 — Xem đoạn nội dung gốc ứng với mỗi trích dẫn (P1, Pha 1)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US016-AC3 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Trung bình |
| Mức/loại, tự động hóa | SEC+API (Tự động) |
| Trạng thái điều kiện | Chờ mô hình quyền (OQ-007 — A.8-1) |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US016-AC3/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Tôi không còn quyền truy cập tài liệu nguồn

### Các bước (When)

Tôi nhấp vào trích dẫn

### Kết quả mong đợi (Then)

Hệ thống từ chối hiển thị đoạn gốc

### Dữ liệu / ghi chú

Phản hồi `404`; không lộ sự tồn tại

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Cần hỏi đáp chạy được: có tài liệu ở trạng thái "Sẵn sàng" (cần xử lý nền T08) và ô "Câu hỏi về tài liệu" mở khóa. Hiện cả hai CHƯA có.
- Hiện chỉ có MỘT tài khoản (`admin`, vai trò ADMIN); chưa có chức năng tạo/gán người dùng, nên các điều kiện "người dùng khác" chỉ thiết lập được khi có phân quyền nhiều người dùng (seed TD-09: người dùng thường A, B).
- Dữ liệu: `./test_reports/TC-US016-AC3/data/hop-dong-A.pdf` do người dùng A tải lên; người dùng B (đã có câu trả lời với trích dẫn từ A) sau đó bị mất quyền truy cập A (thu hồi/hết chia sẻ). Cần mã của đoạn trích dẫn (id) để gọi API trực tiếp.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; các bước 1–7 (đăng nhập, tải tài liệu lên và quan sát trạng thái hiện tại) vẫn chạy được để chứng minh; các bước 8–12 là đặc tả theo thiết kế, chạy khi có tính năng.

**Lưu ý:** Mã lỗi `NOT_FOUND` (404, "không tồn tại hoặc không có quyền xem — không phân biệt") khớp `api/openapi.yaml`. Đường dẫn API lấy đoạn gốc chưa có trong openapi.yaml (hiện chỉ có `GET /api/documents/{id}/file`, `x-implemented: false`); ghi lại đường dẫn thực khi hiện thực.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Bấm nút "Tải PDF lên" rồi chọn tệp `./test_reports/TC-US016-AC3/data/hop-dong-A.pdf` (tự động hóa: đưa tệp vào ô nhập có nhãn "Chọn tệp PDF để tải lên") | Hàng của `hop-dong-A.pdf` hiện ở vùng tải lên với trạng thái "Đang tải N%" rồi "Đã tải lên, đang xử lý"; tab mạng: `POST /api/documents` trả 202 | Ảnh `04-tai-hop-dong-A.png` |
| 5 | Chờ 5 giây rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Hàng `hop-dong-A.pdf` có tên tệp, dung lượng và trạng thái "Đang xử lý"; trạng thái KHÔNG chuyển sang "Sẵn sàng" (xử lý nền T08 chưa có) | Ảnh `05-trang-thai-hop-dong-A.png` |
| 6 | Quan sát ô "Câu hỏi về tài liệu" (placeholder "Nhập câu hỏi…") ở khu "Hội thoại" | Ô bị khóa (disabled), không gõ được; dòng trợ giúp bên dưới là "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi." (bằng chứng chặn: không thể đặt câu hỏi) | Ảnh `06-o-hoi-bi-khoa.png` |
| 7 | Quan sát khu "Nguồn" (cột phải hoặc nút "Mở ngăn nguồn") | Hiện nguyên văn "Chọn một trích dẫn trong câu trả lời để xem đoạn nguồn." — chưa có trích dẫn nào để chọn | Ảnh `07-khu-nguon-trong.png` |
| 8 | Chờ tới khi `hop-dong-A.pdf` có trạng thái "Sẵn sàng" (theo thiết kế; tối đa theo ngưỡng xử lý của US-004) | Mỗi tài liệu hiển thị "Sẵn sàng"; ô "Câu hỏi về tài liệu" được mở khóa | Ảnh `08-tai-lieu-san-sang.png` |
| 9 | Với người dùng B, bấm vào trích dẫn `hop-dong-A.pdf` trong câu trả lời cũ sau khi B bị mất quyền | Khu "Nguồn" KHÔNG hiện đoạn gốc; hiện thông báo "Không tìm thấy nội dung yêu cầu." (hoặc tương đương không lộ tài liệu có tồn tại) | Ảnh `09-tu-choi-ui.png` |
| 10 | Trong DevTools (tab Network) kiểm tra yêu cầu lấy đoạn gốc vừa gửi | Phản hồi 404, `code` = `NOT_FOUND`; thân phản hồi không nêu tên tài liệu hay lý do phân quyền | Ảnh `10-tu-choi-404.png` |
| 11 | Gọi cùng yêu cầu với một mã không tồn tại (UUID ngẫu nhiên) và so sánh | Phản hồi giống hệt (cùng mã 404, cùng `code`, cùng cấu trúc thân) → không lộ sự tồn tại | Ảnh `11-so-sanh-id-gia.png` |
| 12 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `12-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Hệ thống từ chối hiển thị đoạn gốc.
2. Phản hồi là 404 `NOT_FOUND` và giống hệt phản hồi của id không tồn tại.
**Không đạt nếu:** đoạn gốc vẫn hiện, hoặc trả 403/200 làm lộ rằng tài liệu tồn tại.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US016-AC3/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US016-AC3/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US016-AC3//video/TC-US016-AC3.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US016-AC3//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US016-AC3//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US016-AC3//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US016-AC3
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US016-AC3.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

