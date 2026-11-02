# TC-EVAL-03 — `not_found` + `general` (kiến thức phổ thông)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.9 Đánh giá chất lượng AI (EVAL)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-EVAL-03 |
| Nhóm | B.9 Đánh giá chất lượng AI (EVAL) |
| Truy vết | US-008-AC1, US-010-AC3 |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-EVAL-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại câu:** `not_found` + `general` (kiến thức phổ thông)
- **Phép đo:** Tỉ lệ trả "không tìm thấy" đúng
- **Ngưỡng thử:** 90% (kế hoạch TH-06) `[TBD]`
- **Truy vết:** US-008-AC1, US-010-AC3

## Điều kiện tiên quyết chi tiết
- Bộ tài liệu TD-04 và bộ câu hỏi TD-05 theo Test_Plan mục D.1 (nếu chưa có thì tạo trước khi chạy): các PDF có chữ, chủ đề thống nhất (ví dụ chính sách hoàn tiền, bảo hành, quy trình nhân sự) đặt ở `test_reports/TC-EVAL-03/data/td04/`; ghi lại tên tệp và số trang của từng PDF để đối chiếu trích dẫn.
- Bộ câu hỏi lưu ở `test_reports/TC-EVAL-03/data/td05.csv` với cột `id, loai_cau (answerable|not_found|general|multi_doc|followup|cross_language|conflict|partial), cau_hoi, dap_an_chuan, tai_lieu, trang`; quy mô bộ và nhãn chuẩn theo Test_Plan D.1 (giữ nguyên `[TBD]` nếu chưa chốt).
- Mỗi lần chạy ghi phiên bản prompt, mô hình (tên + phiên bản) và ngày vào `test_reports/TC-EVAL-03/data/results_<phienbanprompt>_<mohinh>.csv` (cột `id_cau, tra_loi, trich_dan, dung_sai, ghi_chu, nguoi_cham`) để so sánh giữa các phiên bản prompt/mô hình.
- Điều kiện chạy thật: xử lý nền T08 (tài liệu chuyển "Sẵn sàng") và hỏi đáp/trích dẫn/LLM đã hiện thực; hiện CHƯA có.
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tệp `test_reports/TC-EVAL-03/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Phạm vi: câu `not_found` (chủ đề không có trong TD-04) và `general` (kiến thức phổ thông, ví dụ "Thủ đô của Pháp là gì?"); đáp án chuẩn là hệ thống báo không tìm thấy trong tài liệu, không dùng kiến thức ngoài.

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
| 8 | (Thiết kế — chạy khi có T08 và hỏi đáp) Bấm "Tải PDF lên" và chọn toàn bộ PDF bộ TD-04 trong `data/td04/` (tối đa 20 tệp) | Mỗi tệp hiện "Đã tải lên, đang xử lý"; bộ đếm tăng đúng bằng số tệp | Ảnh `08-tai-bo-td04.png` |
| 9 | (Thiết kế) Chờ tới khi mọi dòng thoát "Đang xử lý" | Mọi tệp hợp lệ hiển thị "Sẵn sàng" (ghi riêng tệp "Sẵn sàng, có cảnh báo" hoặc "Lỗi" nếu có); ô "Câu hỏi về tài liệu" được mở khóa | Ảnh `09-td04-san-sang.png` |
| 10 | (Thiết kế) Gửi từng câu `not_found` rồi quan sát phản hồi | Phản hồi là câu "không tìm thấy trong tài liệu" cố định; Network: một `delta` cố định, KHÔNG có `citation`, `done` có `result` = `not_found` | Ảnh `10-cau-not-found.png` |
| 11 | (Thiết kế) Gửi từng câu `general` rồi quan sát phản hồi | Cùng cách trả "không tìm thấy" (không trả lời bằng kiến thức phổ thông), không trích dẫn | Ảnh `11-cau-general.png` |
| 12 | (Thiết kế) Ghi `dung` khi `result` = `not_found` và không có nội dung bịa; ghi `sai` trong trường hợp còn lại | Cột `dung_sai` đủ cho mọi câu | Ảnh `12-cham-not-found.png` |
| 13 | (Thiết kế) Tính tỉ lệ trả "không tìm thấy" đúng và so với 90% (TH-06) `[TBD]` | Ghi tỉ lệ (%), số câu `not_found` và `general` tách riêng, phiên bản prompt/mô hình | Ảnh `13-ty-le-not-found.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–7 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Tỉ lệ trả "không tìm thấy" đúng trên `not_found` + `general` ≥ 90% (TH-06, `[TBD]`).
2. Không có trích dẫn trong các câu `not_found`; giao diện hiển thị theo `result`, không dựa vào văn bản.
3. Trong giai đoạn hiện tại: "Bị chặn".

**Không đạt nếu:** tỉ lệ dưới 90%; trả lời câu `general` bằng kiến thức ngoài; có trích dẫn trong câu `not_found`.

**Lưu ý:** Chuỗi "không tìm thấy" cố định chưa có trong `messages.ts` (hợp đồng IF-05 ghi "câu cố định"); ghi nhận nguyên văn câu thực tế vào báo cáo.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-EVAL-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-EVAL-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-EVAL-03//video/TC-EVAL-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-EVAL-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-EVAL-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-EVAL-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-EVAL-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-EVAL-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

