# TC-TEL-01 — Mỗi sự kiện PRD §5.2 (`login_success/denied`, `doc_upload_started/rejected`, `doc_ready`, `doc_unreadable`, `doc_deleted`, `question_submitted`, `answer_returne

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.2 Telemetry và nhật ký kiểm toán". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-TEL-01 |
| Nhóm | B.2 Telemetry, nhật ký, quan sát |
| Truy vết | QAS-06, G7 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-TEL-01/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Mỗi sự kiện PRD §5.2 (`login_success/denied`, `doc_upload_started/rejected`, `doc_ready`, `doc_unreadable`, `doc_deleted`, `question_submitted`, `answer_returned`, `citation_opened`, `answer_rated`, `history_opened`, `weekly_report_sent`)
- **Kết quả mong đợi:** Được phát đúng một lần với đúng thuộc tính
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** QAS-06, G7

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-TEL-01/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Cần truy cập CSDL dev: PostgreSQL nhúng cổng 54329, user `postgres`, db `postgres` (mật khẩu để trống): `psql -h localhost -p 54329 -U postgres -d postgres`. Chỉ chạy `SELECT`. Nếu không có `psql`, ghi "cần truy cập CSDL dev".
- Tạo trong `test_reports/TC-TEL-01/data/`: `hop-le.pdf` (`node -e "require('fs').writeFileSync('hop-le.pdf','%PDF-1.4\n1 0 obj\n<<>>\nendobj\n')"`) và `khong-phai-pdf.docx` (nội dung "PK" như E2E-003).
- Ghi lại số dòng ban đầu: `SELECT event_code, count(*) FROM analytics_events GROUP BY 1;`.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–8 vẫn chạy được để chứng minh. (chỉ `doc_upload_started` và `doc_upload_rejected` đã hiện thực trong DocumentUploadService; `login_success/denied`, `doc_ready`, `doc_unreadable`, `doc_deleted`, `question_submitted`, `answer_returned`, `citation_opened`, `answer_rated`, `history_opened`, `weekly_report_sent` chưa được phát)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy truy vấn đếm dòng ban đầu trong `psql` | Bảng kết quả (có thể rỗng) được ghi lại làm mốc | Ảnh `01-moc-ban-dau.png` |
| 2 | Đăng nhập sai (tên `admin`, mật khẩu `sai-mat-khau-123`) ở http://localhost:5173/login rồi đăng nhập đúng | Lần sai thấy "Không đăng nhập được. Hãy kiểm tra tên đăng nhập và mật khẩu, hoặc thử lại sau ít phút."; lần đúng vào "Xin chào, admin" | Ảnh `02-dang-nhap.png` |
| 3 | Chạy `SELECT event_code, attributes, at FROM analytics_events ORDER BY at;` | Theo thiết kế có `login_denied` và `login_success` (mỗi cái đúng 1 dòng). Hiện nay: chưa có dòng nào cho hai sự kiện này — ghi nhận là chưa hiện thực | Ảnh `03-truy-van-login.png` |
| 4 | Bấm "Tải PDF lên" và chọn `data/hop-le.pdf` | Hàng "Đã tải lên, đang xử lý" | Ảnh `04-tai-hop-le.png` |
| 5 | Chạy lại `SELECT event_code, attributes, at FROM analytics_events ORDER BY at;` | Có đúng 1 dòng mới `doc_upload_started` với `attributes` chỉ có `sizeBytes` (số) — không có tên tệp | Ảnh `05-doc-upload-started.png` |
| 6 | Trong Console gửi tệp sai định dạng thẳng lên API (bỏ qua kiểm tra giao diện): `const f=new FormData();f.append('file',new File(['PK'],'khong-phai-pdf.docx'));fetch('/api/documents',{method:'POST',body:f}).then(r=>console.log(r.status))` | In `415` | Ảnh `06-gui-415.png` |
| 7 | Chạy lại truy vấn analytics | Có đúng 1 dòng mới `doc_upload_rejected` với `attributes` `{"reason":"NOT_PDF"}`; không có tên tệp | Ảnh `07-doc-upload-rejected.png` |
| 8 | Đối chiếu từng sự kiện PRD §5.2 với kết quả (bảng 13 sự kiện: có/không, số lần, khóa thuộc tính) | Bảng đối chiếu: 2 sự kiện phát đúng một lần; các sự kiện còn lại ghi "chưa hiện thực" | Ảnh `08-bang-doi-chieu.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi hành động tạo đúng một dòng sự kiện (không trùng, không thiếu) với đúng `event_code` và thuộc tính cho phép.
2. `doc_upload_started` chỉ có `sizeBytes`; `doc_upload_rejected` chỉ có `reason`; không có tên tệp/nội dung.
3. Khi tính năng liên quan hiện thực, 13 sự kiện của PRD §5.2 đều có dòng tương ứng.
**Không đạt nếu:** sự kiện phát hai lần hoặc không phát; thuộc tính thừa/sai; thiếu sự kiện đã hiện thực.

**Lưu ý:** Hiện chưa có API đọc analytics; truy vấn trực tiếp CSDL dev. Không tự chạy lệnh ghi/sửa dữ liệu. Tệp từ chối ở trình duyệt (bước giao diện) không tạo sự kiện vì không tới máy chủ.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-TEL-01/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-TEL-01/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-TEL-01//video/TC-TEL-01.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-TEL-01//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-TEL-01//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-TEL-01//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-TEL-01
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-TEL-01.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

