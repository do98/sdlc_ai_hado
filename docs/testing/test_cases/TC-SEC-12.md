# TC-SEC-12 — Phụ thuộc và bí mật

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-12 |
| Nhóm | B.4 Bảo mật |
| Truy vết | G4 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-12/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Phụ thuộc và bí mật
- **Kết quả mong đợi:** Không lỗ hổng cao; không bí mật trong repo/ảnh
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** G4

## Điều kiện tiên quyết chi tiết
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Ca kiểm công cụ, không có giao diện. Công cụ: `npm audit`, `mvn org.owasp:dependency-check-maven:check` (hoặc `osv-scanner`), `gitleaks detect` (hoặc `trufflehog`), `trivy image` nếu có ảnh. Chạy ở gốc repo, KHÔNG sửa mã.
- Lưu báo cáo công cụ vào `test_reports/TC-SEC-12/data/`; "ảnh chụp" là ảnh terminal kết quả.

## Các bước thực hiện
**Hiện trạng:** ca không có giao diện → "Không thể kiểm qua giao diện" nếu công cụ chưa cài; các lệnh dưới đây chạy được ở máy dev.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Chạy `cd apps/web && npm audit --omit=dev --audit-level=high` | 0 lỗ hổng mức high/critical (hoặc liệt kê gói cần xử lý) | Ảnh `01-npm-audit-prod.png` |
| 2 | Chạy `cd apps/web && npm audit --audit-level=high` | Ghi số lỗ hổng cả devDependencies; mục tiêu 0 high/critical | Ảnh `02-npm-audit-dev.png` |
| 3 | Chạy `cd apps/api && mvn -q org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7` | Build không thất bại do CVSS ≥ 7; hoặc ghi "công cụ chưa cài" | Ảnh `03-maven-dependency-check.png` |
| 4 | Chạy `gitleaks detect --source . --no-banner` | Không phát hiện bí mật (khóa API, mật khẩu, khóa mã hóa) | Ảnh `04-gitleaks.png` |
| 5 | Chạy `grep -rnE "ENCRYPTION_KEY=|PASSWORD=" --include=*.yml --include=*.yaml --include=*.properties --include=.env* .` | Không có khóa mã hóa/mật khẩu thật trong mã; `application.yml` để trống biến bắt buộc (ví dụ `DOCCHAT_STORAGE_ENCRYPTION_KEY:`); mật khẩu dev công khai chỉ ở tài liệu dev/README | Ảnh `05-grep-bi-mat.png` |
| 6 | (Nếu có ảnh) Chạy `trivy image <ảnh>` | Không lỗ hổng cao/nghiêm trọng; không có tệp bí mật trong các lớp ảnh | Ảnh `06-trivy-anh.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Không lỗ hổng mức cao/nghiêm trọng chưa xử lý ở phụ thuộc (npm, Maven, ảnh).
2. Không có bí mật thật trong lịch sử/mã nguồn repo hay ảnh; chỉ mật khẩu dev công khai được phép.
**Không đạt nếu:** còn lỗ hổng high/critical không có ngoại lệ được duyệt; phát hiện khóa/mật khẩu thật trong repo/ảnh.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-12/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-12/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-12//video/TC-SEC-12.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-12//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-12//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-12//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-12
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-12.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

