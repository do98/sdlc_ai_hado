# Danh mục task phát triển (T01–T23)

> Nguồn: [Implement_plan.md](../Implement_plan.md). Mỗi task là một tệp độc lập: mục tiêu, phạm vi, các bước kèm đầu ra kiểm tra được, đặc tả kỹ thuật, tiêu chí hoàn thành, kiểm thử, rủi ro. Chi tiết nào không có trong kế hoạch được gắn `[Đề xuất]`.

Tổng: **23 task**, ≈ 77 ngày công `[Đề xuất]`.

## GĐ 0 — Nền tảng (1 tuần)

| Task | Việc | Vai trò | Ngày công | Phụ thuộc |
|---|---|---|---|---|
| [T01](T01.md) | Khởi tạo repo, lint ranh giới module và CI | TL (BE+FE) | 1,5 | — |
| [T02](T02.md) | Khung frontend: design tokens, shared/ui, shared/api, router và bố cục 3 cột | FE | 2,5 | T01 |
| [T03](T03.md) | Khung backend và lược đồ cơ sở dữ liệu (Flyway) | BE | 1,5 | T01 |
| [T04](T04.md) | Đăng nhập tối thiểu: đăng nhập, đăng xuất, GET /me, phiên 8 giờ, khóa tạm | BE+FE | 3 | T02, T03 |
| [T05](T05.md) | Hợp đồng API (OpenAPI) và API giả (MSW) | BE+FE | 1,5 | T02, T03 |
| [T06](T06.md) | Chốt các quyết định chặn và khảo sát kỹ thuật (spike) | TL+PO | 1 | — |

## GĐ 1 — BB-01 Tải lên PDF (2 tuần)

| Task | Việc | Vai trò | Ngày công | Phụ thuộc |
|---|---|---|---|---|
| [T07](T07.md) | BE — API tải lên PDF (IF-03) với giữ chỗ nguyên tử | BE | 3 | T03, T04, T05 |
| [T08](T08.md) | BE — Pipeline xử lý PDF nền (7 loại lỗi, cảnh báo, cắt đoạn, vector hóa) | BE | 5 | T07 |
| [T09](T09.md) | BE — Danh sách tài liệu (IF-02), kênh sự kiện SSE (IF-06), kiểm toán và analytics | BE | 3 | T07, T08 |
| [T10](T10.md) | FE — Tải lên PDF: vùng kéo-thả, kiểm tra ALG-02 và hàng đợi | FE | 5 | T02, T05 |
| [T11](T11.md) | FE — Danh sách tài liệu (DocumentRow), cập nhật thời gian thực ALG-03, trạng thái trống | FE | 5 | T02, T05, T10 |

## GĐ 2 — BB-02 lõi hỏi đáp (2–3 tuần)

| Task | Việc | Vai trò | Ngày công | Phụ thuộc |
|---|---|---|---|---|
| [T12](T12.md) | BE — Embedding câu hỏi và truy hồi top-k đa tài liệu | BE | 4 | T03, T08 |
| [T13](T13.md) | BE — API hỏi đáp SSE (IF-05): prompt "chỉ dùng nguồn", trích dẫn, phân loại, lưu hội thoại | BE | 6 | T12, T05, T04 |
| [T14](T14.md) | FE — Composer (ô nhập câu hỏi, ST-04) | FE | 2 | T02, T05, T11 |
| [T15](T15.md) | FE — useAnswerStream (ALG-01): đọc SSE, gộp delta theo khung hình, bộ đếm 30 s | FE | 4 | T02, T05 |
| [T16](T16.md) | FE — AnswerRenderer, AnswerCard (ST-02), danh sách nguồn, chip trích dẫn | FE | 4 | T14, T15 |

## GĐ 3 — Kiểm chứng và độ bền (1–1,5 tuần)

| Task | Việc | Vai trò | Ngày công | Phụ thuộc |
|---|---|---|---|---|
| [T17](T17.md) | BE — API xem nguồn (IF-07): PDF theo byte-range và vị trí đoạn trích | BE | 2,5 | T13 |
| [T18](T18.md) | FE — SourceViewerPanel (US-030): xem đoạn gốc bằng pdf.js và làm nổi bật | FE | 4 | T16, T17 |
| [T19](T19.md) | BE+FE — Dừng, Tạo lại (US-026) và các trạng thái gián đoạn / quá hạn / lỗi dịch vụ | BE+FE | 4 | T13, T15, T16 |
| [T20](T20.md) | BE+FE+QA — Trích dẫn tới tài liệu đã xóa và kiểm thử hỏi chéo ngôn ngữ (AC-024.2) | BE+FE+QA | 1,5 | T13, T16, T18 |

## GĐ 4 — Chất lượng và phát hành (1–2 tuần)

| Task | Việc | Vai trò | Ngày công | Phụ thuộc |
|---|---|---|---|---|
| [T21](T21.md) | QA+BE — Đánh giá chất lượng bằng DEP-002 và tinh chỉnh prompt/truy hồi | QA+BE | 4 | T13, T18, T20 |
| [T22](T22.md) | QA — Thử tải, bảo mật (OWASP, XSS, phân quyền) và trợ năng (axe, bàn phím, NVDA) | QA | 5 | T18, T19, T11 |
| [T23](T23.md) | PO+QA+BE — UAT 5 người, giám sát, sao lưu, kế hoạch rollback và hướng dẫn sử dụng | PO+QA+BE | 4 | T21, T22 |

## Đối chiếu ước lượng với thời lượng của kế hoạch

Kế hoạch giả định **1 FE + 1 BE toàn thời gian và 1 QA bán thời gian**. Bảng dưới chia ngày công theo vai trò (task phối hợp chia đều cho các vai trò nêu) để kiểm tra có khớp thời lượng từng giai đoạn không.

| Giai đoạn | FE | BE | QA/khác | Năng lực mỗi người theo kế hoạch (ngày) |
|---|---|---|---|---|
| GĐ 0 | 5,5 | 5 | 0,5 | 5–5 |
| GĐ 1 | 10 | 11 | 0 | 10–10 |
| GĐ 2 | 10 | 10 | 0 | 10–15 |
| GĐ 3 | 6,5 | 5 | 0,5 | 5–7,5 |
| GĐ 4 | 0 | 4 | 9 | 5–10 |

**Nhận xét** (ước lượng thô của người lập task, không phải cam kết):

- **GĐ 0 và GĐ 1 vượt năng lực:** FE GĐ 0 là 5,5 ngày so với 5; BE GĐ 1 là 11 ngày so với 10. Chênh nhỏ nhưng không có đệm; nếu muốn đúng thời lượng của kế hoạch cần giảm phạm vi (ví dụ hoãn EV-012/013 ở T09) hoặc chấp nhận trễ vài ngày.
- **GĐ 4 quá tải QA:** khoảng 9 ngày công QA/PO trong khi QA bán thời gian (≈ 50%) chỉ có khoảng 2,5–5 ngày trong 1–2 tuần. Cần thêm QA, nhờ FE/BE hỗ trợ kiểm thử, hoặc kéo dài giai đoạn — kế hoạch gốc (1–2 tuần) khó đạt với nguồn lực đã nêu.
- **GĐ 4 không tính thời gian sửa lỗi:** FE/BE có thời gian dành cho sửa lỗi phát hiện từ T21–T23 nhưng chưa được gán task; nên dành đệm riêng.
- Các giai đoạn còn lại nằm trong khoảng năng lực của kế hoạch.

## Thứ tự làm đề xuất

1. **GĐ 0:** T01 → (T02, T03 song song) → T04, T05; T06 chạy song song từ ngày đầu (có việc chờ bên ngoài).
2. **GĐ 1:** FE (T10, T11) làm trên MSW trong khi BE làm T07 → T08 → T09.
3. **GĐ 2:** T12 → T13 (BE); T14, T15 → T16 (FE) song song, tích hợp thật khi T13 xong.
4. **GĐ 3:** T17 → T18; T19 sau T13/T15/T16; T20 cuối giai đoạn.
5. **GĐ 4:** T21 và T22 song song; T23 sau cùng.

## Việc nằm ngoài các task này

Theo §9 của kế hoạch: quản trị người dùng đầy đủ (US-002–005), xóa/tóm tắt/trùng tài liệu (US-013–015), hội thoại tiếp nối và lịch sử (US-025, US-040/041), đánh giá 👍/👎 (US-051), báo cáo tuần (US-050), nhật ký kiểm toán đầy đủ (US-061), OCR. Các mục P0 trong danh sách này (US-002/003, US-050, US-061) vẫn bắt buộc trước launch theo PRD và cần kế hoạch bổ sung sau GĐ 4.
