# TC-INT-UP-CONC — Hai yêu cầu tải đồng thời khi còn 1 chỗ (lặp ≥ 100 lần)

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.3 Chức năng bổ sung của kế hoạch phát triển (chưa có story)". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-INT-UP-CONC |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | RISK-08, US-006-AC3 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | IT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-INT-UP-CONC/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Hai yêu cầu tải đồng thời khi còn 1 chỗ (lặp ≥ 100 lần)
- **Kết quả mong đợi:** Đúng 1 thành công, 1 `WORKSPACE_FULL`
- **Ưu:** C
- **Loại:** IT
- **Truy vết:** RISK-08, US-006-AC3

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Công cụ truy vấn CSDL dev (cần quyền hạ tầng, chỉ đọc trừ khi nêu khác): `psql -h localhost -p 54329 -U postgres -d postgres` (PostgreSQL nhúng của DevServer, dữ liệu ở `apps/api/target/dev-postgres`, không mật khẩu).
- Đưa kho về đúng 19 tài liệu đang hoạt động (còn 1 chỗ; `status <> 'DELETED'` tính là chiếm chỗ, kể cả `ERROR`): tải tệp qua giao diện cho tới khi bộ đếm hiện "Đã dùng 19/20 tài liệu" (hoặc đưa các bản ghi thừa về `DELETED` bằng SQL — chỉ ghi cách làm: `UPDATE documents SET status='DELETED' WHERE id IN (...)`; chưa có chức năng xóa trên giao diện).
- Tệp `test_reports/TC-INT-UP-CONC/data/ok.pdf` (PDF tối thiểu): trong `data/` chạy `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Đoạn lệnh gửi hai yêu cầu đồng thời trong Console DevTools (đã đăng nhập, cùng origin): `const mk=n=>{const fd=new FormData();fd.append("file",new File(["%PDF-1.4\n%%EOF"],n,{type:"application/pdf"}));return fetch("/api/documents",{method:"POST",body:fd}).then(async r=>[r.status,(await r.json()).code??'OK'])};console.log(JSON.stringify(await Promise.all([mk('a.pdf'),mk('b.pdf')])))`
- Phần lặp ≥ 100 lần cần đưa kho về 19 tài liệu sau mỗi lần (SQL `UPDATE` như trên, cần quyền hạ tầng). Phương án tự động đã có: `T07_dong_thoi_khi_con_1_cho_dung_1_yeu_cau_thanh_cong_lap_nhieu_lan` trong `apps/api/src/test/java/vn/docchat/api/DocumentUploadApiTest.java` (lệnh `./mvnw -Dtest=DocumentUploadApiTest#T07_dong_thoi_khi_con_1_cho_dung_1_yeu_cau_thanh_cong_lap_nhieu_lan test` trong `apps/api`); ghi số lần lặp thực tế của test vào báo cáo.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Quan sát bộ đếm tài liệu | Hiện "Đã dùng 19/20 tài liệu" (còn đúng 1 chỗ) | Ảnh `05-con-1-cho.png` |
| 6 | Mở DevTools (F12) → Console, dán đoạn lệnh gửi hai yêu cầu đồng thời ở trên rồi nhấn Enter | Console in mảng gồm đúng 2 phần tử | Ảnh `06-chay-lan-1.png` |
| 7 | Đối chiếu mã trạng thái trong mảng kết quả | Đúng 1 phần tử `[202,"OK"]` và đúng 1 phần tử `[409,"WORKSPACE_FULL"]` (không có 500, không có hai 202) | Ảnh `07-ket-qua-1-thanh-cong-1-day.png` |
| 8 | Quan sát bộ đếm tài liệu sau khi tải lại trang | Hiện "Đã dùng 20/20 tài liệu" và nút hiển thị "Đã đủ số tài liệu" (không bao giờ 21/20) | Ảnh `08-bo-dem-20-20.png` |
| 9 | Chạy `SELECT count(*) FROM documents WHERE status <> 'DELETED';` bằng psql (cần hạ tầng) | Kết quả đúng 20 | Tệp/log `data/sql-dem-20.txt` kèm ảnh màn hình `09-sql-dem-20.png` |
| 10 | (Cần hạ tầng) Đưa kho về 19 tài liệu bằng SQL rồi lặp bước 2–5 đủ 100 lần (script vòng lặp hoặc Playwright), ghi mỗi lần vào `data/ket-qua-lap.csv` | Cả 100 lần đều có đúng 1 `202` và đúng 1 `409 WORKSPACE_FULL`; 0 lần ngoại lệ | Tệp/log `data/ket-qua-lap.csv` kèm ảnh màn hình `10-ket-qua-lap.png` |
| 11 | Chạy lại bài kiểm tra tự động `T07_dong_thoi_...` và ghi kết quả | Test xanh (PASS) | Tệp/log `data/ket-qua-test.txt` kèm ảnh màn hình `11-ket-qua-test.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mỗi lần chạy đồng thời hai yêu cầu khi còn đúng 1 chỗ: đúng 1 yêu cầu thành công (202) và 1 yêu cầu `409` mã `WORKSPACE_FULL`.
2. Lặp ≥ 100 lần không có lần nào vượt 20 tài liệu hoạt động hoặc cả hai cùng thành công/cùng thất bại.
3. Yêu cầu bị từ chối không để lại bản ghi hay tệp lưu trữ mồ côi (số tệp lưu trữ tăng đúng bằng số 202).

**Không đạt nếu:** xuất hiện hai 202 (tổng 21 tài liệu), hoặc cả hai 409, hoặc 500; để lại tệp mồ côi.

**Lưu ý:** Giữ chỗ nguyên tử đã hiện thực (khóa tư vấn `lockWorkspace` + `countActive` trong một giao dịch ở `DocumentUploadService`). Chưa có chức năng xóa nên việc lặp 100 lần cần SQL đặt lại hoặc dùng bài kiểm tra tự động.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-INT-UP-CONC/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-INT-UP-CONC/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-INT-UP-CONC//video/TC-INT-UP-CONC.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-INT-UP-CONC//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-INT-UP-CONC//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-INT-UP-CONC//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-INT-UP-CONC
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-INT-UP-CONC.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

