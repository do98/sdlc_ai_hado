# PERF-004 — Tải lên song song

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | PERF-004 |
| Nhóm | PERF — hiệu năng |
| Truy vết | T07 |
| Mức/loại, tự động hóa | Tải lên song song |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/PERF-004/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Loại:** Tải lên song song
- **Tải:** 10 người × 2 tệp
- **Thời lượng:** 10 phút
- **Chỉ tiêu (thử):** Không vượt 20 tài liệu; không mất tệp
- **Nguồn ngưỡng:** T07

## Điều kiện tiên quyết chi tiết
- Backend (cổng 8080) và giao diện (http://localhost:5173/) đang chạy; `GET http://localhost:5173/api/ready` trả 200. Nếu không, ghi "Không chạy được" ở dòng đầu `report.md` và dừng (không tự khởi động máy chủ).
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo). Giới hạn tạm: 10 MB, 100 trang, 20 tài liệu.
- Tạo thư mục `test_reports/PERF-004/data`, `screenshots`, `video`; trình duyệt Edge (Playwright `channel: 'msedge'`) có quay video.
- Kho TRỐNG (0 tài liệu) để phép tính 10 × 2 = 20 chính xác; không có xóa nên dùng CSDL dev sạch. Ghi lại `count` ban đầu qua `fetch('/api/documents')`.
- Tạo 22 tệp PDF nhỏ khác nhau trong `test_reports/PERF-004/data/` (`mau-01.pdf` … `mau-22.pdf`): `node -e "for(let i=1;i<=22;i++)require('fs').writeFileSync('mau-'+String(i).padStart(2,'0')+'.pdf','%PDF-1.4\n% '+i+'\n1 0 obj\n<<>>\nendobj\n')"`.
- Công cụ: k6 hoặc Playwright; lấy cookie `DOCCHAT_SESSION` bằng `curl -i -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"Docchat-Dev-2026!\"}"` rồi chép giá trị Set-Cookie (không ghi vào báo cáo).

## Các bước thực hiện
**Hiện trạng:** Phần tải lên đã hiện thực nên chạy được bằng curl/k6/Playwright; chỉ có một tài khoản admin nên dùng một phiên cho mọi luồng song song (đã nêu ở Lưu ý). Dự kiến kết luận 'Đạt/Không đạt' theo kết quả; nếu không có 10 tài khoản thì ghi rõ hạn chế.

| Bước | Hành động | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Đăng nhập admin ở http://localhost:5173/ và chạy `fetch('/api/documents').then(r=>r.json()).then(console.log)` trong Console | In `{items: [], count: 0, limit: 20}` (kho trống) | Ảnh `01-kho-ban-dau.png` |
| 2 | Chạy 10 luồng song song, mỗi luồng tải 2 tệp (20 tệp đầu) bằng `POST /api/documents` multipart (trường `file`) trong 10 phút (ví dụ `k6 run --vus 10 --iterations 10 data/perf-004.js`) | Mọi yêu cầu trả 202; không có 5xx; không có 409 sớm | Ảnh `02-20-tep-dau.png` |
| 3 | Gửi thêm 2 yêu cầu tải (`mau-21.pdf`, `mau-22.pdf`) đồng thời | Cả hai trả 409 `WORKSPACE_FULL` (giao diện: "Kho đã đủ 20 tài liệu nên không thể tải thêm."); không có yêu cầu nào làm vượt 20 | Ảnh `03-vuot-gioi-han.png` |
| 4 | Mở http://localhost:5173/ và quan sát bộ đếm và nút tải | Bộ đếm "Đã dùng 20/20 tài liệu"; nút đổi thành "Đã đủ số tài liệu" (bị khóa) | Ảnh `04-giao-dien-20-20.png` |
| 5 | Chạy lại `fetch('/api/documents')` và so sánh với danh sách tệp đã gửi thành công | `count` đúng 20; `items.length` đúng 20; mỗi tệp đã nhận 202 đều xuất hiện đúng một lần (không mất, không trùng) | Ảnh `05-doi-chieu-danh-sach.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Không bao giờ vượt 20 tài liệu (`count` ≤ 20) dù tải song song; các yêu cầu thừa nhận 409 `WORKSPACE_FULL`.
2. Không mất tệp: mọi yêu cầu 202 có đúng một hàng trong `GET /api/documents`; không trùng.
3. Giao diện hiển thị "Đã dùng 20/20 tài liệu".
**Không đạt nếu:** `count` > 20; có tệp 202 nhưng không có trong danh sách; có lỗi 5xx; trùng tệp.

**Lưu ý:** Test Plan nêu "10 người × 2 tệp" nhưng dev chỉ có tài khoản admin, nên dùng 10 luồng/phiên cùng tài khoản. Nếu CSDL không sạch phải điều chỉnh số tệp để tổng đạt 20 và ghi rõ.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/PERF-004/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/PERF-004/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/PERF-004//video/PERF-004.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/PERF-004//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/PERF-004//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/PERF-004//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — PERF-004
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/PERF-004.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

