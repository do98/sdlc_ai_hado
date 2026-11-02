# TC-INT-CHUNK — Cắt đoạn: mỗi đoạn đúng trang; `token ≤ tối đa`; offset khớp nội dung; ghép lại tái tạo trang; xác định

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.3 Chức năng bổ sung của kế hoạch phát triển (chưa có story)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-INT-CHUNK |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-015-AC1 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | UT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-INT-CHUNK/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Cắt đoạn: mỗi đoạn đúng trang; `token ≤ tối đa`; offset khớp nội dung; ghép lại tái tạo trang; xác định
- **Kết quả mong đợi:** Đạt 5 bất biến
- **Ưu:** C
- **Loại:** UT
- **Truy vết:** US-015-AC1

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-INT-CHUNK/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Bộ PDF mẫu cố định cho kiểm tra bất biến, đặt ở `test_reports/TC-INT-CHUNK/data/`: (a) `mot-trang.pdf` (1 trang chữ), (b) `nhieu-trang.pdf` (≥ 5 trang, trang dài hơn một đoạn), (c) `tieng-viet.pdf` (có dấu NFC). Tạo bằng Word/LibreOffice xuất PDF, hoặc dùng mẫu TD-xx trong Test_Plan D.1.
- Mã cắt đoạn (T08) chưa tồn tại: khi có, kiểm bằng kiểm thử đơn vị (UT) ví dụ `./mvnw -Dtest=ChunkerTest test` trong `apps/api` (tên lớp dự kiến) và đối chiếu số liệu thực trong CSDL.
- Ngưỡng `token ≤ tối đa` lấy từ cấu hình/kế hoạch `[TBD]` (SDD/OQ liên quan); ghi giá trị thực dùng vào báo cáo.
- Năm bất biến cần kiểm: (1) mỗi đoạn thuộc đúng một trang; (2) `token ≤ tối đa`; (3) `chunks.content` bằng đúng `substring(char_start, char_end)` của văn bản trang; (4) ghép các đoạn của một trang tái tạo được văn bản trang; (5) chạy hai lần cho cùng kết quả (xác định).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Quan sát vùng "Hội thoại", ô "Câu hỏi về tài liệu" | Ô nhập bị khóa kèm dòng "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi." (khi chưa có tài liệu "Sẵn sàng") | Ảnh `05-hoi-dap-bi-khoa.png` |
| 6 | Bấm "Tải PDF lên" rồi chọn `data/ok.pdf` | Hàng đợi tải lên hiện `ok.pdf` với "Đã tải lên, đang xử lý"; bộ đếm tăng thêm 1 | Ảnh `06-tai-len-ok-pdf.png` |
| 7 | Chờ 10 giây rồi quan sát danh sách tài liệu | Dòng `ok.pdf` hiển thị "Đang xử lý" và KHÔNG chuyển sang "Sẵn sàng" (chưa có xử lý nền T08); ô "Câu hỏi về tài liệu" vẫn bị khóa nên không thể thực hiện các bước thiết kế bên dưới | Ảnh `07-dang-xu-ly-mai-mai.png` |
| 8 | Chạy `SELECT count(*) FROM chunks;` bằng psql (cần hạ tầng) | Kết quả 0: chưa có đoạn nào do chưa có chunker (T08) → không kiểm được các bất biến | Tệp/log `data/sql-chunks-rong.txt` kèm ảnh màn hình `08-sql-chunks-rong.png` |
| 9 | (Thiết kế — chạy khi có chunker) Tải `data/nhieu-trang.pdf` bằng "Tải PDF lên" và chờ dòng chuyển "Sẵn sàng" | Dòng hiển thị "Sẵn sàng" và số trang đúng (ví dụ "5 trang") | Ảnh `09-nhieu-trang-san-sang.png` |
| 10 | (Thiết kế) Bất biến 1 và 2: chạy `SELECT id, page, char_start, char_end FROM chunks WHERE document_id = '<id>' ORDER BY page, char_start;` rồi kiểm số trang và số token từng đoạn bằng bộ đếm token của dự án | Mọi đoạn có đúng một `page` ≥ 1 (không đoạn nào vắt qua 2 trang); mọi đoạn có `token ≤ tối đa` | Tệp/log `data/bat-bien-1-2.txt` kèm ảnh màn hình `10-bat-bien-1-2.png` |
| 11 | (Thiết kế) Bất biến 3: với mỗi đoạn so `content` với `substring(văn bản trang, char_start+1, char_end-char_start)` | 100% đoạn khớp từng ký tự; không đoạn nào có `char_end ≤ char_start` | Tệp/log `data/bat-bien-3.txt` kèm ảnh màn hình `11-bat-bien-3.png` |
| 12 | (Thiết kế) Bất biến 4: ghép các đoạn của từng trang theo `char_start` rồi so với văn bản trang trích riêng | Văn bản ghép bằng văn bản trang (nếu có chồng lấn thì sau khi loại phần trùng) | Tệp/log `data/bat-bien-4.txt` kèm ảnh màn hình `12-bat-bien-4.png` |
| 13 | (Thiết kế) Bất biến 5: xử lý lại cùng tệp (hoặc chạy lại chunker) và so băm SHA-256 của danh sách (page, char_start, char_end, content) | Hai băm giống nhau | Tệp/log `data/bat-bien-5.txt` kèm ảnh màn hình `13-bat-bien-5.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–8 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Đạt cả 5 bất biến trên mọi tệp mẫu: mỗi đoạn đúng một trang; token ≤ tối đa; offset khớp nội dung; ghép lại tái tạo trang; kết quả xác định.
2. Có bảng ghi số đoạn kiểm, số vi phạm (phải = 0) cho từng bất biến.
3. Trong giai đoạn hiện tại: bảng `chunks` rỗng, chưa có chunker → "Bị chặn".

**Không đạt nếu:** có đoạn vắt qua trang, vượt token, lệch offset, thiếu chữ khi ghép, hoặc hai lần chạy cho kết quả khác nhau.

**Lưu ý:** Ca loại UT (kiểm thử đơn vị): giao diện chỉ dùng để đưa tài liệu vào; phần kiểm bất biến thực hiện bằng truy vấn/kiểm thử mã. Trong CSDL dev nhúng không có pgvector nên `chunks` thiếu cột `embedding` (xem TC-DATA-03).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-INT-CHUNK/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-INT-CHUNK/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-INT-CHUNK//video/TC-INT-CHUNK.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-INT-CHUNK//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-INT-CHUNK//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-INT-CHUNK//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-INT-CHUNK
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-INT-CHUNK.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

