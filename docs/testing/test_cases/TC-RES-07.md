# TC-RES-07 — Phiên hết hạn khi đang nhập/gửi

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-07 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-001-AC4, PRD §4.2 |
| Ưu tiên | T |
| Mức/loại, tự động hóa | E2E |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-07/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Phiên hết hạn khi đang nhập/gửi
- **Kết quả mong đợi:** Về đăng nhập; quay lại đúng trang; giữ câu hỏi nếu có thể
- **Ưu:** T
- **Loại:** E2E
- **Truy vết:** US-001-AC4, PRD §4.2

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-RES-07/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Cách làm cho phiên hết hạn (chọn một): (1) trình duyệt: DevTools → Application → Cookies → http://localhost:5173 → xóa cookie `DOCCHAT_SESSION` (làm được qua giao diện); (2) hạ tầng: `UPDATE auth_sessions SET expires_at = now() - interval '1 minute';` bằng `psql -h localhost -p 54329 -U postgres -d postgres` (chỉ ghi cách làm; hạn thật là 8 giờ tuyệt đối).
- Ô nhập câu hỏi hiện bị khóa khi chưa có tài liệu sẵn sàng nên phần "giữ câu hỏi" chỉ kiểm khi có hỏi đáp.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Quan sát địa chỉ trang và vùng "Tài liệu" | Địa chỉ `http://localhost:5173/`, hiện "Xin chào, admin" | Ảnh `05-trang-chinh.png` |
| 6 | Mở DevTools → Application → Cookies và ghi nhận cookie `DOCCHAT_SESSION` | Có cookie `DOCCHAT_SESSION` (HttpOnly) | Ảnh `06-cookie-phien.png` |
| 7 | Xóa cookie `DOCCHAT_SESSION` (mô phỏng hết hạn) | Cookie biến mất; trang vẫn hiển thị cũ cho đến khi gọi API tiếp theo | Ảnh `07-da-xoa-cookie.png` |
| 8 | Bấm "Tải PDF lên" và chọn `data/ok.pdf` (thao tác gọi API khi phiên đã mất) | Yêu cầu `POST /api/documents` trả 401 `UNAUTHENTICATED`; ứng dụng chuyển sang `/login?redirect=%2F&reason=expired` | Ảnh `08-ve-trang-dang-nhap.png` |
| 9 | Quan sát trang đăng nhập | Hiện thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." phía trên biểu mẫu | Ảnh `09-thong-bao-het-han.png` |
| 10 | Đăng nhập lại bằng `admin` và mật khẩu dev | Sau khi đăng nhập trở về đúng trang trước đó (`/`, theo tham số `redirect`) và hiện "Xin chào, admin" | Ảnh `10-quay-lai-dung-trang.png` |
| 11 | Kiểm tra tệp `ok.pdf` đã chọn lúc hết phiên | Không có bản ghi `ok.pdf` mới được tạo trái phép khi chưa đăng nhập (danh sách không tăng ngoài ý muốn) | Ảnh `11-khong-tao-ban-ghi.png` |
| 12 | (Thiết kế — chạy khi có hỏi đáp) Gõ dở câu hỏi vào ô "Câu hỏi về tài liệu", xóa cookie rồi gửi | Sau khi đăng nhập lại và quay về trang, nội dung câu hỏi vẫn còn trong ô nếu có thể (giữ bản nháp) | Ảnh `12-giu-cau-hoi.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khi phiên hết hạn, thao tác tiếp theo đưa người dùng về `/login` kèm thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.".
2. Sau khi đăng nhập lại, người dùng quay lại đúng trang đã ở (theo `redirect`).
3. Không có dữ liệu nào được tạo khi chưa xác thực (401, không bản ghi).
4. Giữ câu hỏi đang nhập "nếu có thể" — chưa kiểm được (hỏi đáp chưa có).

**Không đạt nếu:** không chuyển về đăng nhập (trang trắng/lỗi chung); không có thông báo hết hạn; sau đăng nhập về trang khác với trang trước đó; yêu cầu thành công dù không có phiên.

**Lưu ý:** Ca ưu tiên "T": phần giữ câu hỏi là "nếu có thể" theo Test Plan nên không bắt buộc cho kết luận Đạt của phần đã có.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-07/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-07/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-07//video/TC-RES-07.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-07//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-07//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-07//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-07
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-07.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

