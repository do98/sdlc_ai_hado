# Luồng sự kiện (SSE) — hợp đồng

> Bổ sung cho [openapi.yaml](openapi.yaml) (nguồn sự thật cho REST). **Phiên bản 0.1 — cần BE và FE cùng duyệt**; sau khi duyệt, mọi thay đổi phải sửa tệp này trong cùng PR hiện thực.
> Các hình dạng dữ liệu là **đề xuất** của T05; tên sự kiện và ràng buộc ở §3–§5 của kế hoạch phát triển là cố định.

| Duyệt | Vai trò | Người | Ngày |
|---|---|---|---|
| ☐ | Backend | | |
| ☐ | Frontend | | |

## 1. Quy ước chung

- Phản hồi `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.
- Mỗi sự kiện: `event: <tên>` rồi `data: <JSON một dòng>`, kết thúc bằng một dòng trống. Dòng bắt đầu bằng `:` là chú thích (heartbeat), phải bỏ qua.
- Dữ liệu `data` luôn là JSON hợp lệ trên **một dòng**; ký tự xuống dòng trong văn bản được mã hóa `\n` trong JSON.
- Cần cookie phiên; thiếu/hết hạn → HTTP `401` **trước khi** mở luồng (không phải sự kiện).
- Trình duyệt dùng `fetch` + `ReadableStream` (không dùng `EventSource` vì cần `POST` và không dùng được cho `IF-05`); bộ đọc phải chịu được sự kiện bị cắt ngang giữa các mảnh mạng và ký tự UTF-8 nhiều byte bị cắt.

## IF-06 `GET /api/events`

Luồng cập nhật trạng thái tài liệu cho **cả workspace**; mọi người đang xem nhận cùng sự kiện.

| Thành phần | Quy tắc |
|---|---|
| `id:` | Số nguyên tăng dần (`seq`), có ở mọi sự kiện dữ liệu |
| `event: document.updated` | `data: { "id", "status", "errorCode", "warning", "pageCount" }` — cùng ý nghĩa với `DocumentSummary` trong OpenAPI |
| `event: resync` | `data: {}` — `Last-Event-ID` quá cũ hoặc đã mất lịch sử; FE phải tải lại `GET /api/documents` |
| Heartbeat | dòng chú thích `:ping` mỗi 15 giây `[Đề xuất]` (cấu hình `docchat.events.heartbeat`) |
| Chú thích mở đầu | Ngay khi nối, BE gửi một dòng `:connected` để header 200 xuống máy khách tức thì (không phải đợi nhịp tim). FE bỏ qua mọi dòng bắt đầu bằng `:` |
| `Last-Event-ID` | Khi nối lại, BE phát bù mọi sự kiện có `id` lớn hơn, theo thứ tự. Giá trị không phải số được coi như kết nối mới |
| Kết nối mới (không có `Last-Event-ID`) | Chỉ nhận sự kiện **từ lúc nối trở đi**, không phát lại lịch sử. FE phải tải `GET /api/documents` sau khi nối thành công (hoặc ngay trước) để không lỡ thay đổi xảy ra giữa hai bước |
| `resync` | Gửi khi `Last-Event-ID` lớn hơn sự kiện mới nhất (CSDL đã đổi), nhỏ hơn sự kiện cũ nhất còn lưu (đã dọn sau 24 giờ), hoặc cần phát bù quá 1000 sự kiện (`docchat.events.history-limit`). Không có dòng `id:`; sau đó BE tiếp tục gửi sự kiện mới |
| Hết phiên | Mỗi nhịp tim BE kiểm lại phiên; hết hạn thì **đóng luồng**. FE nối lại sẽ nhận `401` và chuyển về đăng nhập |

```text
id: 41
event: document.updated
data: {"id":"0197…","status":"READY","errorCode":null,"warning":null,"pageCount":12}

: ping

event: resync
data: {}
```

## IF-05 `POST /api/conversations/{id}/messages`

Yêu cầu `{ "text": "…" }` (1–2000 ký tự). Các lỗi kiểm tra đầu vào trả **HTTP thường** (xem OpenAPI) và **không** mở luồng.

| Sự kiện | Dữ liệu | Quy tắc |
|---|---|---|
| `meta` | `{ "messageId", "conversationId" }` | Đầu tiên, đúng một lần |
| `status` | `{ "phase": "retrieving" \| "generating" }` | Có thể nhiều lần, theo thứ tự `retrieving` rồi `generating` |
| `delta` | `{ "text" }` | Nối theo thứ tự thành câu trả lời; có thể không có (khi `not_found` chỉ có một `delta` cố định) |
| `citation` | `{ "index", "documentId", "documentName", "page", "charStart", "charEnd" }` | Trước `done`; `index` là số `[n]` trong văn bản; trang tính từ 1; `charStart`/`charEnd` là offset ký tự trong văn bản của trang |
| `done` | `{ "result": "answered" \| "not_found" \| "partial", "usage": { "promptTokens", "completionTokens" } }` | Cuối cùng khi thành công, đúng một lần |
| `error` | `{ "code", "retryable" }` | Cuối cùng khi lỗi, đúng một lần; **không** có `done` sau `error` |

Thứ tự hợp lệ: `meta → status* → delta* → citation* → done` **hoặc** `meta → … → error`. `error.code` thuộc `ErrorCode` của OpenAPI, thường là `LLM_UNAVAILABLE`, `TIMEOUT` hoặc `INTERNAL`.

```text
event: meta
data: {"messageId":"0197…","conversationId":"0197…"}

event: status
data: {"phase":"retrieving"}

event: delta
data: {"text":"Thời hạn bảo hành là 24 tháng [1]."}

event: citation
data: {"index":1,"documentId":"0197…","documentName":"HopDongA.pdf","page":12,"charStart":340,"charEnd":520}

event: done
data: {"result":"answered","usage":{"promptTokens":1840,"completionTokens":96}}
```

Trường hợp `not_found`: một `delta` với câu cố định, **không** có `citation`, rồi `done{"result":"not_found"}`. FE hiển thị theo `result`, không dựa vào văn bản.

Trường hợp luồng đóng bất ngờ khi chưa có `done`/`error` (mất mạng, máy chủ khởi động lại): FE coi là *gián đoạn*.

## Thay đổi

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 0.1 | 2026-11-02 | Bản đầu theo T05 |
