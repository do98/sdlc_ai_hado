# TC-INT-IDEMP — Chạy xử lý tài liệu hai lần

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.3 Chức năng bổ sung của kế hoạch phát triển (chưa có story)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-INT-IDEMP |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-INT-IDEMP/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Chạy xử lý tài liệu hai lần
- **Kết quả mong đợi:** Kết quả như một lần; không trùng đoạn
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** US-004

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-INT-IDEMP/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- `test_reports/TC-INT-IDEMP/data/mau-5-trang.pdf`: PDF có chữ ≥ 5 trang (tạo bằng Word/LibreOffice).
- Cách "chạy xử lý hai lần" (cần hạ tầng, khi có T08): đặt lại tài liệu về PROCESSING bằng `UPDATE documents SET status='PROCESSING', ready_at=NULL WHERE id='<id>';` rồi để worker nhận lại; hoặc gọi trực tiếp dịch vụ xử lý hai lần qua kiểm thử tích hợp (`./mvnw -Dtest=DocumentProcessingIdempotencyIT test`, tên dự kiến). Chỉ ghi cách làm.
- Cách so sánh: lưu băm SHA-256 của `string_agg(page||':'||char_start||':'||char_end||':'||content, '|' ORDER BY page, char_start)` sau lần xử lý 1 và 2.

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
| 8 | Chạy `SELECT status, count(*) FROM documents GROUP BY status;` và `SELECT count(*) FROM chunks;` | Có `PROCESSING` và 0 đoạn: chưa có bộ xử lý để chạy hai lần | Tệp/log `data/sql-trang-thai.txt` kèm ảnh màn hình `08-sql-trang-thai.png` |
| 9 | (Thiết kế — chạy khi có T08) Tải `data/mau-5-trang.pdf`, chờ "Sẵn sàng", ghi `id` tài liệu, số đoạn và băm lần 1 | Dòng "Sẵn sàng"; số đoạn N > 0; băm H1 được ghi lại | Ảnh `09-lan-1-san-sang.png` |
| 10 | (Thiết kế) Kích hoạt xử lý lần 2 cho cùng tài liệu theo cách ở điều kiện tiên quyết | Tài liệu quay về "Đang xử lý" rồi lại "Sẵn sàng" | Ảnh `10-lan-2-san-sang.png` |
| 11 | (Thiết kế) Đếm đoạn và tính băm lần 2 | Số đoạn bằng N (không nhân đôi); băm bằng H1 | Tệp/log `data/so-sanh-lan-1-2.txt` kèm ảnh màn hình `11-so-sanh-lan-1-2.png` |
| 12 | (Thiết kế) Chạy truy vấn tìm đoạn trùng `SELECT document_id, page, char_start, count(*) FROM chunks GROUP BY 1,2,3 HAVING count(*)>1;` | Trả 0 hàng | Tệp/log `data/sql-doan-trung.txt` kèm ảnh màn hình `12-sql-doan-trung.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–8 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Chạy xử lý hai lần cho kết quả giống một lần: cùng số đoạn, cùng nội dung/offset, trạng thái cuối "Sẵn sàng".
2. Không có đoạn trùng (document_id, page, char_start).
3. Chỉ có đúng 1 sự kiện trạng thái cuối hợp lý (không phát "Sẵn sàng" hai lần gây nhầm lẫn cho người dùng).
4. Trong giai đoạn hiện tại: chưa có xử lý nền → "Bị chặn".

**Không đạt nếu:** số đoạn tăng gấp đôi; băm khác nhau; có đoạn trùng; tài liệu rơi vào "Lỗi" ở lần chạy lại.

**Lưu ý:** Ca loại IT (tích hợp): cần mã T08 và CSDL thật có đủ bảng `chunks` (V2).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-INT-IDEMP/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-INT-IDEMP/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-INT-IDEMP//video/TC-INT-IDEMP.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-INT-IDEMP//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-INT-IDEMP//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-INT-IDEMP//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-INT-IDEMP
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-INT-IDEMP.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

