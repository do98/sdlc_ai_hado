# TC-SEC-06 — Cô lập ở tầng CSDL (nếu dùng RLS): truy vấn thẳng bằng vai trò ứng dụng; thiếu ngữ cảnh người dùng

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-06 |
| Nhóm | B.4 Bảo mật |
| Truy vết | NFR-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST, IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-06/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Cô lập ở tầng CSDL (nếu dùng RLS): truy vấn thẳng bằng vai trò ứng dụng; thiếu ngữ cảnh người dùng
- **Kết quả mong đợi:** Chỉ thấy phạm vi của mình / 0 dòng
- **Ưu:** C
- **Loại:** ST, IT
- **Truy vết:** NFR-004

## Điều kiện tiên quyết chi tiết
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Ca ở tầng CSDL, không có giao diện. Cần `psql` vào PostgreSQL của dev (chuỗi kết nối `DOCCHAT_DB_URL`, vai trò ứng dụng `docchat`).
- **Hiện trạng mã nguồn:** các migration `V1`–`V5` (`apps/api/src/main/resources/db/migration`) KHÔNG có `ROW LEVEL SECURITY`/`POLICY`. Test Plan ghi "nếu dùng RLS" → hiện không áp dụng; kết luận dự kiến "Không thể kiểm qua giao diện" hoặc "Bị chặn".

## Các bước thực hiện
**Hiện trạng:** ca thuộc tầng CSDL; hiện chưa có RLS → bước 1–3 để chứng minh hiện trạng, bước 4–6 là đặc tả khi có RLS.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy `grep -ril "row level security\|create policy" apps/api/src/main/resources/db` từ gốc repo | Không có kết quả (chưa dùng RLS) | Ảnh `01-grep-rls.png` |
| 2 | Kết nối `psql` bằng vai trò ứng dụng, chạy `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('documents','chunks','conversations');` | Cột `relrowsecurity` = `f` cho cả ba bảng (xác nhận chưa bật RLS) | Ảnh `02-pg-class-rls.png` |
| 3 | Mở `http://localhost:5173/login` và đăng nhập `admin` để xác nhận ứng dụng chạy bình thường | Vào `/` thành công | Ảnh `03-ung-dung-chay.png` |
| 4 | (Chờ RLS) Với vai trò ứng dụng, KHÔNG đặt ngữ cảnh người dùng, chạy `SELECT count(*) FROM documents;` | Trả 0 dòng | Ảnh `04-thieu-ngu-canh-0-dong.png` |
| 5 | (Chờ RLS) Đặt ngữ cảnh người dùng A (ví dụ `SET app.user_id = '<uuid A>'`), chạy `SELECT id, uploaded_by FROM documents;` | Chỉ thấy dòng của A | Ảnh `05-ngu-canh-a.png` |
| 6 | (Chờ RLS) Giữ ngữ cảnh A, chạy `SELECT * FROM documents WHERE id = '<id của B>';` | 0 dòng | Ảnh `06-truy-van-id-cua-b.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khi dùng RLS: thiếu ngữ cảnh → 0 dòng; có ngữ cảnh → chỉ thấy dữ liệu của chính mình, kể cả khi truy vấn thẳng theo id của người khác.
2. Khi chưa dùng RLS: ghi nhận rõ "không áp dụng" kèm bằng chứng bước 1–2 (không tính là Đạt).
**Không đạt nếu:** bật RLS nhưng truy vấn thiếu ngữ cảnh vẫn trả dòng, hoặc thấy dòng của người khác.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-06/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-06/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-06//video/TC-SEC-06.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-06//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-06//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-06//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-06
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-06.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

