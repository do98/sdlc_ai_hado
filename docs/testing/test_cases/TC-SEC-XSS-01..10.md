# TC-SEC-XSS-01..10 — Tên tệp, nội dung PDF, câu hỏi, câu trả lời của mô hình (giả lập) chứa `<script>`, `<img onerror>`, `javascript:`, `<svg onload>`, `<iframe>`, Markdown với HTML

> Tách từ [Test_Plan.md](../Test_Plan.md) — mục "B.4 Bảo mật". Mỗi tệp là một ca kiểm thử.

## Thông tin ca kiểm thử

| Trường | Nội dung |
|---|---|
| ID | TC-SEC-XSS-01..10 |
| Nhóm | B.4 Bảo mật |
| Truy vết | RISK-11 |
| Ưu tiên | C |
| Mức/loại, tự động hóa | ST, E2E |
| **URL ứng dụng cần kiểm thử** | **http://localhost:5173/** |
| **Thư mục bằng chứng (artifact)** | **`./test_reports/TC-SEC-XSS-01..10/`** |

## Môi trường

- Giao diện: http://localhost:5173/ (Vite dev, proxy `/api` sang backend cổng 8080). Máy chủ phải đang chạy; nếu chưa, xem mục "Chạy nhanh" trong README của repo.
- Tài khoản dev: `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; đổi bằng `DOCCHAT_ADMIN_USERNAME`, `DOCCHAT_ADMIN_PASSWORD`).
- Dữ liệu kiểm thử (TD-xx): xem Test_Plan mục D.1; PDF mẫu tự sinh nếu chưa có.
- Hiện đã hiện thực: đăng nhập, tải PDF lên, danh sách tài liệu và cập nhật thời gian thực. **Chưa có**: xử lý nền (T08), hỏi đáp, trích dẫn, xóa, phân quyền nhiều người dùng, báo cáo tuần. Ca phụ thuộc phần chưa có → kết luận "Bị chặn" (kèm bằng chứng), không phải "Đạt".

## Nội dung ca kiểm thử (nguyên văn từ Test Plan)

- **Ca kiểm thử:** Tên tệp, nội dung PDF, câu hỏi, câu trả lời của mô hình (giả lập) chứa `<script>`, `<img onerror>`, `javascript:`, `<svg onload>`, `<iframe>`, Markdown với HTML thô, liên kết `data:`, thuộc tính sự kiện, CSS độc, chuỗi Unicode điều khiển — kiểm tra ở `AnswerRenderer`, danh sách nguồn, tên tài liệu, ngăn nguồn, thông báo lỗi
- **Kết quả mong đợi:** **Không có mã nào thực thi**; chuỗi hiển thị dạng văn bản/đã làm sạch
- **Ưu:** C
- **Loại:** ST, E2E
- **Truy vết:** RISK-11

## Điều kiện tiên quyết chi tiết
- Tài khoản dev `admin` / `Docchat-Dev-2026!` (chỉ môi trường phát triển; không ghi mật khẩu vào báo cáo).
- Máy chủ giao diện (cổng 5173) và API (cổng 8080) đang chạy; `http://localhost:5173/api/ready` trả 200 với `{"status":"UP",...}`. Không khởi động/dừng máy chủ trong ca này.
- Tất cả payload dưới đây là DỮ LIỆU THỬ vô hại (chỉ gán biến `window.__xss`), dùng riêng cho hệ thống dev của dự án để kiểm tra chống XSS; không dùng ở nơi khác.
- Ca là MỘT tệp gồm 10 kịch bản XSS-01..10 theo thứ tự Test Plan: `<script>`, `<img onerror>`, `javascript:`, `<svg onload>`, `<iframe>`, Markdown + HTML thô, liên kết `data:`, thuộc tính sự kiện, CSS độc, Unicode điều khiển. Bảng payload (tên tệp, thêm đuôi `.pdf`):
- - XSS-01 (thẻ `<script>`): `<script>window.__xss=1;`
- - XSS-02 (ảnh lỗi `onerror`): `<img src=x onerror=window.__xss=2>`
- - XSS-03 (giao thức `javascript:`): `javascript:window.__xss=3`
- - XSS-04 (`<svg onload>`): `<svg onload=window.__xss=4>`
- - XSS-05 (`<iframe>`): `<iframe src="javascript:window.__xss=5">`
- - XSS-06 (Markdown kèm HTML thô): `**đậm** [bấm](javascript:window.__xss=6) <b>b</b>`
- - XSS-07 (liên kết `data:`): `<a href="data:,window.__xss=7">tải</a>`
- - XSS-08 (thuộc tính sự kiện chèn qua dấu nháy): `" onmouseover="window.__xss=8" autofocus onfocus="window.__xss=8" x="`
- - XSS-09 (CSS độc): `<div style="position:fixed;inset:0;background:red;z-index:99999">phủ<style>*{display:none}`
- - XSS-10 (Unicode điều khiển): `bao-cao\u202Efdp.exe\u200B\u0007` (chứa U+202E đảo chiều, U+200B rộng bằng không, U+0007 điều khiển BEL)
- Phần chạy được: TÊN TỆP PDF hiển thị ở "Danh sách tài liệu" và hàng đợi tải lên (`DocumentRow` in tên bằng văn bản thuần), cùng URL (`redirect`, `reason`, đường dẫn lạ) và ô đăng nhập. Phần CHƯA có: nội dung PDF, câu hỏi, câu trả lời, `AnswerRenderer`, ngăn nguồn, danh sách nguồn.
- **Cách tạo tệp tên đặc biệt:** Windows không cho đặt tên tệp có `< > " | ? * :` nên tạo tệp TRONG BỘ NHỚ trình duyệt (`new File([...], tên)` + `DataTransfer`) hoặc dùng `setInputFiles({name, mimeType, buffer})` của Playwright. Ghi mười tên vào `data/payload-ten-tep.json`.
- Máy chủ chuẩn hóa tên: NFC, bỏ ký tự điều khiển ISO, lấy phần sau dấu `/` hoặc `\` cuối cùng, tối đa 255 ký tự → payload KHÔNG chứa `/` và `\` (vì thế `<script>` không có thẻ đóng).
- Mỗi tệp tải lên chiếm một chỗ trong 20 tài liệu (chưa có chức năng xóa): chạy trên cơ sở dữ liệu dev còn ≥ 10 chỗ trống.
- Tệp PDF hợp lệ tối thiểu `data/mau.pdf`: nội dung văn bản bắt đầu bằng `%PDF-1.4` (tạo bằng script Node/Playwright ghi chuỗi `%PDF-1.4
1 0 obj
<<>>
endobj
%%EOF` ra tệp — đủ để qua kiểm tra loại tệp của ứng dụng).

## Các bước thực hiện
**Hiện trạng:** tính năng chưa hiện thực → kết luận dự kiến 'Bị chặn'; bước 1–28 vẫn chạy được để chứng minh.

| Bước | Hành động (MỘT hành động mỗi bước: Mở/Nhập/Bấm/Chọn/Chờ/Quan sát/Chạy lệnh) | Kết quả mong đợi tại bước này (quan sát được) | Bằng chứng cần chụp |
|---|---|---|---|
| 1 | Đăng nhập `admin` tại `/login`, mở DevTools → Console, chạy `window.__xss=undefined; window.addEventListener("error",e=>console.log("LOI",e.message)); window.alert=()=>{window.__xss="alert"}` | Thấy "Xin chào, admin"; `window.__xss` là `undefined` | Ảnh `01-chuan-bi.png` |
| 2 | Trong Console tạo mười tệp PDF trong bộ nhớ, tên đúng như bảng payload ở dưới (mỗi tên thêm đuôi `.pdf`), rồi gán vào ô chọn tệp: `const names=[/* 10 tên */]; const dt=new DataTransfer(); names.forEach(n=>dt.items.add(new File(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\n"],n+".pdf",{type:"application/pdf"}))); const i=document.querySelector("[data-testid=file-input]"); i.files=dt.files; i.dispatchEvent(new Event("change",{bubbles:true}))` | Mười hàng xuất hiện trong hàng đợi tải lên (hoặc bị từ chối kèm lý do); KHÔNG có hộp thoại nào bật lên; bộ đếm "Đã dùng n/20 tài liệu" tăng | Ảnh `02-tai-muoi-tep.png` |
| 3 | (XSS-01) Tìm hàng tài liệu có tên chứa payload `<script>window.__xss=1;` (thẻ `<script>`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện nguyên chuỗi dạng văn bản; thẻ không được chèn vào DOM | Ảnh `03-xss-01-hien-thi.png` |
| 4 | (XSS-01) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[0]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `04-xss-01-kiem-dom.png` |
| 5 | (XSS-02) Tìm hàng tài liệu có tên chứa payload `<img src=x onerror=window.__xss=2>` (ảnh lỗi `onerror`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản; không có phần tử `img` trong hàng; `onerror` không chạy | Ảnh `05-xss-02-hien-thi.png` |
| 6 | (XSS-02) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[1]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `06-xss-02-kiem-dom.png` |
| 7 | (XSS-03) Tìm hàng tài liệu có tên chứa payload `javascript:window.__xss=3` (giao thức `javascript:`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản, không là liên kết bấm được | Ảnh `07-xss-03-hien-thi.png` |
| 8 | (XSS-03) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[2]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `08-xss-03-kiem-dom.png` |
| 9 | (XSS-04) Tìm hàng tài liệu có tên chứa payload `<svg onload=window.__xss=4>` (`<svg onload>`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản; không có `svg` do dữ liệu tạo; `onload` không chạy | Ảnh `09-xss-04-hien-thi.png` |
| 10 | (XSS-04) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[3]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `10-xss-04-kiem-dom.png` |
| 11 | (XSS-05) Tìm hàng tài liệu có tên chứa payload `<iframe src="javascript:window.__xss=5">` (`<iframe>`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản; không có `iframe` mới trong trang | Ảnh `11-xss-05-hien-thi.png` |
| 12 | (XSS-05) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[4]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `12-xss-05-kiem-dom.png` |
| 13 | (XSS-06) Tìm hàng tài liệu có tên chứa payload `**đậm** [bấm](javascript:window.__xss=6) <b>b</b>` (Markdown kèm HTML thô) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện nguyên chuỗi (tên tệp là văn bản thuần, không render Markdown); không có thẻ `b`, `a` | Ảnh `13-xss-06-hien-thi.png` |
| 14 | (XSS-06) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[5]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `14-xss-06-kiem-dom.png` |
| 15 | (XSS-07) Tìm hàng tài liệu có tên chứa payload `<a href="data:,window.__xss=7">tải</a>` (liên kết `data:`) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản; không có thẻ `a` do dữ liệu tạo | Ảnh `15-xss-07-hien-thi.png` |
| 16 | (XSS-07) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[6]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `16-xss-07-kiem-dom.png` |
| 17 | (XSS-08) Tìm hàng tài liệu có tên chứa payload `" onmouseover="window.__xss=8" autofocus onfocus="window.__xss=8" x="` (thuộc tính sự kiện chèn qua dấu nháy) trong "Danh sách tài liệu"/hàng đợi tải lên | Hiện dạng văn bản; rê chuột/focus vào hàng không chạy mã | Ảnh `17-xss-08-hien-thi.png` |
| 18 | (XSS-08) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[7]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `18-xss-08-kiem-dom.png` |
| 19 | (XSS-09) Tìm hàng tài liệu có tên chứa payload `<div style="position:fixed;inset:0;background:red;z-index:99999">phủ<style>*{display:none}` (CSS độc) trong "Danh sách tài liệu"/hàng đợi tải lên | Không phủ đỏ toàn màn hình, không ẩn trang; hiện dạng văn bản | Ảnh `19-xss-09-hien-thi.png` |
| 20 | (XSS-09) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[8]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `20-xss-09-kiem-dom.png` |
| 21 | (XSS-10) Tìm hàng tài liệu có tên chứa payload `bao-cao\u202Efdp.exe\u200B\u0007` (chứa U+202E đảo chiều, U+200B rộng bằng không, U+0007 điều khiển BEL) (Unicode điều khiển) trong "Danh sách tài liệu"/hàng đợi tải lên | Bố cục không vỡ; ký tự BEL bị loại khỏi tên; không có mã thực thi | Ảnh `21-xss-10-hien-thi.png` |
| 22 | (XSS-10) Trong Console chạy `const el=document.querySelectorAll("[data-testid=doc-name]")[9]; [el.children.length, el.textContent, window.__xss]` (chỉ số theo thứ tự hàng; chỉnh nếu thứ tự khác) | `children.length` = 0 (chỉ là văn bản); `textContent` khớp tên (đã chuẩn hóa NFC, bỏ ký tự điều khiển); `window.__xss` vẫn `undefined` | Ảnh `22-xss-10-kiem-dom.png` |
| 23 | Nhấn F5, chờ danh sách tải từ máy chủ, lặp kiểm `document.querySelectorAll("[data-testid=doc-name]")` và `window.__xss` | Tên lưu ở máy chủ cũng hiển thị dạng văn bản; không mã nào chạy; trang không bị ẩn/phủ | Ảnh `23-sau-tai-lai.png` |
| 24 | Rê chuột và nhấn Tab qua từng hàng tài liệu | Chỉ có tooltip `title` (văn bản đầy đủ của tên); không sự kiện nào chạy; `window.__xss` vẫn `undefined` | Ảnh `24-hover-focus.png` |
| 25 | Mở `http://localhost:5173/login?redirect=javascript:window.__xss=3` (khi đã đăng xuất) rồi đăng nhập | Sau đăng nhập về `/` (không điều hướng tới `javascript:`); `window.__xss` vẫn `undefined` | Ảnh `25-redirect-javascript.png` |
| 26 | Mở `http://localhost:5173/%3Cscript%3Ewindow.__xss=1%3C%2Fscript%3E` | Hiện "Không tìm thấy trang" kèm "Về trang chính", KHÔNG in lại đường dẫn; `window.__xss` vẫn `undefined` | Ảnh `26-url-doc-hai.png` |
| 27 | Mở `http://localhost:5173/login?reason=%3Cimg%20src=x%20onerror=window.__xss=2%3E` | Trang đăng nhập bình thường, không in lại tham số `reason`; không chạy mã | Ảnh `27-reason-doc-hai.png` |
| 28 | Nhập vào "Tên đăng nhập" `<img src=x onerror=window.__xss=2>` và mật khẩu bất kỳ, bấm "Đăng nhập" | Thông báo lỗi chung "Không đăng nhập được…" (không in lại tên nhập); không chạy mã | Ảnh `28-dang-nhap-xss.png` |
| 29 | (Chờ hỏi đáp và `AnswerRenderer`) Gửi câu hỏi chứa từng payload; cho mô hình giả lập trả lời chứa Markdown + HTML thô, liên kết `javascript:`/`data:`; mở danh sách nguồn, tên tài liệu, ngăn nguồn, thông báo lỗi | Mọi nơi hiển thị văn bản/đã làm sạch; liên kết nguy hiểm bị bỏ/vô hiệu; thẻ HTML thô bị loại; không mã nào chạy | Ảnh `29-cho-ai-renderer.png` |
| 30 | Chạy `[window.__xss, document.querySelectorAll("script:not([src]),iframe,svg[onload],img[onerror],[onmouseover],[onfocus]").length]` | Trả `[undefined, 0]`: không có phần tử/thuộc tính sự kiện do payload tạo ra | Ảnh `30-ket-qua-cuoi.png` |

**Lưu ý:** Biến thể kiểm cắt đường dẫn: tên `<script>alert(1)</script>.pdf` được máy chủ rút thành `script>.pdf`; đây là hành vi mong đợi, không phải lỗi.
**Lưu ý:** XSS-10: U+202E không bị lọc bởi `isISOControl` nên có thể làm tên trông như đảo chiều; nếu gây hiểu nhầm hãy ghi nhận là đề xuất cải tiến (Minor), không phải mã chạy.

## Kết quả mong đợi tổng thể (tiêu chí Đạt)
1. Không mã nào thực thi: `window.__xss` luôn `undefined`, không có hộp thoại alert, không lỗi script mới trong Console, ở hàng đợi tải lên, danh sách sau tải lại, hover/focus, URL, thông báo lỗi.
2. Tên tệp hiển thị dạng văn bản thuần: phần tử tên không có phần tử con (`children.length = 0`); không có `script`/`img`/`svg`/`iframe`/`a`/`style` do payload sinh ra; CSS độc không phủ/ẩn trang.
3. `redirect=javascript:…` chỉ đưa về `/`; trang 404 và trang đăng nhập không in lại đường dẫn/tham số/tên nhập.
4. Khi có hỏi đáp: `AnswerRenderer`, danh sách nguồn, ngăn nguồn, thông báo lỗi hiển thị văn bản/đã làm sạch (ghi bằng chứng).
**Không đạt nếu:** bất kỳ payload nào làm `window.__xss` khác `undefined`, bật hộp thoại, tạo phần tử HTML thật, điều hướng sang `javascript:`/`data:`, hoặc làm hỏng/ẩn/phủ giao diện.

### Kết quả thực tế / trạng thái / lỗi liên quan

Điền khi chạy: xem `./test_reports/TC-SEC-XSS-01..10/report.md`.

## Nhiệm vụ của agent thực thi (BẮT BUỘC)

Agent nhận tệp này phải thực hiện ca kiểm thử trên ứng dụng đang chạy tại **http://localhost:5173/** và tạo bộ bằng chứng sau. Mọi sản phẩm lưu trong **một thư mục riêng mang tên đúng ca kiểm thử**: `./test_reports/TC-SEC-XSS-01..10/` (tính từ thư mục gốc của repo).

| # | Việc phải làm | Sản phẩm |
|---|---|---|
| 1 | Kiểm tra ứng dụng sống (`http://localhost:5173/` mở được, `http://localhost:5173/api/ready` trả 200). Nếu không, dừng và ghi "Không chạy được" kèm lý do | dòng đầu của `report.md` |
| 2 | **Quay video toàn bộ quá trình kiểm thử** (từ lúc mở trình duyệt tới khi xong) | `./test_reports/TC-SEC-XSS-01..10//video/TC-SEC-XSS-01..10.webm` |
| 3 | **Chụp ảnh màn hình** ở mỗi bước và ở kết quả cuối (đặt tên `NN-mô-tả-ngắn.png`, NN là số thứ tự bước); ảnh phải thể hiện được bằng chứng của kết quả mong đợi | `./test_reports/TC-SEC-XSS-01..10//screenshots/` |
| 4 | **Viết báo cáo kiểm thử** theo mẫu bên dưới, nhúng ảnh bằng đường dẫn tương đối | `./test_reports/TC-SEC-XSS-01..10//report.md` |
| 5 | Dữ liệu phát sinh khi chạy (tệp PDF mẫu đã dùng, log mạng/console nếu liên quan) | `./test_reports/TC-SEC-XSS-01..10//data/` |

Cách làm gợi ý: dùng Playwright (trình duyệt Edge: `channel: 'msedge'`) với `recordVideo`, hoặc trợ giúp có sẵn `docs/testing/test_cases/tools/tc-session.cjs` (xem README cùng thư mục) — nó tự tạo thư mục, bật quay video và cung cấp hàm chụp ảnh đánh số.

### Quy tắc kết luận

- **Đạt**: mọi kết quả mong đợi quan sát được và có ảnh chứng minh.
- **Không đạt**: có ít nhất một kết quả mong đợi sai; ghi hiện tượng thực tế, ảnh, và mô tả lỗi (mức độ theo Test Plan mục D.2).
- **Bị chặn**: tính năng chưa được hiện thực hoặc điều kiện tiên quyết/OQ chưa chốt khiến không thể kết luận. Vẫn chụp ảnh và quay video quá trình thử để chứng minh lý do bị chặn. **Không được ghi "Đạt" khi chưa quan sát được kết quả.**
- **Không thể kiểm qua giao diện**: ca thuộc loại không có giao diện (ví dụ tải/ngưỡng hạ tầng). Làm phần có thể qua trình duyệt tại http://localhost:5173/ (ví dụ gọi API cùng origin trong trình duyệt, xem tab mạng), ghi rõ phần chưa kiểm được và công cụ cần dùng.
- Không bịa kết quả, không sửa mã ứng dụng để cho ca "đạt"; không ghi mật khẩu thật hay dữ liệu nhạy cảm vào báo cáo.

### Mẫu `report.md`

```markdown
# Báo cáo kiểm thử — TC-SEC-XSS-01..10
- Kết luận: Đạt | Không đạt | Bị chặn | Không thể kiểm qua giao diện
- Ngày giờ chạy / người hoặc agent chạy / trình duyệt và phiên bản
- URL kiểm thử: http://localhost:5173/   Bản dựng/commit:
- Video: ./video/TC-SEC-XSS-01..10.webm

## Điều kiện tiên quyết đã chuẩn bị
## Bảng thực hiện
| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |
|---|---|---|---|---|---|
| 1 | … | … | … | ✔/✘ | ![](./screenshots/01-….png) |
## Lỗi phát hiện (nếu có)
| Mô tả | Mức độ (Blocker/Critical/Major/Minor) | Ảnh/log |
## Ghi chú, hạn chế, đề xuất
```

