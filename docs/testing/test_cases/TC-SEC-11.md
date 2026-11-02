# TC-SEC-11 — Egress staging

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-11 |
| Nhóm | B.4 Bảo mật |
| Truy vết | RISK-02, G4 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-11/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Egress staging
- **Kết quả mong đợi:** Chỉ tới dịch vụ AI và IdP; đích khác bị chặn
- **Ưu:** C
- **Loại:** ST
- **Truy vết:** RISK-02, G4

## Điều kiện tiên quyết chi tiết
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Ca hạ tầng: kiểm egress máy chủ staging (chỉ tới dịch vụ AI và IdP). Môi trường dev `localhost` không có tường lửa egress và chưa có tích hợp AI/IdP (`apps/api/src/main/java/vn/docchat/integration` chỉ có `package-info.java`) → kết luận dự kiến "Không thể kiểm qua giao diện"/"Bị chặn".
- Cần quyền shell trên máy chủ staging (hoặc container API) và danh sách đích cho phép (tên miền dịch vụ AI, IdP) ghi vào `data/allowlist.txt`.

## Các bước thực hiện
**Hiện trạng:** ca thuộc hạ tầng; bước 1–2 chạy được ở dev để ghi nhận hiện trạng, bước 3–6 chỉ làm được trên staging.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/api/ready` | Trả 200 `{"status":"UP",...}`; ghi "không có staging" nếu chỉ có dev | Ảnh `01-ung-dung-song.png` |
| 2 | Chạy `grep -rn "http" apps/api/src/main/java/vn/docchat/integration` từ gốc repo | Không có mã gọi dịch vụ ngoài — ghi nhận chưa có egress cần kiểm | Ảnh `02-khong-co-tich-hop.png` |
| 3 | (Staging) Từ shell của máy chủ API chạy `curl -m 5 -sS -o /dev/null -w "%{http_code}" https://<dịch vụ AI>` | Kết nối được (mã HTTP từ dịch vụ AI) | Ảnh `03-egress-ai-duoc-phep.png` |
| 4 | (Staging) Chạy tương tự tới IdP | Kết nối được | Ảnh `04-egress-idp-duoc-phep.png` |
| 5 | (Staging) Chạy `curl -m 5 -sS https://example.com` | Bị chặn/timeout | Ảnh `05-egress-la-bi-chan.png` |
| 6 | (Staging) Chạy `curl -m 5 -sS http://169.254.169.254/latest/meta-data/` | Bị chặn/timeout | Ảnh `06-egress-metadata-bi-chan.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Chỉ kết nối được tới dịch vụ AI và IdP trong danh sách cho phép; mọi đích khác (internet công cộng, địa chỉ metadata đám mây) bị chặn.
2. Ở dev: ghi rõ "Không thể kiểm qua giao diện" cùng bằng chứng bước 1–2.
**Không đạt nếu:** kết nối được tới đích ngoài danh sách cho phép từ máy chủ staging.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-11/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-11/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-11//video/TC-SEC-11.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-11//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-11//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-11//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-11
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-11.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

