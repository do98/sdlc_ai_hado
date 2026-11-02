# TC-DATA-02 — Ràng buộc CHECK/UNIQUE/FK (trạng thái, kết quả, trích dẫn duy nhất theo thứ tự)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-02 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | SI-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | DT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-02/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Ràng buộc CHECK/UNIQUE/FK (trạng thái, kết quả, trích dẫn duy nhất theo thứ tự)
- **Kết quả mong đợi:** Vi phạm bị từ chối
- **Ưu:** C
- **Loại:** DT
- **Truy vết:** SI-004

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Tất cả lệnh chạy dạng `psql -h localhost -p 54329 -U postgres -d postgres -c "<nhiều câu lệnh>"`: một `-c` nhiều câu lệnh chạy trong MỘT giao dịch ngầm, lỗi thì tất cả bị hủy (không để lại dữ liệu). Chỉ ghi cách làm; người có quyền hạ tầng chạy. Lưu mọi đầu ra vào `data/`.
- Người dùng mẫu lấy từ `SELECT id FROM users WHERE username='admin'` (ký hiệu `<ADMIN>` bên dưới là biểu thức này).
- Bộ dữ liệu cố định dùng chung: tài liệu `00000000-0000-0000-0000-0000000000d1`, hội thoại `…00c1`, tin nhắn `…00b1`, trích dẫn `…00e1`, `…00e2`.
- Test tự động tương ứng đã có trong `apps/api/src/test/java/vn/docchat/repository/MigrationTest.java`: `T03_documents_trang_thai_va_ma_loi_hop_le`, `T03_documents_kich_thuoc_am_va_khoa_ngoai_bi_tu_choi`, `T03_chunks_rang_buoc_trang_offset_va_xoa_day_chuyen`, `T03_messages_ket_qua_hop_le`, `T03_citations_duy_nhat_theo_thu_tu_va_giu_ten_tai_lieu`.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Chạy `INSERT INTO documents(id,name,size_bytes,status,storage_key,uploaded_by) VALUES (gen_random_uuid(),'x.pdf',1,'FOO','k',(SELECT id FROM users WHERE username='admin'));` | Bị từ chối: `ERROR: new row for relation "documents" violates check constraint` (trạng thái ngoài PROCESSING/READY/ERROR/DELETED) | Tệp/log `data/check-trang-thai.txt` kèm ảnh màn hình `05-check-trang-thai.png` |
| 6 | Chạy cùng lệnh nhưng `status='ERROR'` và không có `error_code` | Bị từ chối `violates check constraint` (ERROR bắt buộc có error_code) | Tệp/log `data/check-error-code-null.txt` kèm ảnh màn hình `06-check-error-code-null.png` |
| 7 | Chạy lệnh có `error_code='XYZ'` với `status='ERROR'` hoặc `size_bytes=-1` | Bị từ chối `violates check constraint` (mã lỗi ngoài danh mục; kích thước âm) | Tệp/log `data/check-ma-loi-kich-thuoc.txt` kèm ảnh màn hình `07-check-ma-loi-kich-thuoc.png` |
| 8 | Chạy lệnh chèn `documents` với `uploaded_by` là một UUID ngẫu nhiên không có trong `users` | Bị từ chối `violates foreign key constraint` | Tệp/log `data/fk-uploaded-by.txt` kèm ảnh màn hình `08-fk-uploaded-by.png` |
| 9 | Chạy `INSERT INTO chunks(id,document_id,page,char_start,char_end,content) VALUES (gen_random_uuid(),'00000000-0000-0000-0000-0000000000d1',0,0,5,'x');` (sau khi chèn tài liệu d1 trong cùng `-c`) | Bị từ chối `violates check constraint` (page ≥ 1); lặp với `char_end <= char_start` cũng bị từ chối | Tệp/log `data/check-chunks.txt` kèm ảnh màn hình `09-check-chunks.png` |
| 10 | Chèn chuỗi documents d1 → conversations c1 → messages b1 với `result='BAD'` trong cùng `-c` | Bị từ chối `violates check constraint` tại câu chèn `messages` (kết quả ngoài ANSWERED/NOT_FOUND/PARTIAL/STOPPED/INTERRUPTED/TIMEOUT/ERROR) | Tệp/log `data/check-messages-result.txt` kèm ảnh màn hình `10-check-messages-result.png` |
| 11 | Chèn chuỗi d1 → c1 → b1 (result hợp lệ) → citation e1 (idx 1) rồi e2 cùng `message_id` và `idx = 1` | Câu chèn e2 bị từ chối `duplicate key value violates unique constraint` (UNIQUE message_id, idx) | Tệp/log `data/unique-trich-dan.txt` kèm ảnh màn hình `11-unique-trich-dan.png` |
| 12 | Chèn trích dẫn có `idx = 0` hoặc `document_id` không tồn tại | Bị từ chối (`violates check constraint` cho idx ≥ 1; `violates foreign key constraint` cho tài liệu) | Tệp/log `data/check-fk-citation.txt` kèm ảnh màn hình `12-check-fk-citation.png` |
| 13 | Chạy `SELECT count(*) FROM documents WHERE id='00000000-0000-0000-0000-0000000000d1';` | Kết quả 0 (mọi lệnh thử nghiệm đã bị hủy, không để lại dữ liệu rác) | Tệp/log `data/khong-de-lai-rac.txt` kèm ảnh màn hình `13-khong-de-lai-rac.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mọi vi phạm CHECK (trạng thái, mã lỗi, kích thước âm, page < 1, char_end ≤ char_start, kết quả tin nhắn, idx < 1), UNIQUE (trích dẫn theo (message_id, idx)) và FK (uploaded_by, document_id) đều bị CSDL từ chối với đúng loại lỗi.
2. Không có dữ liệu thử nghiệm còn sót trong CSDL.
3. Ghi rõ tên ràng buộc thực tế trong thông báo lỗi PostgreSQL vào báo cáo.

**Không đạt nếu:** một dữ liệu vi phạm được chấp nhận; lỗi thuộc loại khác ràng buộc cần kiểm; dữ liệu thử còn lại.

**Lưu ý:** Ca không có giao diện (loại DT): chỉ làm được qua truy vấn CSDL (cần quyền hạ tầng). Trong CSDL dev `chunks` không có cột `embedding` (V4 bị bỏ qua); trên CSDL có pgvector cột này NOT NULL nên thêm `embedding_model` và `embedding` vào câu chèn `chunks` để lỗi đến từ ràng buộc cần kiểm.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-02/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-02/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-02//video/TC-DATA-02.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-02//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-02//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-02//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-02
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-02.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

