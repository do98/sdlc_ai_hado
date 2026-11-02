# TC-SEC-02 — Kiểm tra bộ nhớ trình duyệt sau đăng nhập

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-02 |
| Nhóm | B.4 Bảo mật |
| Truy vết | QAS-02 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST, E2E |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-02/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Kiểm tra bộ nhớ trình duyệt sau đăng nhập
- **Kết quả mong đợi:** Không có token/phiên trong `localStorage`/`sessionStorage`/IndexedDB
- **Ưu:** C
- **Loại:** ST, E2E
- **Truy vết:** QAS-02

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Trình duyệt Edge ở cửa sổ mới (hoặc ngữ cảnh Playwright mới), chưa có cookie `DOCCHAT_SESSION` của `localhost`.
- Xóa Site data của `localhost:5173` trước khi chạy để phép kiểm sạch.
- Đoạn Console quét, lưu thành `data/quet-bo-nho.js`: `JSON.stringify({ls:{...localStorage}, ss:{...sessionStorage}, idb:await indexedDB.databases(), caches:await caches.keys(), sw:(await navigator.serviceWorker.getRegistrations()).length})`.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở `http://localhost:5173/login`, mở DevTools → Application, bấm "Clear site data" | Local storage, Session storage, IndexedDB, Cache storage đều trống | Ảnh `01-bo-nho-sach.png` |
| 2 | Đăng nhập bằng `admin` / `Docchat-Dev-2026!` | Vào `/`, thấy "Xin chào, admin" | Ảnh `02-da-dang-nhap.png` |
| 3 | Mở Application → Local storage → `http://localhost:5173` | Không có khóa nào chứa `session`, `token`, `jwt`, `DOCCHAT`, `auth`, mật khẩu hay tên đăng nhập | Ảnh `03-local-storage.png` |
| 4 | Mở Application → Session storage → `http://localhost:5173` | Không có khóa chứa phiên/token; không có giá trị dạng JWT `xxx.yyy.zzz` | Ảnh `04-session-storage.png` |
| 5 | Mở Application → IndexedDB | Không có CSDL nào chứa phiên/token (có thể không có CSDL nào) | Ảnh `05-indexeddb.png` |
| 6 | Mở Console, dán đoạn quét `data/quet-bo-nho.js` và chạy | Kết quả JSON không có chuỗi khớp `/session|token|jwt|bearer|DOCCHAT|password/i` | Ảnh `06-ket-qua-quet.png` |
| 7 | Nhấn F5 tải lại trang rồi chạy lại đoạn quét | Vẫn ở trạng thái đã đăng nhập (nhờ cookie), kết quả quét vẫn không chứa phiên/token | Ảnh `07-quet-sau-tai-lai.png` |
| 8 | Bấm "Đăng xuất", chạy lại đoạn quét | Về `/login`; bộ nhớ vẫn không có dữ liệu xác thực | Ảnh `08-quet-sau-dang-xuat.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Không có token/phiên/mật khẩu trong `localStorage`, `sessionStorage`, IndexedDB, Cache Storage ở cả ba thời điểm: sau đăng nhập, sau tải lại, sau đăng xuất.
2. Phiên chỉ nằm trong cookie HttpOnly (xem TC-SEC-01).
**Không đạt nếu:** bất kỳ kho lưu trữ nào chứa chuỗi phiên, token, mật khẩu hoặc tên đăng nhập kèm bí mật.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-02/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-02/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-02//video/TC-SEC-02.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-02//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-02//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-02//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-02
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-02.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

