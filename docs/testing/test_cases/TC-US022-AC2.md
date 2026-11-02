# TC-US022-AC2 — US-022 — Đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích" — tiêu chí AC2

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-022 — Đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích" (P1, Pha 2)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US022-AC2 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Trung bình |
| Mức/loại, tự động hóa | API (Tự động) |
| Trạng thái điều kiện | Sẵn sàng |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US022-AC2/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Tôi đã đánh giá một câu trả lời

### Các bước (When)

Tôi đổi lựa chọn

### Kết quả mong đợi (Then)

Hệ thống chỉ giữ đánh giá mới nhất cho câu trả lời đó

### Dữ liệu / ghi chú

Theo AC

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Cần hỏi đáp chạy được: có tài liệu ở trạng thái "Sẵn sàng" (cần xử lý nền T08) và ô "Câu hỏi về tài liệu" mở khóa. Hiện cả hai CHƯA có.
- Có một câu trả lời (id `messageId`) đã được đánh giá "Hữu ích". Ca kiểm bằng API (chưa có đường dẫn ghi đánh giá trong `api/openapi.yaml`: [TBD: đường dẫn IF đánh giá]) kèm đối chiếu CSDL/danh sách đánh giá.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; các bước 1–4 (đăng nhập và quan sát trạng thái hiện tại) vẫn chạy được để chứng minh; các bước 5–9 là đặc tả theo thiết kế, chạy khi có tính năng.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Quan sát ô "Câu hỏi về tài liệu" (placeholder "Nhập câu hỏi…") ở khu "Hội thoại" | Ô bị khóa (disabled), không gõ được; dòng trợ giúp bên dưới là "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi." (bằng chứng chặn: không thể đặt câu hỏi) | Ảnh `04-o-hoi-bi-khoa.png` |
| 5 | Gửi đánh giá "Hữu ích" cho câu trả lời `messageId` (API hoặc nút "Hữu ích") | Phản hồi 2xx; đánh giá hiện tại của câu trả lời là "Hữu ích" | Ảnh `05-danh-gia-lan-1.png` |
| 6 | Đổi lựa chọn thành "Không hữu ích" cho cùng `messageId` | Phản hồi 2xx; giao diện chỉ còn "Không hữu ích" được chọn | Ảnh `06-doi-lua-chon.png` |
| 7 | Truy vấn số đánh giá của `messageId` (CSDL hoặc API đọc) | Chỉ có MỘT đánh giá cho cặp (người dùng, câu trả lời) và giá trị là "Không hữu ích" (đánh giá mới nhất); không có bản ghi trùng | Ảnh `07-chi-con-moi-nhat.png` |
| 8 | Gửi lại đánh giá "Hữu ích" lần nữa rồi truy vấn lại | Vẫn chỉ MỘT bản ghi, giá trị "Hữu ích" (không cộng dồn) | Ảnh `08-doi-lai.png` |
| 9 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `09-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Sau khi đổi lựa chọn, hệ thống chỉ giữ đánh giá mới nhất cho câu trả lời.
2. Số bản ghi đánh giá của (người dùng, câu trả lời) luôn = 1.
**Không đạt nếu:** còn cả đánh giá cũ và mới, hoặc có bản ghi trùng.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US022-AC2/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US022-AC2/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US022-AC2//video/TC-US022-AC2.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US022-AC2//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US022-AC2//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US022-AC2//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US022-AC2
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US022-AC2.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

