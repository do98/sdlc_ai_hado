# TC-RES-06 — Mất mạng trình duyệt khi hỏi / khi tải lên

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-06 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | US-012-AC4, US-002-AC2 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | RT, E2E |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-06/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Mất mạng trình duyệt khi hỏi / khi tải lên
- **Kết quả mong đợi:** Giữ câu hỏi/hàng đợi; Thử lại sau khi có mạng
- **Ưu:** C
- **Loại:** RT, E2E
- **Truy vết:** US-012-AC4, US-002-AC2

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-RES-06/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Tệp lớn ≈ 9 MB đủ chậm để kịp ngắt mạng giữa chừng: chạy trong `data/` lệnh `node -e "const fs=require('fs');fs.writeFileSync('lon9mb.pdf',Buffer.concat([Buffer.from('%PDF-1.4\n'),Buffer.alloc(9*1024*1024,0x20),Buffer.from('\n%%EOF')]))"`.
- Hai tệp nhỏ bổ sung `ok2.pdf`, `ok3.pdf` (sao chép `ok.pdf`) để kiểm tra "giữ hàng đợi".
- Trình duyệt Edge/Chrome với DevTools → Network → Throttling: dùng "Slow 3G" để kéo dài thời gian tải và "Offline" để ngắt mạng (hoặc Playwright `context.setOffline(true)`).
- Chưa có chức năng xóa tài liệu nên mỗi tệp tải lên chiếm 1 trong 20 chỗ của kho dev: ghi lại bộ đếm "Đã dùng N/20 tài liệu" trước/sau và chỉ tải số tệp tối thiểu.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Bật Network → Throttling → "Slow 3G" | Chế độ đổi thành Slow 3G | Ảnh `05-bat-slow-3g.png` |
| 6 | Bấm "Tải PDF lên" và chọn đồng thời `lon9mb.pdf`, `ok2.pdf`, `ok3.pdf` | Hàng đợi "Hàng đợi tải lên" hiện 3 tệp; tệp đầu "Đang tải N%" còn các tệp sau "Đang chờ" | Ảnh `06-hang-doi-3-tep.png` |
| 7 | Khi `lon9mb.pdf` đang ở khoảng 30–60%, chuyển Throttling sang Offline | Mạng ngắt; yêu cầu tải thất bại | Ảnh `07-ngat-mang-giua-chung.png` |
| 8 | Quan sát hàng đợi trong 10 giây | Tệp hiện "Mất kết nối, tự thử lại sau N giây" (N đếm ngược) và có nút "Hủy"; hai tệp còn lại vẫn nằm trong hàng đợi, không mất | Ảnh `08-mat-ket-noi-tu-thu-lai.png` |
| 9 | Bật lại mạng (No throttling) và chờ đến hết đếm ngược | Tệp tự thử lại và chuyển "Đang tải N%" rồi "Đã tải lên, đang xử lý"; nếu hết số lần thử tự động thì hiện "Tải lên chưa thành công" với nút "Thử lại" | Ảnh `09-tu-thu-lai.png` |
| 10 | Nếu còn tệp ở "Tải lên chưa thành công", bấm "Thử lại" ở tệp đó | Tệp được tải lại thành công "Đã tải lên, đang xử lý" | Ảnh `10-bam-thu-lai.png` |
| 11 | Quan sát danh sách tài liệu và bộ đếm | Cả 3 tệp xuất hiện đúng 1 lần mỗi tệp (không trùng do thử lại); bộ đếm "Đã dùng N/20 tài liệu" tăng đúng 3 | Ảnh `11-ba-tep-khong-trung.png` |
| 12 | (Thiết kế — chạy khi có hỏi đáp) Ngắt mạng rồi gửi câu hỏi `Thời hạn bảo hành là bao lâu?` | Câu hỏi vẫn nằm trong ô/khung hội thoại, có thông báo lỗi mạng và nút "Thử lại"; bật mạng rồi bấm "Thử lại" nhận câu trả lời | Ảnh `12-hoi-khi-mat-mang.png` |

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Mất mạng khi tải: tệp hiện "Mất kết nối, tự thử lại sau N giây", hàng đợi giữ nguyên các tệp chưa tải, "Thử lại" hoạt động sau khi có mạng.
2. Không tạo tài liệu trùng khi thử lại: mỗi tệp đúng 1 bản ghi sau khi tải xong.
3. Mất mạng khi hỏi: câu hỏi được giữ và có thể "Thử lại" — chưa kiểm được (hỏi đáp chưa có) → ghi "Bị chặn" cho phần này.

**Không đạt nếu:** mất tệp khỏi hàng đợi; tải trùng nhiều bản; thông báo không tiếng Việt hoặc không có hành động thử lại; giao diện treo ở "Đang tải" vô hạn khi đã có mạng trở lại.

**Lưu ý:** Số lần thử tự động và khoảng chờ nằm trong `uploadQueue.ts` (`retryDelaysMs`); nếu tệp hết lượt thử tự động hiện "Tải lên chưa thành công" thay vì tiếp tục đếm ngược, đó là hành vi thiết kế.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-06/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-06/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-06//video/TC-RES-06.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-06//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-06//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-06//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-06
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-06.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

