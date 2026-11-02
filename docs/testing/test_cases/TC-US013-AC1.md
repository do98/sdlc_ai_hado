# TC-US013-AC1 — US-013 — Hỏi tiếp dựa trên câu hỏi và trả lời trước — tiêu chí AC1

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-013 — Hỏi tiếp dựa trên câu hỏi và trả lời trước (P1, Pha 2)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US013-AC1 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Trung bình |
| Mức/loại, tự động hóa | EVAL (Bán tự động) |
| Trạng thái điều kiện | Sẵn sàng |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US013-AC1/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Tôi vừa nhận một câu trả lời về điều khoản X

### Các bước (When)

Tôi hỏi "Còn thời hạn của **nó** thì sao?"

### Kết quả mong đợi (Then)

Câu trả lời hiểu "nó" là điều khoản X

### Dữ liệu / ghi chú

Theo AC

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Cần hỏi đáp chạy được: có tài liệu ở trạng thái "Sẵn sàng" (cần xử lý nền T08) và ô "Câu hỏi về tài liệu" mở khóa. Hiện cả hai CHƯA có.
- Dữ liệu: `./test_reports/TC-US013-AC1/data/hop-dong-A.pdf` (TD-01, tiếng Việt, 1 trang). PDF có văn bản chọn được (không phải ảnh): in từ HTML bằng Playwright `page.pdf()` (Edge/Chromium) hoặc tạo bằng thư viện PDF; mỗi dòng dưới đây là một đoạn văn trên trang 1: "Điều 3 – Giá: Giá hợp đồng là 500.000.000 đồng, chưa gồm thuế VAT." / "Điều 4 – Giao hàng: Bên bán giao hàng trong 15 ngày kể từ ngày ký hợp đồng." / "Điều 5 – Bảo hành: Bên bán bảo hành thiết bị 12 tháng kể từ ngày nghiệm thu." / "Điều 6 – Thanh toán: Bên mua thanh toán trong 30 ngày kể từ ngày nhận hóa đơn." / "Điều 7 – Phạt vi phạm: Bên vi phạm chịu phạt 2% giá trị hợp đồng khi giao hàng chậm quá 15 ngày."
- Khu "Hội thoại" ở phiên mới, chưa có câu hỏi nào; không bấm tạo phiên mới giữa hai câu hỏi.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; các bước 1–6 (đăng nhập, tải tài liệu lên và quan sát trạng thái hiện tại) vẫn chạy được để chứng minh; các bước 7–14 là đặc tả theo thiết kế, chạy khi có tính năng.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Bấm nút "Tải PDF lên" rồi chọn tệp `./test_reports/TC-US013-AC1/data/hop-dong-A.pdf` (tự động hóa: đưa tệp vào ô nhập có nhãn "Chọn tệp PDF để tải lên") | Hàng của `hop-dong-A.pdf` hiện ở vùng tải lên với trạng thái "Đang tải N%" rồi "Đã tải lên, đang xử lý"; tab mạng: `POST /api/documents` trả 202 | Ảnh `04-tai-hop-dong-A.png` |
| 5 | Chờ 5 giây rồi quan sát danh sách dưới nhãn "Danh sách tài liệu" | Hàng `hop-dong-A.pdf` có tên tệp, dung lượng và trạng thái "Đang xử lý"; trạng thái KHÔNG chuyển sang "Sẵn sàng" (xử lý nền T08 chưa có) | Ảnh `05-trang-thai-hop-dong-A.png` |
| 6 | Quan sát ô "Câu hỏi về tài liệu" (placeholder "Nhập câu hỏi…") ở khu "Hội thoại" | Ô bị khóa (disabled), không gõ được; dòng trợ giúp bên dưới là "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi." (bằng chứng chặn: không thể đặt câu hỏi) | Ảnh `06-o-hoi-bi-khoa.png` |
| 7 | Chờ tới khi `hop-dong-A.pdf` có trạng thái "Sẵn sàng" (theo thiết kế; tối đa theo ngưỡng xử lý của US-004) | Mỗi tài liệu hiển thị "Sẵn sàng"; ô "Câu hỏi về tài liệu" được mở khóa | Ảnh `07-tai-lieu-san-sang.png` |
| 8 | Nhập câu hỏi `Điều 5 quy định gì về bảo hành?` vào ô "Câu hỏi về tài liệu" | Ô chứa đúng nội dung vừa nhập; chưa có thông báo lỗi | Ảnh `08-nhap-cau-1.png` |
| 9 | Gửi câu hỏi (nút gửi hoặc phím Enter theo thiết kế) | Câu hỏi hiện trong khu "Hội thoại"; câu trả lời được truyền về và kết thúc (không còn chỉ báo đang trả lời) | Ảnh `09-tra-loi-cau-1.png` |
| 10 | Quan sát câu trả lời thứ nhất | Câu trả lời nêu bảo hành 12 tháng kể từ ngày nghiệm thu, kèm trích dẫn `hop-dong-A.pdf`, trang 1 (xác lập điều kiện "vừa nhận câu trả lời về điều khoản X = Điều 5") | Ảnh `10-doi-chieu-cau-1.png` |
| 11 | Nhập câu hỏi `Còn thời hạn của **nó** thì sao?` vào ô "Câu hỏi về tài liệu" | Ô chứa đúng nội dung vừa nhập; chưa có thông báo lỗi | Ảnh `11-nhap-cau-2.png` |
| 12 | Gửi câu hỏi (nút gửi hoặc phím Enter theo thiết kế) | Câu hỏi hiện trong khu "Hội thoại"; câu trả lời được truyền về và kết thúc (không còn chỉ báo đang trả lời) | Ảnh `12-tra-loi-cau-2.png` |
| 13 | Đối chiếu câu trả lời thứ hai với tài liệu mẫu | "nó" được hiểu là điều khoản bảo hành (Điều 5): câu trả lời nêu 12 tháng kể từ ngày nghiệm thu; KHÔNG trả lời bằng thời hạn thanh toán 30 ngày hay hỏi lại "nó là gì" | Ảnh `13-doi-chieu-cau-2.png` |
| 14 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `14-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Câu trả lời thứ nhất nói về Điều 5 – Bảo hành (12 tháng).
2. Câu trả lời thứ hai, gửi trong cùng phiên, hiểu "nó" là điều khoản bảo hành và nêu thời hạn 12 tháng.
3. Câu trả lời thứ hai không lấy thời hạn của điều khoản khác (30 ngày thanh toán, 15 ngày giao hàng) làm đáp án.
**Không đạt nếu:** câu trả lời thứ hai nói về điều khoản khác, hỏi lại người dùng "nó" là gì, hoặc báo không tìm thấy thông tin.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US013-AC1/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US013-AC1/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US013-AC1//video/TC-US013-AC1.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US013-AC1//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US013-AC1//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US013-AC1//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US013-AC1
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US013-AC1.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

