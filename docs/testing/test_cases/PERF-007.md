# PERF-007 — Giao diện

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-007 |
| Nhóm | PERF — hiệu năng |
| Truy vết | UXS-03, Blueprint §3.8.1 (`[Đề xuất]`) |
| Mức/loại, tự động hóa | Giao diện |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-007/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Giao diện
- **Tải:** Lighthouse trên bản dựng
- **Thời lượng:** Mỗi bản phát hành
- **Chỉ tiêu (thử):** FCP ≤ 1,5 s; LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1; JS ban đầu ≤ 250 KB nén
- **Nguồn ngưỡng:** UXS-03, Blueprint §3.8.1 (`[Đề xuất]`)

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-007/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Edge/Chrome bản mới; đóng mọi tiện ích mở rộng (dùng cửa sổ ẩn danh); DevTools > Lighthouse. Ghi cấu hình (Mobile/Desktop, Throttling) vào báo cáo; chạy mỗi cấu hình 3 lần và lấy trung vị.
- Ngưỡng: FCP ≤ 1,5 s; LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1; JS ban đầu ≤ 250 KB nén (gzip/brotli).

## Các bước thực hiện
**Hiện trạng:** Chạy được qua trình duyệt (Lighthouse trong DevTools) tại localhost:5173, nhưng đây là máy chủ phát triển Vite (chưa tối ưu): số đo FCP/LCP/JS không đại diện cho bản dựng. Kết luận chính thức cần bản dựng (`npm run build` + `npm run preview`, do người vận hành chạy) → ghi rõ trong báo cáo.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` trong cửa sổ ẩn danh và mở DevTools > Lighthouse | Panel Lighthouse hiện, trang đăng nhập đã tải | Ảnh `01-lighthouse-san-sang.png` |
| 2 | Chọn Mode "Navigation", Device "Desktop", Categories "Performance" rồi bấm "Analyze page load" | Báo cáo hiện điểm Performance cùng FCP, LCP, CLS, TBT | Ảnh `02-bao-cao-dang-nhap.png` |
| 3 | Ghi FCP, LCP, CLS vào bảng | Giá trị FCP ≤ 1,5 s, LCP ≤ 2,5 s, CLS ≤ 0,1 hoặc ghi rõ vượt ngưỡng | Ảnh `03-so-do-dang-nhap.png` |
| 4 | Đăng nhập `admin` / `Docchat-Dev-2026!` để vào `/`, rồi chạy Lighthouse lần nữa với bỏ chọn "Clear storage" | Báo cáo cho màn hình chính (đã đăng nhập) với FCP, LCP, CLS | Ảnh `04-bao-cao-man-hinh-chinh.png` |
| 5 | Chạy Lighthouse mode "Timespan", thao tác bấm "Tải PDF lên" rồi đóng hộp thoại và bấm vào ô nhập, sau đó "Stop" | Báo cáo có INP (nếu có đủ tương tác) ≤ 200 ms; nếu không đủ dữ liệu ghi "Không đo được" | Ảnh `05-inp.png` |
| 6 | Mở tab Network, bật "Disable cache", tải lại `/login` rồi lọc "JS" và đọc cột "Transferred" | Cộng các tệp JS tải trước khi tương tác; tổng nén ≤ 250 KB (chú ý đây là dev server nên có thể lớn hơn nhiều) | Ảnh `06-kich-thuoc-js.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Trên bản dựng phát hành: FCP ≤ 1,5 s; LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1; JS ban đầu ≤ 250 KB nén.
2. Mỗi số đo có ảnh báo cáo Lighthouse; ghi cấu hình thiết bị/mạng.
**Không đạt nếu:** bất kỳ chỉ số vượt ngưỡng trên bản dựng; hoặc không đo được.

**Lưu ý:** Chạy trên dev server chỉ mang tính tham khảo. Test Plan không nêu cấu hình thiết bị/mạng (Mobile hay Desktop, throttling); phải chốt trước khi kết luận Đạt/Không đạt.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-007/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-007/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-007//video/PERF-007.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-007//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-007//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-007//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-007
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-007.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

