# TC-DATA-01 — Migration trên CSDL trống; chạy lại

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.8 Dữ liệu và migration". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-DATA-01 |
| Nhóm | B.8 Dữ liệu và migration |
| Truy vết | SI-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | DT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-DATA-01/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Migration trên CSDL trống; chạy lại
- **Kết quả mong đợi:** Thành công; lặp lại không lỗi
- **Ưu:** C
- **Loại:** DT
- **Truy vết:** SI-004

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Công cụ chạy kiểm thử mã (cần hạ tầng/môi trường phát triển): `cd apps/api` rồi `./mvnw -Dtest=MigrationTest test`; các ca liên quan: `T03_migration_tao_du_bang_va_validate_xanh`, `T03_migration_chay_lai_khong_loi`, `T03_chi_muc_can_thiet_ton_tai`.
- Phần "CSDL trống" thật: tạo CSDL phụ rỗng `psql -h localhost -p 54329 -U postgres -c "CREATE DATABASE docchat_empty;"` rồi chạy API trỏ tới đó (`spring.datasource.url=jdbc:postgresql://localhost:54329/docchat_empty`) — thao tác tạo CSDL/khởi động API cần quyền hạ tầng, chỉ ghi cách làm.
- Migration trong dự án: `db/migration` gồm V1 (users, auth_sessions), V2 (documents, chunks, conversations, messages, citations), V3 (audit_log, analytics_events), V5 (events); `db/vector/V4` (pgvector: cột `chunks.embedding`, chỉ chạy được trên PostgreSQL có pgvector). DevServer cố ý bỏ `db/vector` nên CSDL dev KHÔNG có V4 (xem Lưu ý).

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Chạy `curl -i http://localhost:5173/api/ready` | HTTP 200 (CSDL sẵn sàng sau khi Flyway chạy xong lúc khởi động) | Tệp/log `data/ready.txt` kèm ảnh màn hình `05-ready.png` |
| 6 | Chạy `SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;` bằng psql (cần hạ tầng) | Có các phiên bản 1, 2, 3, 5 (CSDL dev) đều `success = t`; không có hàng `f`; không có phiên bản trùng | Tệp/log `data/flyway-history.txt` kèm ảnh màn hình `06-flyway-history.png` |
| 7 | Chạy lệnh `\dt` bằng psql | Có các bảng users, auth_sessions, documents, chunks, conversations, messages, citations, audit_log, analytics_events, events, flyway_schema_history | Tệp/log `data/danh-sach-bang.txt` kèm ảnh màn hình `07-danh-sach-bang.png` |
| 8 | Chạy `./mvnw -Dtest=MigrationTest test` trong `apps/api` (cần hạ tầng) | `T03_migration_tao_du_bang_va_validate_xanh` và `T03_migration_chay_lai_khong_loi` đều PASS (migration trên CSDL trống thành công, chạy lại không lỗi); BUILD SUCCESS | Tệp/log `data/ket-qua-migrationtest.txt` kèm ảnh màn hình `08-ket-qua-migrationtest.png` |
| 9 | (Cần hạ tầng) Khởi động lại API lần nữa (không xóa CSDL) rồi chạy lại truy vấn `flyway_schema_history` | Không có hàng mới được thêm, không có lỗi "checksum"/"validate failed" trong log khởi động; số hàng như cũ | Tệp/log `data/flyway-sau-khoi-dong-lai.txt` kèm ảnh màn hình `09-flyway-sau-khoi-dong-lai.png` |
| 10 | Trên trình duyệt đăng nhập lại và mở trang chính | Đăng nhập được, danh sách tài liệu hiển thị bình thường sau khi chạy lại migration (dữ liệu cũ còn nguyên) | Ảnh `10-sau-chay-lai-van-dung.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Migration trên CSDL trống chạy thành công: mọi phiên bản `success = t`, đủ bảng nghiệp vụ.
2. Chạy lại (khởi động lại hoặc chạy `MigrationTest`) không lỗi và không thêm/đổi dữ liệu lược đồ.
3. Ứng dụng sau migration hoạt động (`/api/ready` 200, đăng nhập được).

**Không đạt nếu:** có migration `success = f`; chạy lại báo lỗi checksum hoặc tạo trùng đối tượng; thiếu bảng.

**Lưu ý:** Test Plan nói "CSDL trống" nhưng CSDL dev dùng PostgreSQL nhúng không có pgvector nên V4 (`chunks.embedding`, chỉ mục HNSW) không được áp dụng: trong CSDL dev danh sách phiên bản là 1, 2, 3, 5. Phần V4 chỉ kiểm được trên ảnh `pgvector/pgvector:pg16` (xem `docker-compose.yml`).

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-DATA-01/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-DATA-01/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-DATA-01//video/TC-DATA-01.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-DATA-01//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-DATA-01//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-DATA-01//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-DATA-01
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-DATA-01.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

