# TC-DATA-BKP — Sao lưu rồi **khôi phục** vào môi trường riêng; kiểm tra số tài liệu/đoạn/truy vấn mẫu

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-BKP |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | NFR-005 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | DT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-BKP/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Sao lưu rồi **khôi phục** vào môi trường riêng; kiểm tra số tài liệu/đoạn/truy vấn mẫu
- **Kết quả mong đợi:** Khôi phục thành công; RPO/RTO có số liệu so với `[TBD: OQ-018]`
- **Ưu:** T
- **Loại:** DT
- **Truy vết:** NFR-005

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Toàn bộ ca cần quyền hạ tầng (sao lưu/khôi phục CSDL và thư mục lưu tệp); chỉ ghi cách làm, KHÔNG tự chạy trên môi trường dev dùng chung. Khôi phục vào môi trường RIÊNG (CSDL và thư mục lưu tệp khác, cổng API khác).
- Công cụ: `pg_dump`/`pg_restore`/`psql` của PostgreSQL (khớp phiên bản máy chủ nhúng); PowerShell cho sao chép tệp và đo thời gian.
- Sao lưu CSDL (đặt kết quả ở `data/backup/`): `pg_dump -h localhost -p 54329 -U postgres -d postgres -Fc -f data/backup/docchat.dump`.
- Sao lưu tệp PDF mã hóa: `Copy-Item -Recurse apps\api\target\dev-storage data\backup\storage`. Tệp lưu mã hóa AES-GCM nên PHẢI lưu kèm (an toàn, tách riêng) khóa `DOCCHAT_STORAGE_ENCRYPTION_KEY` (dev: giá trị mặc định trong `DevServer`; môi trường thật tự sinh), nếu không khôi phục xong cũng không đọc được tệp.
- Môi trường khôi phục: CSDL mới `psql -h localhost -p 54329 -U postgres -c "CREATE DATABASE docchat_restore;"` rồi `pg_restore -h localhost -p 54329 -U postgres -d docchat_restore data/backup/docchat.dump`; chạy API thứ hai trỏ tới `docchat_restore` và thư mục lưu tệp bản sao, cổng khác (ví dụ 8081).
- Số liệu cần ghi: số tài liệu (`SELECT count(*) FROM documents;`), số đoạn (`SELECT count(*) FROM chunks;`), số hội thoại/tin nhắn/trích dẫn, và một truy vấn mẫu (ví dụ `SELECT id, name, status FROM documents ORDER BY uploaded_at DESC LIMIT 5;`). RPO = thời gian từ lần sao lưu cuối tới thời điểm sự cố giả định; RTO = thời gian từ lúc bắt đầu khôi phục tới khi `/api/ready` của môi trường khôi phục trả 200. Ngưỡng `[TBD: OQ-018]` chưa chốt.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Quan sát bộ đếm "Đã dùng N/20 tài liệu" và danh sách tài liệu trên môi trường gốc | Ghi lại N, tên và trạng thái các tài liệu (số liệu "trước") | Ảnh `05-so-lieu-truoc.png` |
| 6 | Chạy các truy vấn đếm `documents`, `chunks`, `conversations`, `messages`, `citations` bằng psql | Ra các số liệu gốc; `documents` bằng N ở giao diện (không tính `DELETED`) | Tệp/log `data/dem-truoc.txt` kèm ảnh màn hình `06-dem-truoc.png` |
| 7 | Chạy `pg_dump ... -Fc -f data/backup/docchat.dump`, ghi giờ bắt đầu/kết thúc | Tệp `docchat.dump` được tạo (kích thước > 0), lệnh thoát mã 0 | Tệp/log `data/pg-dump.txt` kèm ảnh màn hình `07-pg-dump.png` |
| 8 | Sao chép thư mục `dev-storage` sang `data/backup/storage` | Số tệp trong bản sao bằng số tệp gốc | Tệp/log `data/sao-luu-tep.txt` kèm ảnh màn hình `08-sao-luu-tep.png` |
| 9 | Ghi giờ T0 (bắt đầu khôi phục) rồi chạy `CREATE DATABASE docchat_restore;` và `pg_restore` | `pg_restore` kết thúc không lỗi | Tệp/log `data/pg-restore.txt` kèm ảnh màn hình `09-pg-restore.png` |
| 10 | Khởi động API thứ hai trỏ tới `docchat_restore` và thư mục lưu tệp bản sao, rồi chạy `curl http://localhost:8081/api/ready` | HTTP 200; ghi giờ T1; RTO = T1 − T0 | Tệp/log `data/ready-khoi-phuc.txt` kèm ảnh màn hình `10-ready-khoi-phuc.png` |
| 11 | Chạy các truy vấn đếm giống bước 2 trên `docchat_restore` | Mọi số liệu bằng số liệu "trước" (số tài liệu, đoạn, hội thoại, tin nhắn, trích dẫn) | Tệp/log `data/dem-sau.txt` kèm ảnh màn hình `11-dem-sau.png` |
| 12 | Chạy truy vấn mẫu và đăng nhập môi trường khôi phục (cổng riêng) bằng `admin`, mở danh sách tài liệu | Truy vấn mẫu cho cùng kết quả; danh sách tài liệu hiển thị giống môi trường gốc; tải lại một PDF gốc (khi có chức năng) đọc được | Ảnh `12-moi-truong-khoi-phuc.png` |
| 13 | Tính RPO và RTO rồi đối chiếu với ngưỡng `[TBD: OQ-018]` | Báo cáo ghi RPO (phút) và RTO (phút) bằng số thực đo được; ghi rõ "chưa có ngưỡng để so sánh" nếu OQ-018 chưa chốt | Ảnh `13-bang-rpo-rto.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khôi phục thành công vào môi trường riêng: `pg_restore` không lỗi, API khôi phục `/api/ready` trả 200, đăng nhập được.
2. Số tài liệu/đoạn/hội thoại/tin nhắn/trích dẫn khớp số liệu trước khi sao lưu; truy vấn mẫu cho cùng kết quả.
3. RPO và RTO có số liệu cụ thể so với `[TBD: OQ-018]` (giữ nguyên `[TBD]`, không tự đặt ngưỡng).

**Không đạt nếu:** thiếu dữ liệu sau khôi phục; lỗi khi `pg_restore`; PDF không đọc được vì thiếu khóa mã hóa; không đo được RPO/RTO.

**Lưu ý:** Ca ưu tiên "T", loại DT, không kiểm được qua giao diện; giao diện localhost:5173 chỉ cho số liệu "trước". CSDL dev nhúng không có pgvector nên bản sao lưu dev không chứa `chunks.embedding`; sao lưu vector đầy đủ cần chạy trên CSDL pgvector. Hiện chưa có `chunks` (chưa có T08) nên số đoạn = 0 là kết quả hợp lệ ở giai đoạn này.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-BKP/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-BKP/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-BKP//video/TC-DATA-BKP.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-BKP//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-BKP//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-BKP//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-BKP
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-BKP.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

