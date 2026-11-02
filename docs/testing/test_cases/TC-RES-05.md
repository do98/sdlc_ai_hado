# TC-RES-05 — Object storage/CSDL lỗi khi tải lên

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-05 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-002-AC2 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-05/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Object storage/CSDL lỗi khi tải lên
- **Kết quả mong đợi:** `500`/thông báo chung; không bản ghi/tệp mồ côi
- **Ưu:** C
- **Loại:** RT
- **Truy vết:** US-002-AC2

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-RES-05/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Chưa có chức năng xóa tài liệu nên mỗi tệp tải lên chiếm 1 trong 20 chỗ của kho dev: ghi lại bộ đếm "Đã dùng N/20 tài liệu" trước/sau và chỉ tải số tệp tối thiểu.
- Ghi lại số tài liệu ban đầu: Console DevTools `(await (await fetch('/api/documents')).json())` — lưu số phần tử vào `data/truoc.json`.
- Đếm tệp lưu trữ ban đầu (cần hạ tầng, chỉ đọc): PowerShell `(Get-ChildItem -Recurse -File apps\api\target\dev-storage).Count`. Tên tệp lưu theo `documents/<userId>/<documentId>.pdf` (mã hóa AES-GCM, không chứa tên gốc).
- Cách gây lỗi lưu trữ (cần quyền hạ tầng, chỉ ghi cách làm, người có quyền thực hiện và khôi phục): cấm ghi vào thư mục lưu tệp `icacls apps\api\target\dev-storage /deny "%USERNAME%:(OI)(CI)W"`; khôi phục `icacls apps\api\target\dev-storage /remove:d "%USERNAME%"`. Nếu quyền ghi bị bỏ qua, dùng phương án thay thế: chạy lại DevServer với biến `DOCCHAT_STORAGE_DIR` trỏ tới tệp (không phải thư mục).
- Lỗi CSDL khi ghi bản ghi (sau khi tệp đã lưu) được kiểm tự động bởi `apps/api/src/test/java/vn/docchat/api/DocumentUploadFailureTest.java` (lệnh `./mvnw -Dtest=DocumentUploadFailureTest test` trong `apps/api`); không thể gây lỗi CSDL dev mà không dừng cả DevServer.
- Đoạn lệnh tải lên bằng Console: `const fd=new FormData();fd.append("file",new File(["%PDF-1.4\n%%EOF"],"a.pdf",{type:"application/pdf"}));const r=await fetch("/api/documents",{method:"POST",body:fd});console.log(r.status,await r.json())`

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Chạy `curl http://localhost:5173/api/ready` khi hệ thống bình thường | HTTP 200, thành phần CSDL và lưu trữ đều "up" (xem schema `Readiness` trong `api/openapi.yaml`) | Tệp/log `data/ready-truoc.txt` kèm ảnh màn hình `05-ready-truoc.png` |
| 6 | (Cần hạ tầng) Cấm ghi vào `apps\api\target\dev-storage` theo lệnh `icacls` ở trên | Lệnh báo thành công | Ảnh `06-cam-ghi-thu-muc.png` |
| 7 | Bấm "Tải PDF lên" và chọn `data/ok.pdf` | Dòng `ok.pdf` chuyển "Tải lên chưa thành công" (không phải "Đã tải lên, đang xử lý"); có nút "Thử lại" | Ảnh `07-tai-len-that-bai.png` |
| 8 | Mở tab Network và xem yêu cầu `POST /api/documents` vừa gửi | HTTP 500; phản hồi JSON có `code` = `INTERNAL`, không chứa đường dẫn, tên tệp hay stack trace | Ảnh `08-phan-hoi-500.png` |
| 9 | Quan sát thông báo trên giao diện | Hiển thị thông báo chung "Có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau." (không lộ chi tiết kỹ thuật) | Ảnh `09-thong-bao-chung.png` |
| 10 | Chạy trong Console `(await (await fetch('/api/documents')).json())` rồi so với `data/truoc.json` | Số tài liệu không đổi, không có bản ghi `ok.pdf` mới; bộ đếm "Đã dùng N/20 tài liệu" không tăng | Ảnh `10-khong-ban-ghi-mo-coi.png` |
| 11 | (Cần hạ tầng) Đếm lại tệp trong `dev-storage` | Số tệp bằng số ban đầu (không có tệp mồ côi) | Tệp/log `data/dem-tep-sau.txt` kèm ảnh màn hình `11-dem-tep-sau.png` |
| 12 | (Cần hạ tầng) Khôi phục quyền ghi bằng `icacls ... /remove:d`, tải lại `data/ok.pdf` | Lần này tải thành công "Đã tải lên, đang xử lý"; chứng minh lỗi trước đó được phục hồi | Ảnh `12-khoi-phuc-thanh-cong.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Khi lưu trữ lỗi, yêu cầu tải lên trả HTTP 500 mã `INTERNAL` và giao diện hiện thông báo chung, không lộ chi tiết.
2. Không có bản ghi tài liệu mới (danh sách và bộ đếm không đổi) và không có tệp mồ côi trong thư mục lưu trữ.
3. Sau khi khôi phục, tải lên lại thành công, không cần khởi động lại.
4. Phần "CSDL lỗi" được chứng minh bằng kết quả `DocumentUploadFailureTest` (ghi trạng thái xanh/đỏ) vì không gây lỗi CSDL dev được.

**Không đạt nếu:** trả mã khác 500 (ví dụ 200/202) dù lưu lỗi; thông báo lộ đường dẫn/tên tệp/stack; còn bản ghi `PROCESSING` hoặc tệp mồ côi; /api/ready vẫn báo đủ "up" trong lúc thư mục lưu trữ bị lỗi.

**Lưu ý:** `/api/ready` được thiết kế phản ánh lỗi lưu trữ/CSDL bằng 503 `NOT_READY` (xem `ReadinessStorageDownTest`, `ReadinessDatabaseDownTest`); có thể kiểm thêm sau bước 3.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-05/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-05/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-05//video/TC-RES-05.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-05//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-05//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-05//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-05
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-05.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

