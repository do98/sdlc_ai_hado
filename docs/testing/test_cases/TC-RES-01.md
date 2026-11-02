# TC-RES-01 — Dịch vụ AI timeout / 5xx / 429 / ngắt giữa luồng

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.7 Độ bền và phục hồi". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-RES-01 |
| Nhóm | B.7 Độ bền và phục hồi |
| Truy vết | QAS-03, US-007-AC5 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | RT |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-RES-01/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Dịch vụ AI timeout / 5xx / 429 / ngắt giữa luồng
- **Kết quả mong đợi:** Thông báo ≤ 1 s sau lỗi + Thử lại; câu hỏi được giữ; 0 câu trả lời giả; danh sách tài liệu vẫn dùng được
- **Ưu:** C
- **Loại:** RT
- **Truy vết:** QAS-03, US-007-AC5

## Điều kiện tiên quyết chi tiết
- Ứng dụng sống: `curl http://localhost:5173/api/ready` trả 200 và http://localhost:5173/ mở được (ca này không khởi động/dừng máy chủ, trừ bước ghi rõ cần quyền hạ tầng).
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (không ghi mật khẩu vào báo cáo).
- Tệp `test_reports/TC-RES-01/data/ok.pdf` (PDF tối thiểu, đủ cho giai đoạn hiện tại vì máy chủ chỉ kiểm `%PDF-` trong 1024 byte đầu): chạy trong thư mục `data/` lệnh `node -e "require('fs').writeFileSync('ok.pdf','%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')"`.
- Chưa có chức năng xóa tài liệu nên mỗi tệp tải lên chiếm 1 trong 20 chỗ của kho dev: ghi lại bộ đếm "Đã dùng N/20 tài liệu" trước/sau và chỉ tải số tệp tối thiểu.
- Dịch vụ AI giả lập (stub/WireMock hoặc cờ cấu hình của bản dựng hỏi đáp) để ép 4 kiểu lỗi: chậm quá hạn (TIMEOUT), HTTP 5xx (LLM_UNAVAILABLE), HTTP 429 từ nhà cung cấp, và ngắt kết nối giữa luồng trả lời. Ghi lại cách bật từng kiểu vào `data/stub-notes.md`. Hiện chưa có tích hợp AI nên chưa chuẩn bị được.
- Điều kiện chạy thật: có ít nhất 1 tài liệu "Sẵn sàng" (cần xử lý nền T08) để ô "Câu hỏi về tài liệu" mở khóa.

## Các bước thực hiện
| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Mở http://localhost:5173/ trong trình duyệt chưa đăng nhập | Trình duyệt chuyển sang `/login?redirect=%2F`; thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu" và nút "Đăng nhập" | Ảnh `01-trang-dang-nhap.png` |
| 2 | Nhập `admin` vào ô "Tên đăng nhập" | Ô hiển thị `admin` | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 3 | Nhập mật khẩu dev vào ô "Mật khẩu" | Ô hiển thị ký tự che, không lộ mật khẩu | Không bắt buộc (gộp vào ảnh bước kế tiếp) |
| 4 | Bấm nút "Đăng nhập" | Về trang chính `/`; thấy "Xin chào, admin", nút "Tải PDF lên", bộ đếm "Đã dùng N/20 tài liệu", vùng "Tài liệu" và "Hội thoại" | Ảnh `04-da-dang-nhap.png` |
| 5 | Quan sát vùng "Hội thoại", ô "Câu hỏi về tài liệu" | Ô nhập bị khóa kèm dòng "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi." (khi chưa có tài liệu "Sẵn sàng") | Ảnh `05-hoi-dap-bi-khoa.png` |
| 6 | Bấm "Tải PDF lên" rồi chọn `data/ok.pdf` | Hàng đợi tải lên hiện `ok.pdf` với "Đã tải lên, đang xử lý"; bộ đếm tăng thêm 1 | Ảnh `06-tai-len-ok-pdf.png` |
| 7 | Chờ 10 giây rồi quan sát danh sách tài liệu | Dòng `ok.pdf` hiển thị "Đang xử lý" và KHÔNG chuyển sang "Sẵn sàng" (chưa có xử lý nền T08); ô "Câu hỏi về tài liệu" vẫn bị khóa nên không thể thực hiện các bước thiết kế bên dưới | Ảnh `07-dang-xu-ly-mai-mai.png` |
| 8 | (Thiết kế — chạy khi có hỏi đáp) Bật stub ở chế độ "5xx", chọn một tài liệu "Sẵn sàng", nhập câu hỏi `Thời hạn bảo hành là bao lâu?` vào ô "Câu hỏi về tài liệu" | Câu hỏi hiển thị trong khung hội thoại và đã gửi `POST /api/conversations/{id}/messages` | Ảnh `08-cau-hoi-da-gui.png` |
| 9 | (Thiết kế) Bấm nút gửi câu hỏi rồi bấm đồng hồ ngay khi lỗi xảy ra | Trong tối đa 1 giây sau lỗi hiện thông báo "Dịch vụ trả lời tạm thời không khả dụng. Vui lòng thử lại sau." cùng nút "Thử lại"; Network: luồng kết thúc bằng `event: error` với `code` = `LLM_UNAVAILABLE`, `retryable` = true, KHÔNG có `done` | Ảnh `09-thong-bao-loi-5xx.png` |
| 10 | (Thiết kế) Quan sát khung hội thoại sau lỗi | Câu hỏi của người dùng vẫn còn trong khung; KHÔNG có đoạn trả lời giả/bịa nào được hiển thị | Ảnh `10-cau-hoi-duoc-giu.png` |
| 11 | (Thiết kế) Quan sát vùng "Tài liệu" ngay lúc đó | Danh sách tài liệu vẫn hiển thị, bấm được, không bị khóa hay vỡ giao diện | Ảnh `11-danh-sach-van-dung-duoc.png` |
| 12 | (Thiết kế) Lặp lại bước gửi câu hỏi với stub ở chế độ timeout, rồi 429, rồi ngắt giữa luồng | Timeout: "Câu trả lời mất quá nhiều thời gian. Vui lòng thử lại."; 429: thông báo thử lại sau (mã `RATE_LIMITED`, retryable); ngắt giữa luồng: trạng thái "Bị gián đoạn" kèm hành động thử lại; mỗi trường hợp ≤ 1 s kể từ lúc lỗi | Ảnh `12-cac-kieu-loi-con-lai.png` |
| 13 | (Thiết kế) Tắt stub lỗi rồi bấm "Thử lại" | Câu hỏi cũ được gửi lại, nhận câu trả lời thật có trích dẫn; không phải gõ lại câu hỏi | Ảnh `13-thu-lai-thanh-cong.png` |

**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến "Bị chặn"; bước 1–7 vẫn chạy được để chứng minh.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Với mỗi kiểu lỗi (timeout, 5xx, 429, ngắt giữa luồng), thông báo tiếng Việt xuất hiện ≤ 1 s sau khi lỗi xảy ra, có nút "Thử lại".
2. Câu hỏi của người dùng được giữ nguyên trong khung hội thoại và gửi lại được bằng "Thử lại" (không phải nhập lại).
3. 0 câu trả lời giả: không có nội dung trả lời nào hiển thị khi luồng kết thúc bằng `error` (không có `done`).
4. Danh sách tài liệu vẫn dùng được (xem, tải lên mới) trong và sau lỗi.
5. Trong giai đoạn hiện tại: chứng minh được ô hỏi bị khóa và tài liệu không bao giờ "Sẵn sàng" → "Bị chặn".

**Không đạt nếu:** thông báo xuất hiện sau hơn 1 s hoặc không xuất hiện; mất câu hỏi; hiển thị nội dung trả lời dở dang như câu trả lời hoàn chỉnh; danh sách tài liệu bị khóa; thông báo lộ chi tiết kỹ thuật/mã nhà cung cấp.

**Lưu ý:** Văn bản thông báo cho từng kiểu lỗi lấy từ `messages.errors` (`llmUnavailable`, `timeout`); thông điệp 429 của AI chưa có khóa riêng trong `messages.ts` (chỉ có `auth.rateLimited` cho đăng nhập) → ghi nhận thiếu nếu giao diện hiển thị thông báo chung. Chữ "Bị gián đoạn" và nút "Thử lại" của chat chưa có trong `messages.ts` (hiện chỉ có `errorBoundary.retry` = "Thử lại").

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-RES-01/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-RES-01/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-RES-01//video/TC-RES-01.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-RES-01//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-RES-01//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-RES-01//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-RES-01
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-RES-01.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

