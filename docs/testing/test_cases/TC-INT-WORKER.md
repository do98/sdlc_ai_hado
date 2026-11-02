# TC-INT-WORKER — 4 worker, 200 job; giết worker giữa job

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.3 Chức năng bổ sung của kế hoạch phát triển (chưa có story)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-INT-WORKER |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-004, RISK-04 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-INT-WORKER/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** 4 worker, 200 job; giết worker giữa job
- **Kết quả mong đợi:** Mỗi job chạy đúng 1 lần; job bị bỏ rơi được nhận lại sau thời hạn thuê
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** US-004, RISK-04

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Bản dựng có worker nền (T08) chạy dưới dạng 4 tiến trình/luồng riêng (cấu hình số worker và thời hạn thuê job `[TBD]` theo SDD); hiện CHƯA có. Trong DevServer API và CSDL cùng một JVM nên không giết riêng worker được.
- 200 job: tạo 200 bản ghi `documents` ở trạng thái `PROCESSING` bằng SQL hoặc kiểm thử tích hợp (kho dev giới hạn 20 tài liệu hoạt động nên 200 job cần môi trường kiểm thử riêng hoặc test mức dịch vụ, không dùng giao diện).
- Cách giết worker (cần hạ tầng, chỉ ghi cách làm): PowerShell `Stop-Process -Id <PID> -Force` với PID lấy từ `Get-CimInstance Win32_Process -Filter "Name='java.exe'"`.
- Cách đếm "mỗi job chạy đúng 1 lần": bảng/nhật ký thực thi job (tên bảng/cột do T08 định nghĩa) hoặc đếm số đoạn mỗi tài liệu bằng đúng một lần xử lý.

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
| 8 | Chạy `SELECT count(*) FROM documents WHERE status='PROCESSING';` bằng psql | Bằng số tệp đã tải (đang chờ); không có job nào chạy → bằng chứng chưa có worker | Tệp/log `data/sql-processing.txt` kèm ảnh màn hình `08-sql-processing.png` |
| 9 | (Thiết kế — chạy khi có worker) Khởi động 4 worker, nạp 200 job `PROCESSING`, ghi giờ bắt đầu | Cả 4 worker nhận job; số job còn chờ giảm dần | Ảnh `09-bon-worker-chay.png` |
| 10 | (Thiết kế) Khi đã xử lý khoảng một nửa số job, giết 1 worker giữa job (ghi PID, giờ) | Còn 3 worker; một job ở trạng thái đang chạy bị bỏ rơi (khóa thuê chưa hết hạn) | Ảnh `10-giet-1-worker.png` |
| 11 | (Thiết kế) Chờ quá thời hạn thuê `[TBD]` rồi quan sát job bị bỏ rơi | Một worker còn lại nhận lại job và xử lý xong; không còn job "Đang xử lý" quá hạn | Ảnh `11-job-duoc-nhan-lai.png` |
| 12 | (Thiết kế) Khi hết 200 job, chạy `SELECT status, count(*) FROM documents GROUP BY status;` | Mọi job ở `READY` hoặc `ERROR` có lý do; 0 job còn `PROCESSING` | Tệp/log `data/sql-ket-thuc.txt` kèm ảnh màn hình `12-sql-ket-thuc.png` |
| 13 | (Thiết kế) Đối chiếu số lần chạy từng job từ nhật ký thực thi | Mỗi job có đúng 1 lần chạy thành công (job bị bỏ rơi có thể có 1 lần dở dang + 1 lần hoàn tất, không có hai lần hoàn tất); không đoạn trùng | Tệp/log `data/so-lan-chay-moi-job.txt` kèm ảnh màn hình `13-so-lan-chay-moi-job.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–8 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi trong 200 job được chạy (hoàn tất) đúng 1 lần, kể cả khi một worker bị giết giữa job.
2. Job bị bỏ rơi được worker khác nhận lại sau thời hạn thuê `[TBD]` và hoàn tất.
3. Không đoạn trùng, không job kẹt ở `PROCESSING`.
4. Trong giai đoạn hiện tại: chưa có worker → "Bị chặn".

**Không đạt nếu:** có job chạy hai lần (hoàn tất trùng); job mất (kẹt PROCESSING); job nhận lại trước khi hết hạn thuê.

**Lưu ý:** Thời hạn thuê chưa chốt (`[TBD]`) nên chỉ kiểm quan hệ "nhận lại sau hạn", không kiểm giá trị cụ thể. Ca loại IT cần môi trường kiểm thử riêng, không thể kiểm bằng giao diện localhost:5173.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-INT-WORKER/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-INT-WORKER/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-INT-WORKER//video/TC-INT-WORKER.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-INT-WORKER//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-INT-WORKER//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-INT-WORKER//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-INT-WORKER
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-INT-WORKER.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

