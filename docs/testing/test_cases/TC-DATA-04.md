# TC-DATA-04 — Trích dẫn sau khi tài liệu bị xóa/purge

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-04 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | US-015-AC4 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | DT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-04/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Trích dẫn sau khi tài liệu bị xóa/purge
- **Kết quả mong đợi:** Giữ tên tài liệu và trang; không còn đoạn gốc
- **Ưu:** C
- **Loại:** DT
- **Truy vết:** US-015-AC4

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Chức năng xóa tài liệu và dọn (purge) CHƯA có (US-015-AC4 cần hỏi đáp + xóa). Trước mắt chỉ kiểm được ở mức CSDL bằng dữ liệu thử trong một giao dịch có `ROLLBACK`.
- Dữ liệu thử cố định: tài liệu `…0d1` (tên `bao-hanh.pdf`), 1 đoạn `chunks`, hội thoại `…0c1`, tin nhắn `…0b1`, trích dẫn `…0e1` (page 3, `document_name='bao-hanh.pdf'`). Người dùng `admin`.
- Cần chạy trong một phiên psql tương tác (cần hạ tầng): `BEGIN;` … `ROLLBACK;` để không để lại dữ liệu.

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
| 8 | Trong psql chạy `BEGIN;` rồi chèn chuỗi documents d1, chunks, conversations c1, messages b1, citations e1 (page 3, document_name 'bao-hanh.pdf') | Các câu chèn thành công | Tệp/log `data/chen-du-lieu.txt` kèm ảnh màn hình `08-chen-du-lieu.png` |
| 9 | Chạy `DELETE FROM documents WHERE id='00000000-0000-0000-0000-0000000000d1';` (xóa cứng/purge) | Bị từ chối `violates foreign key constraint` vì `citations.document_id` tham chiếu (không có ON DELETE) — ghi nhận đây là lệch so với kỳ vọng "purge vẫn giữ trích dẫn" (xem Lưu ý) | Tệp/log `data/xoa-cung-bi-chan.txt` kèm ảnh màn hình `09-xoa-cung-bi-chan.png` |
| 10 | Chạy `ROLLBACK; BEGIN;` rồi chèn lại dữ liệu và chạy `UPDATE documents SET status='DELETED' WHERE id='...d1'; DELETE FROM chunks WHERE document_id='...d1';` | Cả hai lệnh thành công (xóa mềm + dọn đoạn gốc) | Tệp/log `data/xoa-mem-xoa-doan.txt` kèm ảnh màn hình `10-xoa-mem-xoa-doan.png` |
| 11 | Chạy `SELECT document_name, page FROM citations WHERE id='...e1';` | Trả `bao-hanh.pdf` và `3` (giữ tên tài liệu và trang) | Tệp/log `data/trich-dan-con-nguyen.txt` kèm ảnh màn hình `11-trich-dan-con-nguyen.png` |
| 12 | Chạy `SELECT count(*) FROM chunks WHERE document_id='...d1';` rồi `ROLLBACK;` | Kết quả 0 (không còn đoạn gốc); sau ROLLBACK không còn dữ liệu thử | Tệp/log `data/khong-con-doan-goc.txt` kèm ảnh màn hình `12-khong-con-doan-goc.png` |
| 13 | (Thiết kế — chạy khi có hỏi đáp + xóa) Hỏi một câu để có trích dẫn tới tài liệu A, xóa A trên giao diện, rồi mở lại hội thoại cũ | Trích dẫn vẫn hiển thị tên "A.pdf" và số trang; bấm vào trích dẫn thì ngăn "Nguồn" báo không còn đoạn nguồn (không lỗi trắng trang) | Ảnh `13-trich-dan-sau-khi-xoa.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–12 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Sau khi tài liệu bị xóa/purge, trích dẫn cũ vẫn giữ tên tài liệu (`citations.document_name`) và số trang.
2. Không còn đoạn gốc (`chunks`) của tài liệu đã xóa.
3. Giao diện hiển thị trích dẫn cũ không lỗi (chưa kiểm được khi chưa có hỏi đáp/xóa).

**Không đạt nếu:** mất tên tài liệu hoặc số trang trong trích dẫn; còn đoạn gốc của tài liệu đã xóa; xóa tài liệu làm hỏng hội thoại cũ.

**Lưu ý:** Mâu thuẫn tiềm ẩn: lược đồ V2 để `citations.document_id REFERENCES documents (id)` không có `ON DELETE`, nên xóa cứng (purge) tài liệu còn trích dẫn sẽ bị CSDL chặn; chỉ xóa mềm (`status='DELETED'`) hoạt động. Nếu "purge" trong Test Plan nghĩa là xóa vật lý bản ghi `documents`, cần đổi khóa ngoại (ví dụ `ON DELETE SET NULL` và cho phép NULL) hoặc quy định purge chỉ xóa `chunks` + tệp. Trên CSDL pgvector, `chunks` có thêm cột NOT NULL `embedding_model`, `embedding` khi chèn dữ liệu thử.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-04/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-04/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-04//video/TC-DATA-04.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-04//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-04//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-04//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-04
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-04.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

