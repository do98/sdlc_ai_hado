# TC-US023-AC2 — US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi — tiêu chí AC2

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi (P0, Pha 2)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-US023-AC2 |
| Nhóm | A. Tiêu chí chấp nhận (user story) |
| Ưu tiên | Cao |
| Mức/loại, tự động hóa | INT (Tự động) |
| Trạng thái điều kiện | Cần dữ liệu pilot hoặc mô phỏng 2 tuần |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-US023-AC2/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

### Điều kiện tiên quyết (Given)

Hai tuần pilot liên tiếp

### Các bước (When)

Tôi đối chiếu báo cáo với mẫu kiểm tra

### Kết quả mong đợi (Then)

Mỗi tuần có báo cáo; số câu hỏi lệch ≤ 5% so với số đếm mẫu

### Dữ liệu / ghi chú

Đối chiếu báo cáo với đếm trực tiếp (lệch ≤ 5%)

## Điều kiện tiên quyết chi tiết
- Đăng nhập được bằng tài khoản dev `admin` / `Docchat-Dev-2026!`; `http://localhost:5173/api/ready` trả 200.
- Hai tuần pilot liên tiếp, có mẫu kiểm tra: đếm trực tiếp số câu hỏi từng tuần (từ nhật ký/CSDL) ghi ở `./test_reports/TC-US023-AC2/data/dem-mau.md`. Cần tác vụ báo cáo (chưa có) và hỏi đáp (chưa có).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; các bước 1–4 (đăng nhập và quan sát trạng thái hiện tại) vẫn chạy được để chứng minh; các bước 5–9 là đặc tả theo thiết kế, chạy khi có tính năng.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở trình duyệt và vào http://localhost:5173/ (phiên mới, chưa đăng nhập) | Trình duyệt chuyển sang `/login?redirect=%2F`; tiêu đề "Đăng nhập" hiện ra cùng ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" và `Docchat-Dev-2026!` vào ô "Mật khẩu" | Hai ô đã có giá trị (mật khẩu hiển thị dạng che); chưa có thông báo lỗi nào | Ảnh `02-da-nhap-thong-tin.png` |
| 3 | Bấm nút "Đăng nhập" | Chuyển về `/`; hiện "Xin chào, admin" và nút "Đăng xuất"; thấy các khu "Tài liệu", "Hội thoại", "Nguồn" (viewport từ 1280 px trở lên; màn hẹp hơn thì mở khu "Tài liệu" bằng nút "Mở danh sách tài liệu" hoặc thẻ tab) | Ảnh `03-trang-chinh.png` |
| 4 | Quan sát toàn bộ giao diện chính (đầu trang, khu "Người dùng", menu) | KHÔNG có mục/liên kết báo cáo tuần; `api/openapi.yaml` cũng không có đường dẫn báo cáo (bằng chứng chặn) | Ảnh `04-khong-co-bao-cao.png` |
| 5 | Ghi số đếm trực tiếp số câu hỏi của tuần 1 và tuần 2 (từ dữ liệu gốc) | Có hai số đếm mẫu C1 và C2 | Ảnh `05-dem-mau.png` |
| 6 | Lấy báo cáo của tuần 1 và tuần 2 | Có đủ 2 báo cáo, mỗi tuần một báo cáo | Ảnh `06-hai-bao-cao.png` |
| 7 | Với mỗi tuần, tính độ lệch = |số câu hỏi trong báo cáo − số đếm mẫu| / số đếm mẫu | Hai tỷ lệ lệch được ghi ra (tuần 1, tuần 2) | Ảnh `07-do-lech.png` |
| 8 | Đối chiếu độ lệch với ngưỡng 5% | Cả hai tuần có độ lệch ≤ 5% | Ảnh `08-doi-chieu.png` |
| 9 | Đối chiếu kết quả các bước với "Kết quả mong đợi tổng thể" bên dưới và ghi Đạt/Không đạt/Bị chặn | Mỗi tiêu chí tổng thể có ảnh chứng minh hoặc lý do bị chặn được ghi rõ | Ảnh `09-doi-chieu-tong-the.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi tuần pilot có một báo cáo.
2. Số câu hỏi trong báo cáo lệch ≤ 5% so với số đếm mẫu ở cả hai tuần.
**Không đạt nếu:** thiếu báo cáo của một tuần, hoặc có độ lệch > 5%.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-US023-AC2/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-US023-AC2/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-US023-AC2//video/TC-US023-AC2.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-US023-AC2//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-US023-AC2//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-US023-AC2//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-US023-AC2
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-US023-AC2.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

