# TC-RES-03 — Giết worker giữa xử lý tài liệu

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-03 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Giết worker giữa xử lý tài liệu
- **Kết quả mong đợi:** Tài liệu không kẹt; được xử lý lại; không đoạn trùng
- **Ưu:** C
- **Loại:** RT
- **Truy vết:** US-004

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp PDF đủ lớn để xử lý mất vài chục giây (gần giới hạn: ≈ 9 MB hoặc ≈ 90 trang) đặt ở `test_reports/TC-RES-03/data/big.pdf`; sinh bằng công cụ PDF bất kỳ (ví dụ LibreOffice xuất PDF từ tài liệu 90 trang) hoặc dùng tệp mẫu TD-xx trong Test_Plan D.1.
- Quyền hạ tầng để kill tiến trình worker: PowerShell `Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Select ProcessId,CommandLine` để xác định tiến trình; kill bằng `Stop-Process -Id <PID> -Force`. Không tự chạy lệnh kill trong ca tài liệu này; người có quyền hạ tầng thực hiện.
- Hiện tại worker (T08) chưa tồn tại; trong DevServer API và CSDL nhúng cùng một tiến trình JVM nên "kill worker" đồng nghĩa dừng cả DevServer — khác Test Plan (worker tách riêng). Cần bản dựng tách worker để chạy thật.
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).

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
| 8 | Chạy lệnh `SELECT status, count(*) FROM documents GROUP BY status;` bằng psql | Có hàng `PROCESSING` ≥ 1 (tệp `ok.pdf` vừa tải) và không có hàng `READY`; chứng minh tài liệu kẹt ở PROCESSING vì chưa có worker | Tệp/log `data/sql-trang-thai.txt` kèm ảnh màn hình `08-sql-trang-thai.png` |
| 9 | Chạy lệnh `SELECT count(*) FROM chunks;` | Kết quả 0 (chưa có đoạn nào được tạo) | Tệp/log `data/sql-chunks.txt` kèm ảnh màn hình `09-sql-chunks.png` |
| 10 | (Thiết kế — chạy khi có worker) Tải `data/big.pdf` bằng "Tải PDF lên" rồi quan sát dòng tài liệu | Dòng hiển thị "Đang xử lý" | Ảnh `10-big-dang-xu-ly.png` |
| 11 | (Thiết kế) Khi dòng còn "Đang xử lý", kill tiến trình worker (cần hạ tầng) và ghi giờ kill | Tiến trình worker biến mất; giao diện vẫn hiển thị "Đang xử lý" | Ảnh `11-worker-bi-kill.png` |
| 12 | (Thiết kế) Khởi động lại worker và chờ tối đa [TBD: thời hạn thuê job theo Test Plan INT-WORKER] | Worker nhận lại job bị bỏ rơi sau hết thời hạn thuê | Ảnh `12-worker-nhan-lai-job.png` |
| 13 | (Thiết kế) Quan sát dòng tài liệu sau khi xử lý lại | Chuyển "Sẵn sàng" (hoặc "Sẵn sàng, có cảnh báo"), KHÔNG kẹt ở "Đang xử lý" | Ảnh `13-tai-lieu-san-sang.png` |
| 14 | (Thiết kế) Chạy `SELECT document_id, page, char_start, count(*) FROM chunks GROUP BY 1,2,3 HAVING count(*) > 1;` | Trả 0 hàng (không có đoạn trùng do xử lý lại) | Tệp/log `data/sql-doan-trung.txt` kèm ảnh màn hình `14-sql-doan-trung.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–9 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Tài liệu không kẹt ở "Đang xử lý": sau khi worker khởi động lại tài liệu được xử lý lại và chuyển "Sẵn sàng".
2. Truy vấn đoạn trùng (document_id, page, char_start) trả 0 hàng.
3. Chỉ một tập đoạn cho mỗi tài liệu (số đoạn sau xử lý lại bằng số đoạn của một lần xử lý sạch).
4. Trong giai đoạn hiện tại: tài liệu kẹt vĩnh viễn ở PROCESSING (không có worker) → "Bị chặn".

**Không đạt nếu:** tài liệu kẹt PROCESSING sau khi worker chạy lại; có đoạn trùng; tài liệu chuyển "Lỗi" dù tệp hợp lệ.

**Lưu ý:** "Khởi động lại xử lý PROCESSING còn sót" là phần của T08 (mã nguồn `DocumentUploadService` ghi chú "T08 xử lý lại tài liệu PROCESSING còn sót").

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-03//video/TC-RES-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

