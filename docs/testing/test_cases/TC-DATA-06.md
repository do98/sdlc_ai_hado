# TC-DATA-06 — Chuẩn hóa tiếng Việt NFC/NFD trong tên tệp, câu hỏi, nội dung

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-06 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | RISK-05 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | UT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-06/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Chuẩn hóa tiếng Việt NFC/NFD trong tên tệp, câu hỏi, nội dung
- **Kết quả mong đợi:** Truy xuất và hiển thị nhất quán
- **Ưu:** C
- **Loại:** UT
- **Truy vết:** RISK-05

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Chưa có chức năng xóa tài liệu nên mỗi tệp tải lên chiếm 1 trong 20 chỗ của kho dev: ghi lại bộ đếm "Đã dùng N/20 tài liệu" trước/sau và chỉ tải số tệp tối thiểu.
- Tạo hai tệp tên NFC và NFD của cùng một chuỗi trong `test_reports/TC-DATA-06/data/`: chạy `node -e "const fs=require('fs');const s='Tài liệu hoàn tiền Việt Nam.pdf';const pdf='%PDF-1.4\\n1 0 obj<<>>endobj\\ntrailer<<>>\\n%%EOF';fs.writeFileSync(s.normalize('NFC'),pdf);fs.writeFileSync('nfd-'+s.normalize('NFD'),pdf)"` (tệp thứ hai có tiền tố `nfd-` để phân biệt trên đĩa, phần tên phía sau ở dạng NFD; hệ điều hành Windows có thể tự chuẩn hóa tên — ghi lại tên đọc được trong DevTools).
- Kiểm tra dạng chuẩn hóa trong Console DevTools: `const d=(await (await fetch('/api/documents')).json()).items;d.map(x=>[x.name,x.name===x.name.normalize('NFC'),[...x.name].length])`.
- Kiểm tra trong CSDL (cần hạ tầng, chỉ đọc): `psql -h localhost -p 54329 -U postgres -d postgres -c "SELECT name, name = normalize(name, NFC) AS nfc FROM documents;"` (hàm `normalize` cần PostgreSQL ≥ 13, `[Unverified]` với bản nhúng).
- Kiểm tra khóa lưu trữ không chứa tên tệp (cần hạ tầng): `Get-ChildItem -Recurse -File apps\api\target\dev-storage` — tên dạng `documents\<userId>\<documentId>.pdf`.
- Kiểm thử mã tương ứng: `T07_chuan_hoa_ten_tep_nfc_bo_duong_dan_cat_do_dai_khong_vao_khoa_luu_tru` trong `DocumentUploadApiTest` (`./mvnw -Dtest=DocumentUploadApiTest test` trong `apps/api`).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm "Tải PDF lên" và chọn tệp tên NFC `Tài liệu hoàn tiền Việt Nam.pdf` | Dòng hiển thị "Tài liệu hoàn tiền Việt Nam.pdf" "Đã tải lên, đang xử lý" | Ảnh `05-tai-ten-nfc.png` |
| 6 | Bấm "Tải PDF lên" và chọn tệp tên NFD `nfd-…` (tên có dấu ở dạng tổ hợp NFD) | Dòng được nhận; tên hiển thị đọc đúng tiếng Việt có dấu, không tách dấu rời ký tự (không có ô vuông, dấu lệch) | Ảnh `06-tai-ten-nfd.png` |
| 7 | Chạy đoạn Console kiểm `normalize('NFC')` ở điều kiện tiên quyết | Mọi `name` trả `true` (đã chuẩn hóa NFC phía máy chủ) và số ký tự của tên NFD sau chuẩn hóa bằng số ký tự của tên NFC | Tệp/log `data/console-nfc.txt` kèm ảnh màn hình `07-console-nfc.png` |
| 8 | Quan sát danh sách tài liệu | Hai dòng hiển thị cùng một tên trực quan (không phân biệt được NFC/NFD bằng mắt) và cùng cách sắp/hiển thị | Ảnh `08-hai-ten-giong-nhau.png` |
| 9 | (Cần hạ tầng) Chạy truy vấn `SELECT name, name = normalize(name, NFC) FROM documents;` | Cột `nfc` đều `t` | Tệp/log `data/sql-nfc.txt` kèm ảnh màn hình `09-sql-nfc.png` |
| 10 | (Cần hạ tầng) Liệt kê tệp trong `apps\api\target\dev-storage` | Tên tệp dạng `<documentId>.pdf` dưới thư mục userId; KHÔNG chứa chữ "Tài liệu" hay bất kỳ phần nào của tên gốc | Tệp/log `data/khoa-luu-tru.txt` kèm ảnh màn hình `10-khoa-luu-tru.png` |
| 11 | (Thiết kế — chạy khi có hỏi đáp) Hỏi cùng một câu `hoàn tiền` ở dạng NFC rồi NFD | Hai câu trả lời có cùng nội dung và cùng danh sách trích dẫn; tên tài liệu trong trích dẫn hiển thị nhất quán dạng NFC | Ảnh `11-hoi-nfc-nfd.png` |
| 12 | (Thiết kế) Tải PDF có nội dung chữ viết ở dạng NFD rồi hỏi bằng dạng NFC | Truy xuất vẫn tìm thấy đoạn nguồn (nội dung được chuẩn hóa khi lập chỉ mục) | Ảnh `12-noi-dung-nfd-truy-xuat.png` |

**Hiện trạng:** phần tên tệp chạy được hôm nay; phần câu hỏi/nội dung phụ thuộc hỏi đáp chưa hiện thực → kết luận dự kiến "Đạt một phần, phần câu hỏi/nội dung Bị chặn"; bước 1–10 vẫn chạy được để chứng minh (bước 9–10 cần quyền hạ tầng).

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Tên tệp NFD và NFC đều được lưu và hiển thị ở dạng NFC thống nhất (`name === name.normalize('NFC')`), hiển thị đúng dấu tiếng Việt.
2. Khóa lưu trữ không chứa tên tệp gốc.
3. Khi có hỏi đáp: câu hỏi NFC/NFD cho cùng kết quả truy xuất và hiển thị nhất quán; nội dung NFD vẫn truy xuất được (chưa kiểm được hiện tại).

**Không đạt nếu:** tên hiển thị khác nhau giữa NFC và NFD; dấu bị tách/lệch; hai tài liệu cùng tên cho kết quả hỏi đáp khác nhau; khóa lưu trữ chứa tên gốc.

**Lưu ý:** Test Plan loại UT: phần chuẩn hóa tên tệp đã hiện thực (`DocumentUploadService.sanitizeName` dùng NFC); phần câu hỏi và nội dung chưa có. Windows và một số trình duyệt có thể tự chuẩn hóa tên tệp lúc chọn, nên nếu cần ép NFD hãy gửi qua `fetch` với `File` tạo trong Console: `new File(['%PDF-1.4'],'Tài liệu.pdf'.normalize('NFD'),{type:'application/pdf'})`.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-06/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-06/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-06//video/TC-DATA-06.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-06//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-06//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-06//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-06
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-06.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

