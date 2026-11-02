# TC-SEC-05 — Cô lập dữ liệu ở tầng truy vấn: người dùng A không nhận đoạn của B kể cả khi chỉ định phạm vi

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-05 |
| Nhóm | B.4 Bảo mật |
| Truy vết | US-008-AC2, US-021-AC2, NFR-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST, IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-05/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Cô lập dữ liệu ở tầng truy vấn: người dùng A không nhận đoạn của B kể cả khi chỉ định phạm vi
- **Kết quả mong đợi:** 0 đoạn của B trong kết quả
- **Ưu:** C
- **Loại:** ST, IT
- **Truy vết:** US-008-AC2, US-021-AC2, NFR-004

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Cần hai người dùng A và B và tính năng hỏi đáp/truy vấn đoạn (chưa có). Dữ liệu: `data/a.pdf` chứa cụm duy nhất `MARKER-A-7391`, `data/b.pdf` chứa `MARKER-B-5528` (PDF văn bản tối thiểu `%PDF-1.4` tạo bằng script Node).
- Mức kiểm: tầng truy vấn/dịch vụ (IT) và API; giao diện chỉ để tạo dữ liệu và chứng minh bị chặn.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–3 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Đăng nhập `admin` (vai trò A) tại `/login` | Vào `/`, thấy "Xin chào, admin" | Ảnh `01-dang-nhap-a.png` |
| 2 | Bấm "Tải PDF lên", chọn `data/a.pdf` | Hàng `a.pdf` hiện với trạng thái "Đang xử lý" (xử lý nền T08 chưa có nên chưa "Sẵn sàng") | Ảnh `02-tai-a-pdf.png` |
| 3 | Quan sát ô "Câu hỏi về tài liệu" | Ô bị khóa kèm "Chưa có tài liệu sẵn sàng…" — chứng minh chưa thể hỏi | Ảnh `03-o-hoi-bi-khoa.png` |
| 4 | (Chờ tính năng) Người dùng B đăng nhập, tải `b.pdf`, chờ "Sẵn sàng" | Tài liệu của B ở "Sẵn sàng" | Ảnh `04-b-san-sang.png` |
| 5 | (Chờ tính năng) A hỏi "MARKER-B-5528 là gì?" không chỉ định phạm vi | Không có trích dẫn nào từ `b.pdf`; trả lời kiểu "không tìm thấy" | Ảnh `05-a-hoi-khong-pham-vi.png` |
| 6 | (Chờ tính năng) A gửi câu hỏi kèm phạm vi chỉ định tài liệu của B (`idB`) | HTTP 404 hoặc kết quả rỗng; 0 đoạn của B | Ảnh `06-a-chi-dinh-pham-vi-b.png` |
| 7 | (Chờ tính năng) Đếm số đoạn của B trong mọi kết quả/trích dẫn của A (SQL hoặc log truy vấn) | Bằng 0 | Ảnh `07-dem-doan-cua-b.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Trong mọi kết quả truy vấn của A (có/không chỉ định phạm vi) có 0 đoạn thuộc tài liệu của B.
2. Chỉ định `idB` làm phạm vi không làm lộ nội dung hay sự tồn tại của tài liệu B.
**Không đạt nếu:** xuất hiện dù chỉ 1 đoạn/trích dẫn của B trong kết quả của A.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-05/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-05/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-05//video/TC-SEC-05.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-05//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-05//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-05//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-05
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-05.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

