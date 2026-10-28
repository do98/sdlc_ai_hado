# User Stories & Acceptance Criteria — Công cụ "Chat với tài liệu" (MVP)

> **Mã tài liệu:** US-DOCCHAT-001 · **Phiên bản:** 0.1 · **Trạng thái:** `Draft` · **Ngày:** 2026-10-26
> **Đầu vào:** [PRD.md](PRD.md) §3 · [BRD.md](BRD.md) §7 · **Định dạng story:** *As a [role], I want [capability], so that [benefit]*
> **Ưu tiên:** **P0** bắt buộc để phát hành · **P1** nên có · **P2** mong muốn
> **Quy ước:** `[TBD: OQ-xxx]` = chờ câu hỏi mở trong BRD §12 · `[Unverified]` = chưa có bằng chứng.

---

## 1. Quy ước

### 1.1 Mã định danh

| Mã | Ý nghĩa | Ví dụ |
|---|---|---|
| `FR-xxx` | Yêu cầu chức năng cấp sản phẩm, suy ra từ `BR-xxx` của BRD | FR-002 |
| `US-xxx` | User story (giữ nguyên mã như PRD §3) | US-002 |
| `US-xxx-ACn` | Tiêu chí chấp nhận của story (Given-When-Then) | US-002-AC1 |
| `AC-xxx` | Tiêu chí chấp nhận cấp BRD mà story phải thỏa | AC-001 |

Mã đã cấp là cố định; story bị bỏ được đánh dấu `Withdrawn`, không đánh số lại.

### 1.2 Danh mục vai trò (Role)

| Role | Mô tả | Persona PRD |
|---|---|---|
| Nhân viên KD | Thành viên đội phát triển kinh doanh, người dùng chính | "Minh" |
| Product Owner | Theo dõi hiệu quả MVP, quyết định đầu tư tiếp | "Lan" |
| Quản trị viên | Cấp quyền truy cập, quản lý người dùng (đề xuất, chờ `OQ-007`, `OQ-016`) | "Hùng" |

### 1.3 Danh mục yêu cầu chức năng (FR)

| FR-ID | Yêu cầu chức năng | BR (BRD) | Story |
|---|---|---|---|
| FR-001 | Chỉ người dùng đã xác thực và được cấp quyền mới truy cập công cụ | BR-020 | US-001 |
| FR-002 | Tải một tệp PDF lên kho tài liệu | BR-001 | US-002 |
| FR-003 | Từ chối tệp sai định dạng hoặc vượt giới hạn, nêu lý do | BR-002, BRU-001, BRU-003 | US-003 |
| FR-004 | Tài liệu sẵn sàng truy vấn trong thời hạn quy định và hiển thị trạng thái | BR-004 | US-004 |
| FR-005 | Báo tệp PDF không trích xuất được nội dung | BR-005 | US-005 |
| FR-006 | Tải nhiều tệp PDF trong một thao tác | BR-003 | US-006 |
| FR-007 | Đặt câu hỏi bằng ngôn ngữ tự nhiên | BR-006 | US-007 |
| FR-008 | Câu trả lời chỉ dựa trên tài liệu người dùng được phép truy cập | BR-007, BRU-002 | US-008 |
| FR-009 | Tổng hợp thông tin từ nhiều tài liệu vào một câu trả lời | BR-008 | US-009 |
| FR-010 | Thông báo khi tài liệu không chứa thông tin | BR-009 | US-010 |
| FR-011 | Trả lời bằng tiếng Việt khi hỏi bằng tiếng Việt | BR-010 | US-011 |
| FR-012 | Phản hồi trong thời gian quy định | BR-011 | US-012 |
| FR-013 | Hỏi nối tiếp trong cùng phiên | BR-012 | US-013 |
| FR-014 | Giới hạn câu hỏi vào các tài liệu được chọn | BR-013 | US-014 |
| FR-015 | Trích dẫn tên tài liệu và số trang trong câu trả lời | BR-014 | US-015 |
| FR-016 | Xem đoạn nội dung gốc của trích dẫn | BR-015 | US-016 |
| FR-017 | Xem danh sách tài liệu được phép truy cập | BR-016 | US-017 |
| FR-018 | Xóa tài liệu do mình tải lên | BR-017 | US-018 |
| FR-019 | Tài liệu đã xóa không được dùng cho câu trả lời mới | BR-018, BRU-004 | US-019 |
| FR-020 | Xem lại lịch sử hội thoại của chính mình | BR-019 | US-020 |
| FR-021 | Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ | BR-021 | US-021 |
| FR-022 | Đánh giá câu trả lời hữu ích / không hữu ích | BR-022 | US-022 |
| FR-023 | Báo cáo sử dụng hằng tuần cho Product Owner | BR-023 | US-023 |

---

## 2. User Stories theo Epic

### E1 — Truy cập & xác thực

#### US-001 · FR-001 · P0
**As a** nhân viên KD, **I want** đăng nhập bằng tài khoản được cấp quyền, **so that** chỉ người có quyền mới xem và dùng được tài liệu kinh doanh.
*Trace:* BR-020 · SN-007 · BO-002 · AC-020 · cơ chế xác thực chờ `OQ-016`

| AC | Given | When | Then |
|---|---|---|---|
| US-001-AC1 | Tôi chưa đăng nhập | Tôi truy cập bất kỳ trang nào của công cụ | Tôi được chuyển tới màn hình đăng nhập và không thấy dữ liệu nào |
| US-001-AC2 | Tôi có tài khoản hợp lệ và nằm trong danh sách được cấp quyền | Tôi đăng nhập | Tôi vào màn hình chính |
| US-001-AC3 | Tôi dùng tài khoản không nằm trong danh sách được cấp quyền | Tôi gửi thông tin đăng nhập | Hệ thống từ chối truy cập và không tiết lộ lý do chi tiết |
| US-001-AC4 | Phiên đăng nhập của tôi đã hết hạn | Tôi thực hiện thao tác bất kỳ | Tôi được chuyển về màn hình đăng nhập |

---

### E2 — Đưa tài liệu vào kho

#### US-002 · FR-002 · P0
**As a** nhân viên KD, **I want** tải tệp PDF lên kho tài liệu, **so that** có tài liệu để truy vấn thay vì mở từng tệp thủ công.
*Trace:* BR-001 · SN-002 · BO-001 · AC-001

| AC | Given | When | Then |
|---|---|---|---|
| US-002-AC1 | Tôi đã đăng nhập và có một PDF hợp lệ trong giới hạn `[TBD: OQ-004]` | Tôi chọn tệp và tải lên | Tệp xuất hiện trong danh sách tài liệu của tôi với trạng thái "Đang xử lý" |
| US-002-AC2 | Mạng bị đứt giữa chừng khi đang tải | Quá trình tải bị gián đoạn | Tôi thấy thông báo lỗi và nút "Thử lại"; không có tài liệu nửa vời trong danh sách |
| US-002-AC3 | Tôi tải lại đúng tệp đã tải trước đó | Tôi tải lên | Hệ thống xử lý theo quy tắc trùng tệp `[TBD: OQ-020 — đề xuất bổ sung vào BRD]` |

#### US-003 · FR-003 · P0
**As a** nhân viên KD, **I want** được báo rõ khi tệp tải lên không hợp lệ, **so that** tôi sửa ngay và không tưởng tệp đã vào kho.
*Trace:* BR-002 · BRU-001 · BRU-003 · SN-002 · BO-002 · AC-002

| AC | Given | When | Then |
|---|---|---|---|
| US-003-AC1 | Tôi chọn tệp .docx, .xlsx hoặc .jpg | Tôi tải lên | Tệp bị từ chối; thông báo tiếng Việt nêu lý do "sai định dạng" và định dạng được hỗ trợ (PDF) |
| US-003-AC2 | Tôi chọn tệp đổi đuôi thành .pdf nhưng nội dung không phải PDF | Tôi tải lên | Tệp bị từ chối với cùng thông báo "sai định dạng" |
| US-003-AC3 | Tệp PDF vượt giới hạn dung lượng hoặc số trang `[TBD: OQ-004]` | Tôi tải lên | Tệp bị từ chối; thông báo nêu giới hạn cho phép |
| US-003-AC4 | Một tệp bị từ chối | Tôi xem danh sách tài liệu | Tệp bị từ chối không xuất hiện trong danh sách |

#### US-004 · FR-004 · P0
**As a** nhân viên KD, **I want** tài liệu sẵn sàng truy vấn trong thời gian ngắn và thấy rõ trạng thái xử lý, **so that** tôi dùng được ngay trong ngày làm việc.
*Trace:* BR-004 · SN-002 · BO-001 · AC-004 · ngưỡng chờ `OQ-005`

| AC | Given | When | Then |
|---|---|---|---|
| US-004-AC1 | Tôi vừa tải lên PDF hợp lệ | Việc tải lên hoàn tất | Trong vòng `[TBD: OQ-005]` phút, trạng thái chuyển thành "Sẵn sàng" |
| US-004-AC2 | Tài liệu đang xử lý | Tôi xem danh sách | Tôi thấy trạng thái "Đang xử lý"; tài liệu chưa được dùng để trả lời |
| US-004-AC3 | Bộ 10 PDF mẫu trong giới hạn (DEP-003) | Tôi hỏi 1 câu về nội dung từng tệp sau khi "Sẵn sàng" | 10/10 tệp trả lời được trong thời hạn của AC1 |

#### US-005 · FR-005 · P0
**As a** nhân viên KD, **I want** biết khi PDF không đọc được nội dung, **so that** tôi không tưởng tệp đã được dùng để trả lời.
*Trace:* BR-005 · SN-004 · BO-002 · AC-005 · RSK-003

| AC | Given | When | Then |
|---|---|---|---|
| US-005-AC1 | Tôi tải lên PDF chỉ chứa ảnh scan (không có lớp văn bản) | Hệ thống không trích xuất được văn bản | Tệp có trạng thái "Không truy vấn được" kèm lý do |
| US-005-AC2 | Tệp ở trạng thái "Không truy vấn được" | Tôi đặt câu hỏi | Nội dung tệp không được dùng và không xuất hiện trong trích dẫn |
| US-005-AC3 | PDF bị hỏng hoặc có mật khẩu | Tôi tải lên | Tệp được báo "Không truy vấn được" kèm lý do tương ứng |

#### US-006 · FR-006 · P1
**As a** nhân viên KD, **I want** chọn nhiều PDF và tải lên trong một thao tác, **so that** nạp cả tập tài liệu dự án nhanh hơn.
*Trace:* BR-003 · SN-002 · BO-001 · AC-003 · giới hạn `OQ-004`

| AC | Given | When | Then |
|---|---|---|---|
| US-006-AC1 | Tôi chọn đồng thời `[TBD: OQ-004]` PDF hợp lệ | Tôi tải lên | 100% tệp xuất hiện trong danh sách |
| US-006-AC2 | Trong nhóm tệp chọn có 1 tệp không hợp lệ | Tôi tải lên | Các tệp hợp lệ vẫn được nhận; tệp lỗi được báo riêng theo US-003 |
| US-006-AC3 | Tôi chọn nhiều tệp hơn số tối đa `[TBD: OQ-004]` | Tôi tải lên | Hệ thống báo giới hạn và không nhận nhóm vượt mức |

---

### E3 — Hỏi đáp trên tài liệu

#### US-007 · FR-007 · P0
**As a** nhân viên KD, **I want** đặt câu hỏi bằng ngôn ngữ thông thường, **so that** không phải học cú pháp tìm kiếm.
*Trace:* BR-006 · SN-003 · BO-001 · AC-006

| AC | Given | When | Then |
|---|---|---|---|
| US-007-AC1 | Có ít nhất 1 tài liệu "Sẵn sàng" | Tôi nhập một câu hỏi hoàn chỉnh và gửi | Tôi nhận được câu trả lời trong khung hội thoại |
| US-007-AC2 | 5 câu hỏi dạng câu thông thường, không dùng cú pháp đặc biệt | Tôi gửi lần lượt | Cả 5 câu đều nhận được câu trả lời |
| US-007-AC3 | Kho chưa có tài liệu "Sẵn sàng" | Tôi cố gửi câu hỏi | Hệ thống hướng dẫn tải tài liệu lên trước; không gọi dịch vụ AI |
| US-007-AC4 | Ô nhập câu hỏi đang trống | Tôi xem nút gửi | Nút gửi bị vô hiệu hóa |
| US-007-AC5 | Dịch vụ AI không khả dụng | Tôi gửi câu hỏi | Tôi thấy thông báo tạm thời không trả lời được và nút thử lại; không có câu trả lời giả |

#### US-008 · FR-008 · P0
**As a** nhân viên KD, **I want** câu trả lời chỉ dựa trên nội dung tài liệu của tôi, **so that** tôi tin được rằng mọi thông tin đều có căn cứ.
*Trace:* BR-007 · BRU-002 · SN-003 · BO-002 · AC-007 · RSK-001

| AC | Given | When | Then |
|---|---|---|---|
| US-008-AC1 | 10 câu hỏi kiến thức phổ thông không có trong tài liệu | Tôi gửi từng câu | 10/10 câu trả lời không chứa nội dung ngoài tài liệu và theo US-010 |
| US-008-AC2 | Tôi chỉ được phép truy cập tài liệu A | Tôi hỏi về nội dung có trong tài liệu B (tôi không có quyền) | Câu trả lời không chứa nội dung từ B |
| US-008-AC3 | Câu hỏi có một phần đáp án trong tài liệu, phần còn lại không có | Tôi gửi câu hỏi | Câu trả lời chỉ nêu phần có trong tài liệu (kèm trích dẫn) và nói rõ phần còn lại không tìm thấy |

#### US-009 · FR-009 · P0
**As a** nhân viên KD, **I want** thông tin nằm ở nhiều tài liệu được tổng hợp vào một câu trả lời, **so that** tôi không phải ghép tay từ nhiều tệp.
*Trace:* BR-008 · SN-001 · BO-001 · AC-008

| AC | Given | When | Then |
|---|---|---|---|
| US-009-AC1 | Đáp án nằm rải ở ít nhất 2 tài liệu "Sẵn sàng" | Tôi đặt câu hỏi | Câu trả lời chứa thông tin từ tất cả tài liệu liên quan và trích dẫn đủ các nguồn |
| US-009-AC2 | Bộ 10 câu hỏi nhiều nguồn do đội KD cung cấp (DEP-003) | Chuyên gia nghiệp vụ chấm | Đạt ≥ `[TBD: OQ-003]`/10 câu có đủ thông tin từ mọi tài liệu liên quan |
| US-009-AC3 | Hai tài liệu có thông tin mâu thuẫn nhau | Tôi đặt câu hỏi | Câu trả lời nêu rõ cả hai và trích dẫn từng nguồn; không tự chọn một bên `[Unverified]` |

#### US-010 · FR-010 · P0
**As a** nhân viên KD, **I want** được báo rõ khi tài liệu không có thông tin cần tìm, **so that** tôi không bị đánh lừa bởi câu trả lời bịa.
*Trace:* BR-009 · SN-004 · BO-002 · AC-009 · RSK-001

| AC | Given | When | Then |
|---|---|---|---|
| US-010-AC1 | Các tài liệu không chứa thông tin cho câu hỏi | Tôi gửi câu hỏi | Hệ thống trả lời rõ "Không tìm thấy thông tin trong tài liệu" |
| US-010-AC2 | Câu trả lời thuộc loại không tìm thấy | Tôi xem câu trả lời | Không có trích dẫn nào kèm theo |
| US-010-AC3 | 10 câu hỏi không có đáp án trong tài liệu | Tôi gửi từng câu | Đạt ≥ `[TBD: OQ-003]`/10 câu trả lời là thông báo không tìm thấy |

#### US-011 · FR-011 · P0
**As a** nhân viên KD, **I want** hỏi và nhận câu trả lời bằng tiếng Việt, **so that** làm việc tự nhiên bằng ngôn ngữ của mình.
*Trace:* BR-010 · SN-003 · BO-001 · AC-010 · phạm vi ngôn ngữ `OQ-009`

| AC | Given | When | Then |
|---|---|---|---|
| US-011-AC1 | Tôi hỏi bằng tiếng Việt | Hệ thống trả lời | Câu trả lời viết bằng tiếng Việt |
| US-011-AC2 | 10 câu hỏi tiếng Việt | Tôi gửi từng câu | 10/10 câu trả lời bằng tiếng Việt |
| US-011-AC3 | Tài liệu nguồn viết bằng tiếng Anh `[TBD: OQ-009]` | Tôi hỏi bằng tiếng Việt | Câu trả lời bằng tiếng Việt, trích dẫn giữ nguyên tên tài liệu và số trang |

#### US-012 · FR-012 · P0
**As a** nhân viên KD, **I want** nhận câu trả lời trong thời gian ngắn, **so that** công cụ thực sự nhanh hơn tra cứu thủ công.
*Trace:* BR-011 · SN-001 · BO-001 · AC-011 · ngưỡng `OQ-006`

| AC | Given | When | Then |
|---|---|---|---|
| US-012-AC1 | Hệ thống hoạt động bình thường, ≥ 100 câu hỏi kiểm thử chấp nhận | Tôi đo thời gian từ lúc gửi đến lúc hiển thị | ≥ `[TBD: OQ-006]`% câu hỏi có câu trả lời trong `[TBD: OQ-006]` giây |
| US-012-AC2 | Tôi đang chờ câu trả lời | Thời gian chờ kéo dài | Tôi thấy chỉ báo tiến trình |
| US-012-AC3 | Thời gian chờ vượt ngưỡng `[TBD: OQ-006]` | Tôi vẫn chưa nhận được câu trả lời | Tôi có thể hủy hoặc thử lại, nội dung câu hỏi được giữ nguyên |
| US-012-AC4 | Mất kết nối mạng khi đang hỏi | Câu hỏi không gửi được | Tôi thấy thông báo lỗi, câu hỏi vẫn còn trong ô nhập để gửi lại |

#### US-013 · FR-013 · P1
**As a** nhân viên KD, **I want** hỏi tiếp dựa trên câu hỏi và trả lời trước, **so that** tôi làm rõ thông tin dần mà không phải nhắc lại bối cảnh.
*Trace:* BR-012 · SN-009 · BO-001 · AC-012

| AC | Given | When | Then |
|---|---|---|---|
| US-013-AC1 | Tôi vừa nhận một câu trả lời về điều khoản X | Tôi hỏi "Còn thời hạn của **nó** thì sao?" | Câu trả lời hiểu "nó" là điều khoản X |
| US-013-AC2 | 5 cặp câu hỏi nối tiếp dùng đại từ thay thế | Chuyên gia chấm | ≥ 4/5 câu trả lời thứ hai đúng ngữ cảnh |
| US-013-AC3 | Tôi bắt đầu phiên hội thoại mới | Tôi hỏi câu có đại từ tham chiếu câu cũ | Hệ thống không dùng ngữ cảnh của phiên trước |

#### US-014 · FR-014 · P2
**As a** nhân viên KD, **I want** giới hạn câu hỏi vào một hoặc vài tài liệu tôi chọn, **so that** câu trả lời chính xác hơn khi kho có nhiều tài liệu không liên quan.
*Trace:* BR-013 · SN-001 · BO-002 · AC-013

| AC | Given | When | Then |
|---|---|---|---|
| US-014-AC1 | Tôi chọn chỉ tài liệu A làm phạm vi | Tôi hỏi về nội dung chỉ có trong tài liệu B | Câu trả lời không chứa trích dẫn từ B |
| US-014-AC2 | Tôi bỏ chọn toàn bộ tài liệu | Tôi gửi câu hỏi | Hệ thống yêu cầu chọn ít nhất 1 tài liệu hoặc dùng toàn bộ kho `[Unverified]` |
| US-014-AC3 | Tôi chọn phạm vi trong phiên | Tôi hỏi các câu nối tiếp | Phạm vi được giữ cho đến khi tôi đổi |

---

### E4 — Kiểm chứng câu trả lời

#### US-015 · FR-015 · P0
**As a** nhân viên KD, **I want** mỗi câu trả lời kèm tên tài liệu và số trang nguồn, **so that** tôi kiểm chứng trước khi dùng thông tin.
*Trace:* BR-014 · SN-004 · BO-002 · AC-014 · chờ sponsor xác nhận `OQ-013`

| AC | Given | When | Then |
|---|---|---|---|
| US-015-AC1 | Câu trả lời có nội dung lấy từ tài liệu | Câu trả lời hiển thị | Mỗi nguồn được dùng có trích dẫn gồm tên tài liệu và số trang |
| US-015-AC2 | Câu trả lời tổng hợp từ nhiều tài liệu | Câu trả lời hiển thị | Mỗi tài liệu liên quan có trích dẫn riêng |
| US-015-AC3 | Bộ câu hỏi kiểm thử MET-002 | Chuyên gia đối chiếu | 100% câu trả lời có nội dung từ tài liệu đều có trích dẫn; ≥ `[TBD: OQ-003]`% trích dẫn trỏ đúng tài liệu và trang |
| US-015-AC4 | Tài liệu nguồn đã bị xóa sau khi câu trả lời được tạo | Tôi xem lại câu trả lời cũ | Trích dẫn hiển thị tên tài liệu kèm nhãn "đã xóa" `[Unverified]` |

#### US-016 · FR-016 · P1
**As a** nhân viên KD, **I want** xem đoạn nội dung gốc ứng với mỗi trích dẫn, **so that** tôi kiểm chứng ngay mà không phải mở cả tệp PDF.
*Trace:* BR-015 · SN-004 · BO-002 · AC-015

| AC | Given | When | Then |
|---|---|---|---|
| US-016-AC1 | Câu trả lời có trích dẫn | Tôi nhấp vào một trích dẫn | Tôi thấy đoạn nội dung gốc cùng tên tài liệu và số trang |
| US-016-AC2 | 5 trích dẫn bất kỳ | Tôi mở từng trích dẫn | Mở được đoạn gốc của cả 5 |
| US-016-AC3 | Tôi không còn quyền truy cập tài liệu nguồn | Tôi nhấp vào trích dẫn | Hệ thống từ chối hiển thị đoạn gốc |

---

### E5 — Quản lý tài liệu

#### US-017 · FR-017 · P0
**As a** nhân viên KD, **I want** xem danh sách tài liệu tôi được phép truy cập, **so that** tôi biết câu trả lời đang dựa trên tập tài liệu nào.
*Trace:* BR-016 · SN-008 · BO-002 · AC-016

| AC | Given | When | Then |
|---|---|---|---|
| US-017-AC1 | Tôi được phép truy cập đúng 3 tài liệu | Tôi mở danh sách | Tôi thấy đúng 3 tài liệu với tên tệp và trạng thái |
| US-017-AC2 | Tôi chưa có tài liệu nào | Tôi mở danh sách | Tôi thấy trạng thái trống kèm nút "Tải PDF lên" |
| US-017-AC3 | Có tài liệu của người khác ngoài phạm vi chia sẻ của tôi | Tôi mở danh sách | Tôi không thấy tài liệu đó |

#### US-018 · FR-018 · P1
**As a** nhân viên KD, **I want** xóa tài liệu do mình tải lên, **so that** loại bỏ tài liệu lỗi thời hoặc tải nhầm.
*Trace:* BR-017 · SN-008 · BO-002 · AC-017

| AC | Given | When | Then |
|---|---|---|---|
| US-018-AC1 | Tôi là người tải lên tài liệu X | Tôi chọn xóa X và xác nhận | X không còn xuất hiện trong danh sách |
| US-018-AC2 | Tôi chọn xóa X | Hộp thoại xác nhận hiện ra | Tôi có thể hủy; X vẫn còn nếu tôi hủy |
| US-018-AC3 | Tài liệu X do người khác tải lên | Tôi xem tùy chọn xóa | Tôi không có quyền xóa X `[TBD: OQ-007]` |

#### US-019 · FR-019 · P0
**As a** nhân viên KD, **I want** tài liệu đã xóa không còn được dùng trong câu trả lời mới, **so that** tôi không nhận thông tin từ nội dung đã hết hiệu lực.
*Trace:* BR-018 · BRU-004 · SN-007 · BO-002 · AC-018

| AC | Given | When | Then |
|---|---|---|---|
| US-019-AC1 | Tôi đã xóa tài liệu X | Tôi hỏi 5 câu chỉ có đáp án trong X | 5/5 câu trả lời không chứa nội dung hay trích dẫn từ X |
| US-019-AC2 | Tôi xóa X trong lúc một câu hỏi đang được xử lý | Câu trả lời được tạo ra sau thời điểm xóa | Câu trả lời không dùng X |
| US-019-AC3 | Tôi đã xóa X | Tôi hỏi câu có đáp án trong X | Hệ thống trả lời theo US-010 (không tìm thấy thông tin) |

---

### E6 — Lịch sử hội thoại

#### US-020 · FR-020 · P2
**As a** nhân viên KD, **I want** xem lại các phiên hội thoại trước của mình, **so that** tôi không phải hỏi lại thông tin đã tra cứu.
*Trace:* BR-019 · SN-009 · BO-001 · AC-019 · chờ `OQ-013`, `OQ-015`

| AC | Given | When | Then |
|---|---|---|---|
| US-020-AC1 | Tôi đã đăng xuất và đăng nhập lại | Tôi mở danh sách phiên cũ | Tôi thấy và mở được phiên hội thoại trước đó của mình |
| US-020-AC2 | Có phiên hội thoại của người dùng khác | Tôi xem danh sách phiên | Tôi không thấy phiên của người khác |
| US-020-AC3 | Thời hạn lưu giữ `[TBD: OQ-015]` đã hết | Tôi mở danh sách phiên | Phiên quá hạn không còn hiển thị |

---

### E7 — Phân quyền tài liệu

#### US-021 · FR-021 · P0
**As a** quản trị viên, **I want** tài liệu chỉ hiển thị với người trong phạm vi chia sẻ, **so that** dữ liệu kinh doanh mật không bị lộ cho người không có quyền.
*Trace:* BR-021 · SN-007 · BO-002 · AC-021 · phạm vi chia sẻ chờ `OQ-007`

| AC | Given | When | Then |
|---|---|---|---|
| US-021-AC1 | Tài liệu Y không được chia sẻ cho tôi | Tôi mở danh sách tài liệu | Tôi không thấy Y |
| US-021-AC2 | Y không được chia sẻ cho tôi | Tôi hỏi 5 câu về nội dung riêng của Y | 5/5 câu trả lời không chứa nội dung hay trích dẫn từ Y |
| US-021-AC3 | Quyền truy cập của tôi vào Y bị thu hồi | Tôi hỏi câu có đáp án trong Y | Câu trả lời không dùng Y kể từ thời điểm thu hồi |
| US-021-AC4 | Tôi thử truy cập trực tiếp bằng đường dẫn hoặc mã định danh của Y | Tôi gửi yêu cầu | Hệ thống từ chối và không tiết lộ Y có tồn tại hay không |

---

### E8 — Đo lường MVP

#### US-022 · FR-022 · P1
**As a** nhân viên KD, **I want** đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích", **so that** đội sản phẩm biết chất lượng thực tế và cải thiện công cụ.
*Trace:* BR-022 · SN-006 · BO-003 · AC-022 · MET-004

| AC | Given | When | Then |
|---|---|---|---|
| US-022-AC1 | Tôi vừa nhận một câu trả lời | Tôi chọn "Hữu ích" hoặc "Không hữu ích" | Đánh giá được ghi nhận và hiển thị đã chọn |
| US-022-AC2 | Tôi đã đánh giá một câu trả lời | Tôi đổi lựa chọn | Hệ thống chỉ giữ đánh giá mới nhất cho câu trả lời đó |
| US-022-AC3 | Tôi gửi đánh giá cho 1 câu trả lời | Đến hết tuần | Đánh giá được tính vào MET-004 của tuần đó |

#### US-023 · FR-023 · P0
**As a** Product Owner, **I want** nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi, **so that** tôi có số liệu quyết định có đầu tư tiếp sau MVP hay không.
*Trace:* BR-023 · SN-005, SN-006 · BO-003 · AC-023 · MET-003

| AC | Given | When | Then |
|---|---|---|---|
| US-023-AC1 | Pilot đang chạy | Kết thúc mỗi tuần | Tôi nhận báo cáo gồm số người dùng hoạt động và số câu hỏi trong tuần |
| US-023-AC2 | Hai tuần pilot liên tiếp | Tôi đối chiếu báo cáo với mẫu kiểm tra | Mỗi tuần có báo cáo; số câu hỏi lệch ≤ 5% so với số đếm mẫu |
| US-023-AC3 | Trong tuần không có người dùng nào hoạt động | Báo cáo được tạo | Báo cáo hiển thị giá trị 0, không bị bỏ qua |
| US-023-AC4 | Người dùng không phải Product Owner | Truy cập báo cáo | Hệ thống từ chối truy cập |

---

## 3. Tổng hợp

### 3.1 Theo ưu tiên

| Ưu tiên | Số story | Stories | Tổng AC |
|---|---|---|---|
| P0 | 16 | US-001..005, 007..012, 015, 017, 019, 021, 023 | 56 |
| P1 | 5 | US-006, 013, 016, 018, 022 | 15 |
| P2 | 2 | US-014, 020 | 6 |
| **Tổng** | **23** | | **77** |

### 3.2 Ma trận truy vết

| Epic | FR | Story | BR | Mục tiêu | AC cấp BRD |
|---|---|---|---|---|---|
| E1 | FR-001 | US-001 | BR-020 | BO-002 | AC-020 |
| E2 | FR-002..006 | US-002..006 | BR-001..005 | BO-001, BO-002 | AC-001..005 |
| E3 | FR-007..014 | US-007..014 | BR-006..013 | BO-001, BO-002 | AC-006..013 |
| E4 | FR-015, 016 | US-015, 016 | BR-014, 015 | BO-002 | AC-014, 015 |
| E5 | FR-017..019 | US-017..019 | BR-016..018 | BO-002 | AC-016..018 |
| E6 | FR-020 | US-020 | BR-019 | BO-001 | AC-019 |
| E7 | FR-021 | US-021 | BR-021 | BO-002 | AC-021 |
| E8 | FR-022, 023 | US-022, 023 | BR-022, 023 | BO-003 | AC-022, 023 |

Độ phủ: mỗi BR (BR-001..BR-023) có đúng một FR và một story; mỗi story có ≥ 3 AC. Story P0 bắt buộc có AC dạng Given-When-Then.

### 3.3 Kiểm tra chất lượng story (INVEST)

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| Independent | Đạt một phần | US-004 phụ thuộc US-002; US-007..016 phụ thuộc US-004; US-015 phụ thuộc US-007 — xem thứ tự phát triển 3.4 |
| Negotiable | Đạt | Không mô tả thiết kế giao diện/kỹ thuật cụ thể |
| Valuable | Đạt | Mỗi story có "so that" nêu lợi ích |
| Estimable | **Chưa đạt** | Story có `[TBD]` (US-003, 004, 006, 012, 021) chưa ước lượng chính xác được |
| Small | Đạt một phần | US-007, US-021 có thể tách khi lập kế hoạch sprint |
| Testable | Đạt | Mỗi AC quyết định được Pass/Fail; AC có số ngưỡng chờ OQ |

### 3.4 Thứ tự phát triển đề xuất

1. **Nền tảng:** US-001 → US-021 (xác thực và phân quyền).
2. **Đưa tài liệu vào:** US-002, 003, 004, 005 → US-017, 019.
3. **Hỏi đáp lõi:** US-007, 008, 010, 011, 009, 015, 012.
4. **Đo lường:** US-023.
5. **P1:** US-006, 013, 016, 018, 022.
6. **P2:** US-014, 020.

---

## 4. Điều kiện hoàn thành (Definition of Done) cho mỗi story

- Tất cả AC của story được chạy và đạt; kết quả được ghi lại.
- Không còn lỗi Blocker/Critical liên quan đến story *(đề xuất — chờ xác nhận ở PRD §5.1)*.
- Các giá trị `[TBD]` trong AC của story đã được thay bằng giá trị thật từ câu hỏi mở tương ứng.
- Story P0 có kiểm thử hồi quy cho phân quyền (US-001, 019, 021).
- Sự kiện đo lường liên quan (PRD §5.2) được ghi nhận đúng.
- Product Owner xác nhận story đáp ứng nhu cầu ghi trong "so that".

## 5. Câu hỏi mở bổ sung

Giữ nguyên `OQ-001..019` từ BRD/PRD. Thêm một câu hỏi mới:

| ID | Câu hỏi | Chặn | Chủ sở hữu | Cần trước |
|---|---|---|---|---|
| OQ-020 | Quy tắc khi người dùng tải lên tệp trùng (cùng nội dung hoặc cùng tên): ghi đè, giữ cả hai hay từ chối? | US-002-AC3 | Product Owner | 2026-11-04 |

Hạn "Cần trước" là đề xuất của BA, cần sponsor xác nhận.
