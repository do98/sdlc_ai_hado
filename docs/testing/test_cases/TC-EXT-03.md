# TC-EXT-03 — Luồng đóng bất ngờ (ngắt mạng/khởi động lại máy chủ)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.3 Chức năng bổ sung của kế hoạch phát triển (chưa có story)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-EXT-03 |
| Nhóm | B.3 Chức năng bổ sung |
| Truy vết | F-13 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | E2E, RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-EXT-03/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Luồng đóng bất ngờ (ngắt mạng/khởi động lại máy chủ)
- **Kết quả mong đợi:** Trạng thái "Bị gián đoạn" + giữ phần đã nhận + Tạo lại
- **Ưu:** C
- **Loại:** E2E, RT
- **Truy vết:** F-13

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/TC-EXT-03/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Tài liệu "Sẵn sàng" dài `test_reports/TC-EXT-03/data/tai-lieu-dai.pdf`. Cách gây gián đoạn: (a) DevTools > Network > Offline giữa luồng; (b) khởi động lại backend — KHÔNG tự thực hiện, nhờ người vận hành khởi động lại và ghi thời điểm.

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–7 vẫn chạy được để chứng minh. (chưa có hỏi đáp; chỉ chạy được tới bước tải tài liệu)

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login` (cửa sổ ẩn danh) | Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Ảnh `02-nhap-ten.png` |
| 3 | Nhập `Docchat-Dev-2026!` vào ô "Mật khẩu" | Ký tự hiển thị dạng chấm (không chụp mật khẩu dạng rõ) | Ảnh `03-nhap-mat-khau.png` |
| 4 | Bấm nút "Đăng nhập" | Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; `POST /api/auth/login` trả 204 | Ảnh `04-da-dang-nhap.png` |
| 5 | Bấm nút "Tải PDF lên" (với Playwright: `page.waitForEvent('filechooser')` rồi bấm nút) | Hộp thoại chọn tệp của hệ điều hành mở (chọn được nhiều tệp) | Ảnh `05-mo-hop-thoai-chon-tep.png` |
| 6 | Chọn tệp `data/tai-lieu-dai.pdf` trong hộp thoại | Xuất hiện hàng `tai-lieu-dai.pdf` với trạng thái "Đã tải lên, đang xử lý" rồi "Đang xử lý"; bộ đếm "Đã dùng n/20 tài liệu" tăng 1 | Ảnh `06-da-tai-len.png` |
| 7 | Quan sát trạng thái tài liệu và ô hỏi | Hiện nay "Đang xử lý", ô khóa — điểm bị chặn | Ảnh `07-bi-chan.png` |
| 8 | [Theo thiết kế] Gửi câu hỏi dài, khi chữ đang hiện đặt Network "Offline" | Luồng dừng giữa chừng; hiển thị "Bị gián đoạn"; phần chữ đã nhận được giữ nguyên; có nút "Tạo lại" | Ảnh `08-gian-doan-offline.png` |
| 9 | [Theo thiết kế] Đặt Network về Online | Phần chữ cũ vẫn còn, nhãn vẫn "Bị gián đoạn" (không tự sinh câu trả lời giả) | Ảnh `09-van-giu-phan-da-nhan.png` |
| 10 | [Theo thiết kế] Gửi câu hỏi dài khác, nhờ người vận hành khởi động lại backend giữa luồng | Cũng hiển thị "Bị gián đoạn" + giữ phần chữ đã nhận + nút "Tạo lại"; không có `done`/`error` ở cuối luồng | Ảnh `10-gian-doan-restart.png` |
| 11 | [Theo thiết kế] Bấm "Tạo lại" sau khi backend/mạng phục hồi | Sinh lượt mới như TC-EXT-02 | Ảnh `11-tao-lai.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khi luồng đóng bất ngờ (mất mạng/khởi động lại máy chủ) hiển thị "Bị gián đoạn", giữ phần chữ đã nhận và có nút "Tạo lại".
2. Không có câu trả lời giả; "Tạo lại" hoạt động.
**Không đạt nếu:** mất phần đã nhận; hiện "Hoàn tất"/giả; không có "Tạo lại"; kẹt trạng thái đang trả lời.

**Lưu ý:** Ca loại E2E, RT (hồi quy). Khởi động lại máy chủ phải do người vận hành thực hiện.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-EXT-03/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-EXT-03/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-EXT-03//video/TC-EXT-03.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-EXT-03//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-EXT-03//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-EXT-03//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-EXT-03
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-EXT-03.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

