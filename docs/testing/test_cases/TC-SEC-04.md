# TC-SEC-04 — IDOR: truy cập tài liệu/phiên/trích dẫn/tệp bằng id của người khác (mọi route có `{id}`)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-04 |
| Nhóm | B.4 Bảo mật |
| Truy vết | US-021-AC4, NFR-004 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST, IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-04/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** IDOR: truy cập tài liệu/phiên/trích dẫn/tệp bằng id của người khác (mọi route có `{id}`)
- **Kết quả mong đợi:** `404`, phản hồi **giống hệt** id không tồn tại (thân, header, thời gian xấp xỉ)
- **Ưu:** C
- **Loại:** ST, IT
- **Truy vết:** US-021-AC4, NFR-004

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Hiện chỉ có tài khoản `admin`; chưa có quản lý nhiều người dùng nên KHÔNG tạo được "người dùng B". Phần cần hai người dùng (bước 5–7) là đặc tả khi có tính năng.
- Route có `{id}` theo `api/openapi.yaml`: `GET /api/documents/{id}/file` (`x-implemented: false`), `POST /api/conversations/{id}/messages`; các route phiên/trích dẫn/tệp khác sẽ có sau. Liệt kê toàn bộ route `{id}` vào `data/routes-id.txt`.
- UUID thử: `00000000-0000-4000-8000-00000000dead` (không tồn tại) và UUID tài liệu của người dùng B (khi có).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–4 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy `curl -i http://localhost:5173/api/documents/00000000-0000-4000-8000-00000000dead/file` (không cookie) | HTTP 401 `UNAUTHENTICATED` (mặc định từ chối, không lộ id có tồn tại hay không) | Ảnh `01-khong-cookie-401.png` |
| 2 | Đăng nhập `admin` trên trình duyệt, mở Console | Thấy "Xin chào, admin" | Ảnh `02-da-dang-nhap.png` |
| 3 | Chạy `const r=await fetch("/api/documents/00000000-0000-4000-8000-00000000dead/file"); [r.status, await r.text(), [...r.headers]]` | Ghi trạng thái, thân, header (dự kiến 404 `NOT_FOUND` đúng khuôn `{code,message,traceId}`; nếu route chưa hiện thực thì ghi đúng quan sát) | Ảnh `03-id-khong-ton-tai.png` |
| 4 | Lặp bước 3 với id sai định dạng: `/api/documents/abc/file` | Phản hồi cùng khuôn `{code,message,traceId}`, không lộ stack trace/đường dẫn | Ảnh `04-id-sai-dinh-dang.png` |
| 5 | (Chờ tính năng) Người dùng B đăng nhập, tải `b.pdf`, ghi `idB` từ `GET /api/documents` | Có `idB` thuộc B | Ảnh `05-b-tai-tai-lieu.png` |
| 6 | (Chờ tính năng) Người dùng A gọi `GET /api/documents/{idB}/file` và mọi route `{id}` khác với `idB` | HTTP 404 | Ảnh `06-a-goi-id-cua-b.png` |
| 7 | (Chờ tính năng) So sánh phản hồi bước 6 với bước 3: thân, header (trừ `x-request-id`, `date`, `traceId`), thời gian đo 20 lần | Thân và header giống hệt; chênh lệch thời gian trung bình nhỏ (< 20 ms); không có `403` | Ảnh `07-so-sanh-giong-het.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Id của người khác trả 404 với thân và header GIỐNG HỆT id không tồn tại (chỉ khác `traceId`/`x-request-id`/`date`); thời gian xấp xỉ.
2. Không route `{id}` nào trả 403 hay lộ sự tồn tại của tài nguyên.
3. Chưa đăng nhập luôn 401.
**Không đạt nếu:** có route `{id}` trả 403/200/500, hoặc thân/header phân biệt được "của người khác" với "không tồn tại".

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-04/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-04/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-04//video/TC-SEC-04.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-04//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-04//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-04//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-04
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-04.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

