# TC-DATA-03 — Truy vấn lai dùng chỉ mục vector và toàn văn (EXPLAIN)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-03 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | PERF-008 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | DT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Truy vấn lai dùng chỉ mục vector và toàn văn (EXPLAIN)
- **Kết quả mong đợi:** Dùng chỉ mục; không quét tuần tự trên kho lớn
- **Ưu:** T
- **Loại:** DT
- **Truy vết:** PERF-008

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Kiểm tra bắt buộc trên CSDL CÓ pgvector (ảnh `pgvector/pgvector:pg16` theo `docker-compose.yml`, `docker compose up -d db`; cần quyền hạ tầng) — CSDL dev nhúng cổng 54329 KHÔNG có pgvector nên không kiểm được.
- Dữ liệu kho lớn: chèn ≥ 100 000 đoạn giả vào `chunks` bằng `INSERT ... SELECT ... FROM generate_series(1,100000)` (nội dung ngẫu nhiên, `embedding` ngẫu nhiên 1536 chiều) rồi `ANALYZE chunks;`. Ngưỡng "kho lớn" `[TBD]` theo PERF-008 trong Test_Plan.
- Truy vấn kiểm: vector `EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM chunks ORDER BY embedding <=> '[...]'::vector LIMIT 20;` và toàn văn `EXPLAIN (ANALYZE, BUFFERS) SELECT id FROM chunks WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', 'hoan tien') LIMIT 20;`

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
| 8 | Chạy `SELECT extname FROM pg_extension;` và `SELECT name FROM pg_available_extensions WHERE name='vector';` bằng psql trên CSDL dev | Không có `vector`; truy vấn thứ hai trả 0 hàng (pgvector không khả dụng ở CSDL dev) | Tệp/log `data/pg-extension.txt` kèm ảnh màn hình `08-pg-extension.png` |
| 9 | Chạy lệnh `\d chunks` | Chỉ có chỉ mục `chunks_pkey` và `chunks_doc_page_ix`; KHÔNG có cột `embedding`, KHÔNG có `chunks_embedding_hnsw_ix`, KHÔNG có chỉ mục toàn văn (GIN) | Tệp/log `data/mo-ta-bang-chunks.txt` kèm ảnh màn hình `09-mo-ta-bang-chunks.png` |
| 10 | (Thiết kế — chạy trên CSDL pgvector) Chạy `\d chunks` | Có cột `embedding vector(1536)` và chỉ mục `chunks_embedding_hnsw_ix` (HNSW, vector_cosine_ops) | Tệp/log `data/mo-ta-pgvector.txt` kèm ảnh màn hình `10-mo-ta-pgvector.png` |
| 11 | (Thiết kế) Nạp ≥ 100 000 đoạn rồi chạy `ANALYZE chunks;` | Lệnh hoàn tất; `SELECT count(*) FROM chunks;` ≥ 100000 | Tệp/log `data/kho-lon.txt` kèm ảnh màn hình `11-kho-lon.png` |
| 12 | (Thiết kế) Chạy truy vấn vector `EXPLAIN (ANALYZE, BUFFERS)` ở trên | Kế hoạch có `Index Scan using chunks_embedding_hnsw_ix on chunks`; không có `Seq Scan on chunks` | Tệp/log `data/explain-vector.txt` kèm ảnh màn hình `12-explain-vector.png` |
| 13 | (Thiết kế) Chạy truy vấn toàn văn `EXPLAIN (ANALYZE, BUFFERS)` ở trên | Kế hoạch dùng chỉ mục toàn văn (`Bitmap Index Scan`/`Index Scan` trên chỉ mục GIN), không `Seq Scan on chunks`; ghi thời gian thực thi | Tệp/log `data/explain-fts.txt` kèm ảnh màn hình `13-explain-fts.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–9 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Truy vấn vector dùng chỉ mục HNSW và truy vấn toàn văn dùng chỉ mục toàn văn trên kho lớn; không quét tuần tự (`Seq Scan`) trên `chunks`.
2. Có số liệu thời gian thực thi trong báo cáo (đối chiếu PERF-008 khi có ngưỡng).
3. Trong giai đoạn hiện tại: CSDL dev không có pgvector và chưa có chỉ mục toàn văn → "Bị chặn".

**Không đạt nếu:** kế hoạch có `Seq Scan on chunks` ở kho lớn; chỉ mục không được dùng; thiếu chỉ mục.

**Lưu ý:** Migration hiện có KHÔNG tạo chỉ mục toàn văn cho `chunks.content` (chỉ có `chunks_doc_page_ix` ở V2 và chỉ mục HNSW ở V4) nên vế "toàn văn" của ca cần migration bổ sung (tsvector + GIN) trước khi chạy được; Test Plan chưa nêu ngưỡng "kho lớn" `[TBD]`.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-03//video/TC-DATA-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

