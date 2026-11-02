# TC-US017-AC3 — US-017 — Xem danh sách tài liệu tôi được phép truy cập — tiêu chí AC3

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-017 — Xem danh sách tài liệu tôi được phép truy cập (P0, Pha 1)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US017-AC3 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Cao |
| Mức/loại, tự động hóa | SEC+API (Tự động) |
| Trạng thái điều kiện | Chờ mô hình quyền (OQ-007 — A.8-1) |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US017-AC3/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Có tài liệu của người khác ngoài phạm vi chia sẻ của tôi

### Các bước (When)

Tôi mở danh sách

### Kết quả mong đợi (Then)

Tôi không thấy tài liệu đó

### Dữ liệu / ghi chú

Theo AC

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Hiện chỉ có MỘT tài khoản (`admin`, vai trò ADMIN); chưa có chức năng tạo/gán người dùng, nên các điều kiện "người dùng khác" chỉ thiết lập được khi có phân quyền nhiều người dùng (seed TD-09: người dùng thường A, B).
- Dữ liệu: tài liệu của người dùng B (ngoài phạm vi chia sẻ của A) và tài liệu A được phép xem; seed TD-09. Mô hình "phạm vi chia sẻ" chưa có trong mã (danh sách hiện là toàn bộ kho dùng chung).
- Tạo PDF tối thiểu (đủ qua kiểm tra `%PDF-`), chạy tại thư mục gốc repo: `node -e "const fs=require('fs');fs.mkdirSync('test_reports/TC-US017-AC3/data',{recursive:true});fs.writeFileSync('test_reports/TC-US017-AC3/data/tai-lieu-cua-A.pdf','%PDF-1.4\n%%EOF\n')"` (tên khác cho tài liệu B: `tai-lieu-rieng-cua-B.pdf`).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; các bước 1–4 (đăng nhập và quan sát trạng thái hiện tại) vẫn chạy được để chứng minh; các bước 5–8 là đặc tả theo thiết kế, chạy khi có tính năng.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Mở `http://localhost:5173/api/documents` ở thẻ mới | Phản hồi 200, mỗi phần tử có `uploadedBy`; hiện chỉ có tài khoản `admin` (một người tải lên) → chưa có tình huống "tài liệu của người khác"; danh sách là toàn bộ kho dùng chung | Ảnh `04-api-toan-kho.png` |
| 5 | Đăng nhập tài khoản B, tải `tai-lieu-rieng-cua-B.pdf` và không chia sẻ cho A; đăng xuất B | Tài liệu của B xuất hiện trong danh sách của B với trạng thái "Đang xử lý" | Ảnh `05-B-tai-len.png` |
| 6 | Đăng nhập lại tài khoản A và quan sát "Danh sách tài liệu" | Danh sách KHÔNG có `tai-lieu-rieng-cua-B.pdf`; chỉ có tài liệu A được phép xem | Ảnh `06-A-danh-sach.png` |
| 7 | Với A mở `GET /api/documents` và tìm tên tệp của B trong thân JSON | `items` không chứa `tai-lieu-rieng-cua-B.pdf`; `count` không tính tài liệu đó | Ảnh `07-A-api.png` |
| 8 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `08-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Người dùng A không thấy tài liệu ngoài phạm vi chia sẻ ở giao diện.
2. Phản hồi `GET /api/documents` của A không chứa tài liệu đó (không chỉ ẩn ở giao diện).
**Không đạt nếu:** tên tài liệu của B xuất hiện ở giao diện hoặc trong JSON của A.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US017-AC3/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US017-AC3/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US017-AC3//video/TC-US017-AC3.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US017-AC3//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US017-AC3//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US017-AC3//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US017-AC3
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US017-AC3.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

