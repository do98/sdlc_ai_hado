# TC-DATA-05 — Bộ PDF: có chữ, bảng, nhiều cột, nửa scan, scan, mật khẩu, hỏng, 101 trang, đúng biên dung lượng

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-05 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | US-005, RISK-04 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | DT, IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-05/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Bộ PDF: có chữ, bảng, nhiều cột, nửa scan, scan, mật khẩu, hỏng, 101 trang, đúng biên dung lượng
- **Kết quả mong đợi:** Trạng thái và cảnh báo đúng từng loại
- **Ưu:** C
- **Loại:** DT, IT
- **Truy vết:** US-005, RISK-04

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Chưa có chức năng xóa tài liệu nên mỗi tệp tải lên chiếm 1 trong 20 chỗ của kho dev: ghi lại bộ đếm "Đã dùng N/20 tài liệu" trước/sau và chỉ tải số tệp tối thiểu.
- Bộ PDF đặt ở `test_reports/TC-DATA-05/data/pdf/` (ghi cách tạo từng tệp vào `data/pdf/README.txt`): `chu-thuong.pdf` (vài trang chữ, xuất từ Word/LibreOffice); `bang.pdf` (trang có bảng nhiều ô); `nhieu-cot.pdf` (bố cục 2–3 cột); `nua-scan.pdf` (ghép trang chữ với 1–2 trang chỉ có ảnh, không lớp chữ; ghi số trang ảnh); `scan.pdf` (toàn bộ ảnh chụp/scan, không lớp chữ); `mat-khau.pdf` (mã hóa mật khẩu mở: `qpdf --encrypt matkhau matkhau 256 -- chu-thuong.pdf mat-khau.pdf`); `hong.pdf` (bị cắt cụt nhưng còn đầu `%PDF-`: `node -e "const fs=require('fs');fs.writeFileSync('hong.pdf',fs.readFileSync('chu-thuong.pdf').subarray(0,1500))"`); `100-trang.pdf` (đúng 100 trang) và `101-trang.pdf` (101 trang); `bien-10mb.pdf` đúng 10 485 760 byte và `vuot-bien.pdf` đúng 10 485 761 byte (độn bằng khoảng trắng: `node -e "const fs=require('fs');const h=Buffer.from('%PDF-1.4\\n');const t=Buffer.from('\\n%%EOF');fs.writeFileSync('bien-10mb.pdf',Buffer.concat([h,Buffer.alloc(10485760-h.length-t.length,0x20),t]));fs.writeFileSync('vuot-bien.pdf',Buffer.concat([h,Buffer.alloc(10485761-h.length-t.length,0x20),t]))"`); `gia-pdf.pdf` (tệp văn bản đổi đuôi `.pdf`).
- Số lượng tài liệu: bộ tải lên hợp lệ ~12 tệp vượt 20 chỗ khi kết hợp với dữ liệu sẵn có; tải theo từng đợt, ghi lại bộ đếm "Đã dùng N/20 tài liệu" và dọn kho (SQL `UPDATE documents SET status='DELETED'` — cần quyền hạ tầng) giữa các đợt.
- Hai nhóm kết quả: (1) từ chối ngay lúc tải (đã hiện thực, kiểm được hôm nay); (2) trạng thái sau xử lý nền theo loại PDF (T08, chưa hiện thực).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn `gia-pdf.pdf` | Dòng `gia-pdf.pdf` hiển thị "Bị từ chối" với lý do "Tệp không phải PDF. Chỉ hỗ trợ tệp định dạng PDF."; bộ đếm không tăng | Ảnh `05-tu-choi-khong-phai-pdf.png` |
| 6 | Bấm "Tải PDF lên" và chọn `vuot-bien.pdf` (10 485 761 byte) | Dòng hiển thị "Bị từ chối" với lý do "Tệp vượt giới hạn cho phép (tối đa 10 MB và 100 trang)."; bộ đếm không tăng | Ảnh `06-tu-choi-vuot-bien.png` |
| 7 | Bấm "Tải PDF lên" và chọn `bien-10mb.pdf` (10 485 760 byte) | Dòng hiển thị "Đã tải lên, đang xử lý" (đúng biên được nhận); bộ đếm tăng 1 | Ảnh `07-chap-nhan-dung-bien.png` |
| 8 | Bấm "Tải PDF lên" và chọn đồng thời `chu-thuong.pdf`, `bang.pdf`, `nhieu-cot.pdf`, `nua-scan.pdf`, `scan.pdf`, `mat-khau.pdf`, `hong.pdf`, `101-trang.pdf` | Cả 8 dòng hiển thị "Đã tải lên, đang xử lý" (máy chủ chỉ kiểm loại/dung lượng/chỗ trống lúc tải; lỗi nội dung do xử lý nền kết luận); bộ đếm tăng 8 | Ảnh `08-tai-8-loai.png` |
| 9 | Chờ 30 giây rồi quan sát danh sách tài liệu | Hiện tại: cả 9 tệp ở "Đang xử lý", KHÔNG chuyển trạng thái nào (chưa có T08) → chứng minh Bị chặn | Ảnh `09-chua-co-xu-ly-nen.png` |
| 10 | (Thiết kế — chạy khi có T08) Quan sát dòng `chu-thuong.pdf`, `bang.pdf`, `nhieu-cot.pdf` | Cả ba hiển thị "Sẵn sàng" kèm số trang "N trang", không cảnh báo | Ảnh `10-ba-tep-san-sang.png` |
| 11 | (Thiết kế) Quan sát dòng `nua-scan.pdf` | Hiển thị "Sẵn sàng, có cảnh báo" và dòng "Một số trang không đọc được: <số các trang ảnh>" khớp trang ảnh đã ghi | Ảnh `11-nua-scan-canh-bao.png` |
| 12 | (Thiết kế) Quan sát dòng `scan.pdf` | Hiển thị "Lỗi" với "Tệp là ảnh scan, không có văn bản để đọc." | Ảnh `12-scan-loi.png` |
| 13 | (Thiết kế) Quan sát dòng `mat-khau.pdf` và `hong.pdf` | `mat-khau.pdf`: "Lỗi" với "Tệp có mật khẩu bảo vệ. Hãy gỡ mật khẩu rồi tải lên lại."; `hong.pdf`: "Lỗi" với "Tệp bị hỏng, không mở được." | Ảnh `13-mat-khau-hong-loi.png` |
| 14 | (Thiết kế) Quan sát dòng `101-trang.pdf`, sau đó tải `100-trang.pdf` | `101-trang.pdf`: "Lỗi" với "Tệp quá 100 trang."; `100-trang.pdf`: "Sẵn sàng" "100 trang" | Ảnh `14-bien-101-100-trang.png` |

**Hiện trạng:** nhóm (1) chạy được hôm nay; nhóm (2) trạng thái xử lý nền theo loại PDF chưa hiện thực → kết luận dự kiến "Bị chặn" cho phần (2); bước 1–9 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Hôm nay (đã hiện thực): `gia-pdf.pdf` bị từ chối "Tệp không phải PDF…"; 10 485 761 byte bị từ chối "Tệp vượt giới hạn cho phép (tối đa 10 MB và 100 trang)."; 10 485 760 byte được nhận; tệp lỗi nội dung vẫn được nhận lúc tải.
2. Khi có T08: chữ/bảng/nhiều cột → "Sẵn sàng"; nửa scan → "Sẵn sàng, có cảnh báo" + danh sách trang không đọc được; scan → "Lỗi" (`SCANNED_NO_TEXT`); mật khẩu → "Lỗi" (`PASSWORD_PROTECTED`); hỏng → "Lỗi" (`CORRUPT`); 101 trang → "Lỗi" (`TOO_MANY_PAGES`), 100 trang → "Sẵn sàng".
3. Mỗi loại có thông báo/cảnh báo đúng nội dung tiếng Việt đã nêu, không loại nào bị gán nhầm trạng thái.

**Không đạt nếu:** lỗi nội dung ở lúc tải bị nhận sai; biên 10 MB bị từ chối; tệp scan hiển thị "Sẵn sàng" không cảnh báo; thông báo sai loại lỗi.

**Lưu ý:** Số trang chỉ do T08 kết luận (`TOO_MANY_PAGES`), máy chủ lúc tải KHÔNG kiểm số trang dù thông báo `fileTooLarge` nhắc "100 trang". Giao diện còn kiểm trước ở máy khách: đuôi `.pdf` và 5 byte đầu `%PDF-` (máy chủ nới hơn: `%PDF-` ở bất kỳ vị trí nào trong 1024 byte đầu). Tệp tải vượt chỗ còn lại hiển thị "Kho đã đủ 20 tài liệu nên không thể tải thêm.".

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-05/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-05/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-05//video/TC-DATA-05.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-05//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-05//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-05//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-05
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-05.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

