# Danh mục ca kiểm thử (mỗi tệp một ca)

Tách từ [Test_Plan.md](../Test_Plan.md). **210 ca**. Mỗi ca là một tệp `<ID>.md` trong thư mục này; agent thực thi ca phải làm đúng mục "Nhiệm vụ của agent thực thi" trong tệp.

## Quy ước chung cho mọi ca

- **Ứng dụng kiểm thử:** http://localhost:5173/
- **Bằng chứng của ca `<ID>`** nằm trong thư mục riêng `./test_reports/<ID>/` (tính từ gốc repo):
  - `report.md` — báo cáo kiểm thử (kết luận, bảng bước, lỗi) nhúng ảnh chụp màn hình;
  - `screenshots/` — ảnh chụp màn hình từng bước và kết quả (`NN-mô-tả.png`);
  - `video/<ID>.webm` — video toàn bộ quá trình kiểm thử;
  - `data/` — dữ liệu dùng/phát sinh khi chạy.
- Kết luận chỉ gồm: Đạt · Không đạt · Bị chặn · Không thể kiểm qua giao diện. Không ghi "Đạt" khi chưa quan sát được kết quả.
- Trợ giúp ghi video/ảnh: `tools/tc-session.cjs`.

## E2E — hành trình người dùng (11)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [E2E-001](E2E-001.md) | Đăng nhập → vào màn hình chính |  | `test_reports/E2E-001/` |
| [E2E-002](E2E-002.md) | Lần đầu: tải PDF → chờ sẵn sàng → hỏi → xem nguồn (UXS-01) |  | `test_reports/E2E-002/` |
| [E2E-003](E2E-003.md) | Tải lỗi và phục hồi |  | `test_reports/E2E-003/` |
| [E2E-004](E2E-004.md) | PDF scan/hỏng/mật khẩu |  | `test_reports/E2E-004/` |
| [E2E-005](E2E-005.md) | Hỏi khi chưa có tài liệu |  | `test_reports/E2E-005/` |
| [E2E-006](E2E-006.md) | Không tìm thấy |  | `test_reports/E2E-006/` |
| [E2E-007](E2E-007.md) | Lỗi AI/quá hạn/mất mạng |  | `test_reports/E2E-007/` |
| [E2E-008](E2E-008.md) | Dừng và Tạo lại |  | `test_reports/E2E-008/` |
| [E2E-009](E2E-009.md) | Xóa tài liệu rồi hỏi (Pha 2) |  | `test_reports/E2E-009/` |
| [E2E-010](E2E-010.md) | Phân quyền hai người dùng (Pha 2, chờ OQ-007) |  | `test_reports/E2E-010/` |
| [E2E-011](E2E-011.md) | Phản hồi và báo cáo tuần (Pha 2) |  | `test_reports/E2E-011/` |

## PERF — hiệu năng (9)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [PERF-001](PERF-001.md) | Tải |  | `test_reports/PERF-001/` |
| [PERF-002](PERF-002.md) | Tải |  | `test_reports/PERF-002/` |
| [PERF-003](PERF-003.md) | Xử lý tài liệu |  | `test_reports/PERF-003/` |
| [PERF-004](PERF-004.md) | Tải lên song song |  | `test_reports/PERF-004/` |
| [PERF-005](PERF-005.md) | Bền |  | `test_reports/PERF-005/` |
| [PERF-006](PERF-006.md) | Đột biến |  | `test_reports/PERF-006/` |
| [PERF-007](PERF-007.md) | Giao diện |  | `test_reports/PERF-007/` |
| [PERF-008](PERF-008.md) | Truy hồi |  | `test_reports/PERF-008/` |
| [PERF-009](PERF-009.md) | SSE |  | `test_reports/PERF-009/` |

## A. Tiêu chí chấp nhận (user story) (77)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-US001-AC1](TC-US001-AC1.md) | US-001 — Đăng nhập bằng tài khoản được cấp quyền — tiêu chí AC1 | Cao | `test_reports/TC-US001-AC1/` |
| [TC-US001-AC2](TC-US001-AC2.md) | US-001 — Đăng nhập bằng tài khoản được cấp quyền — tiêu chí AC2 | Cao | `test_reports/TC-US001-AC2/` |
| [TC-US001-AC3](TC-US001-AC3.md) | US-001 — Đăng nhập bằng tài khoản được cấp quyền — tiêu chí AC3 | Cao | `test_reports/TC-US001-AC3/` |
| [TC-US001-AC4](TC-US001-AC4.md) | US-001 — Đăng nhập bằng tài khoản được cấp quyền — tiêu chí AC4 | Cao | `test_reports/TC-US001-AC4/` |
| [TC-US002-AC1](TC-US002-AC1.md) | US-002 — Tải tệp PDF lên kho tài liệu — tiêu chí AC1 | Cao | `test_reports/TC-US002-AC1/` |
| [TC-US002-AC2](TC-US002-AC2.md) | US-002 — Tải tệp PDF lên kho tài liệu — tiêu chí AC2 | Cao | `test_reports/TC-US002-AC2/` |
| [TC-US002-AC3](TC-US002-AC3.md) | US-002 — Tải tệp PDF lên kho tài liệu — tiêu chí AC3 | Cao | `test_reports/TC-US002-AC3/` |
| [TC-US003-AC1](TC-US003-AC1.md) | US-003 — Được báo rõ khi tệp tải lên không hợp lệ — tiêu chí AC1 | Cao | `test_reports/TC-US003-AC1/` |
| [TC-US003-AC2](TC-US003-AC2.md) | US-003 — Được báo rõ khi tệp tải lên không hợp lệ — tiêu chí AC2 | Cao | `test_reports/TC-US003-AC2/` |
| [TC-US003-AC3](TC-US003-AC3.md) | US-003 — Được báo rõ khi tệp tải lên không hợp lệ — tiêu chí AC3 | Cao | `test_reports/TC-US003-AC3/` |
| [TC-US003-AC4](TC-US003-AC4.md) | US-003 — Được báo rõ khi tệp tải lên không hợp lệ — tiêu chí AC4 | Cao | `test_reports/TC-US003-AC4/` |
| [TC-US004-AC1](TC-US004-AC1.md) | US-004 — Tài liệu sẵn sàng truy vấn trong thời gian ngắn và thấy rõ trạng thái xử lý — tiêu chí AC1 | Cao | `test_reports/TC-US004-AC1/` |
| [TC-US004-AC2](TC-US004-AC2.md) | US-004 — Tài liệu sẵn sàng truy vấn trong thời gian ngắn và thấy rõ trạng thái xử lý — tiêu chí AC2 | Cao | `test_reports/TC-US004-AC2/` |
| [TC-US004-AC3](TC-US004-AC3.md) | US-004 — Tài liệu sẵn sàng truy vấn trong thời gian ngắn và thấy rõ trạng thái xử lý — tiêu chí AC3 | Cao | `test_reports/TC-US004-AC3/` |
| [TC-US005-AC1](TC-US005-AC1.md) | US-005 — Biết khi PDF không đọc được nội dung — tiêu chí AC1 | Cao | `test_reports/TC-US005-AC1/` |
| [TC-US005-AC2](TC-US005-AC2.md) | US-005 — Biết khi PDF không đọc được nội dung — tiêu chí AC2 | Cao | `test_reports/TC-US005-AC2/` |
| [TC-US005-AC3](TC-US005-AC3.md) | US-005 — Biết khi PDF không đọc được nội dung — tiêu chí AC3 | Cao | `test_reports/TC-US005-AC3/` |
| [TC-US006-AC1](TC-US006-AC1.md) | US-006 — Chọn nhiều PDF và tải lên trong một thao tác — tiêu chí AC1 | Trung bình | `test_reports/TC-US006-AC1/` |
| [TC-US006-AC2](TC-US006-AC2.md) | US-006 — Chọn nhiều PDF và tải lên trong một thao tác — tiêu chí AC2 | Trung bình | `test_reports/TC-US006-AC2/` |
| [TC-US006-AC3](TC-US006-AC3.md) | US-006 — Chọn nhiều PDF và tải lên trong một thao tác — tiêu chí AC3 | Trung bình | `test_reports/TC-US006-AC3/` |
| [TC-US007-AC1](TC-US007-AC1.md) | US-007 — Đặt câu hỏi bằng ngôn ngữ thông thường — tiêu chí AC1 | Cao | `test_reports/TC-US007-AC1/` |
| [TC-US007-AC2](TC-US007-AC2.md) | US-007 — Đặt câu hỏi bằng ngôn ngữ thông thường — tiêu chí AC2 | Cao | `test_reports/TC-US007-AC2/` |
| [TC-US007-AC3](TC-US007-AC3.md) | US-007 — Đặt câu hỏi bằng ngôn ngữ thông thường — tiêu chí AC3 | Cao | `test_reports/TC-US007-AC3/` |
| [TC-US007-AC4](TC-US007-AC4.md) | US-007 — Đặt câu hỏi bằng ngôn ngữ thông thường — tiêu chí AC4 | Cao | `test_reports/TC-US007-AC4/` |
| [TC-US007-AC5](TC-US007-AC5.md) | US-007 — Đặt câu hỏi bằng ngôn ngữ thông thường — tiêu chí AC5 | Cao | `test_reports/TC-US007-AC5/` |
| [TC-US008-AC1](TC-US008-AC1.md) | US-008 — Câu trả lời chỉ dựa trên nội dung tài liệu của tôi — tiêu chí AC1 | Cao | `test_reports/TC-US008-AC1/` |
| [TC-US008-AC2](TC-US008-AC2.md) | US-008 — Câu trả lời chỉ dựa trên nội dung tài liệu của tôi — tiêu chí AC2 | Cao | `test_reports/TC-US008-AC2/` |
| [TC-US008-AC3](TC-US008-AC3.md) | US-008 — Câu trả lời chỉ dựa trên nội dung tài liệu của tôi — tiêu chí AC3 | Cao | `test_reports/TC-US008-AC3/` |
| [TC-US009-AC1](TC-US009-AC1.md) | US-009 — Thông tin nằm ở nhiều tài liệu được tổng hợp vào một câu trả lời — tiêu chí AC1 | Cao | `test_reports/TC-US009-AC1/` |
| [TC-US009-AC2](TC-US009-AC2.md) | US-009 — Thông tin nằm ở nhiều tài liệu được tổng hợp vào một câu trả lời — tiêu chí AC2 | Cao | `test_reports/TC-US009-AC2/` |
| [TC-US009-AC3](TC-US009-AC3.md) | US-009 — Thông tin nằm ở nhiều tài liệu được tổng hợp vào một câu trả lời — tiêu chí AC3 | Cao | `test_reports/TC-US009-AC3/` |
| [TC-US010-AC1](TC-US010-AC1.md) | US-010 — Được báo rõ khi tài liệu không có thông tin cần tìm — tiêu chí AC1 | Cao | `test_reports/TC-US010-AC1/` |
| [TC-US010-AC2](TC-US010-AC2.md) | US-010 — Được báo rõ khi tài liệu không có thông tin cần tìm — tiêu chí AC2 | Cao | `test_reports/TC-US010-AC2/` |
| [TC-US010-AC3](TC-US010-AC3.md) | US-010 — Được báo rõ khi tài liệu không có thông tin cần tìm — tiêu chí AC3 | Cao | `test_reports/TC-US010-AC3/` |
| [TC-US011-AC1](TC-US011-AC1.md) | US-011 — Hỏi và nhận câu trả lời bằng tiếng Việt — tiêu chí AC1 | Cao | `test_reports/TC-US011-AC1/` |
| [TC-US011-AC2](TC-US011-AC2.md) | US-011 — Hỏi và nhận câu trả lời bằng tiếng Việt — tiêu chí AC2 | Cao | `test_reports/TC-US011-AC2/` |
| [TC-US011-AC3](TC-US011-AC3.md) | US-011 — Hỏi và nhận câu trả lời bằng tiếng Việt — tiêu chí AC3 | Cao | `test_reports/TC-US011-AC3/` |
| [TC-US012-AC1](TC-US012-AC1.md) | US-012 — Nhận câu trả lời trong thời gian ngắn — tiêu chí AC1 | Cao | `test_reports/TC-US012-AC1/` |
| [TC-US012-AC2](TC-US012-AC2.md) | US-012 — Nhận câu trả lời trong thời gian ngắn — tiêu chí AC2 | Cao | `test_reports/TC-US012-AC2/` |
| [TC-US012-AC3](TC-US012-AC3.md) | US-012 — Nhận câu trả lời trong thời gian ngắn — tiêu chí AC3 | Cao | `test_reports/TC-US012-AC3/` |
| [TC-US012-AC4](TC-US012-AC4.md) | US-012 — Nhận câu trả lời trong thời gian ngắn — tiêu chí AC4 | Cao | `test_reports/TC-US012-AC4/` |
| [TC-US013-AC1](TC-US013-AC1.md) | US-013 — Hỏi tiếp dựa trên câu hỏi và trả lời trước — tiêu chí AC1 | Trung bình | `test_reports/TC-US013-AC1/` |
| [TC-US013-AC2](TC-US013-AC2.md) | US-013 — Hỏi tiếp dựa trên câu hỏi và trả lời trước — tiêu chí AC2 | Trung bình | `test_reports/TC-US013-AC2/` |
| [TC-US013-AC3](TC-US013-AC3.md) | US-013 — Hỏi tiếp dựa trên câu hỏi và trả lời trước — tiêu chí AC3 | Trung bình | `test_reports/TC-US013-AC3/` |
| [TC-US014-AC1](TC-US014-AC1.md) | US-014 — Giới hạn câu hỏi vào một hoặc vài tài liệu tôi chọn — tiêu chí AC1 | Thấp | `test_reports/TC-US014-AC1/` |
| [TC-US014-AC2](TC-US014-AC2.md) | US-014 — Giới hạn câu hỏi vào một hoặc vài tài liệu tôi chọn — tiêu chí AC2 | Thấp | `test_reports/TC-US014-AC2/` |
| [TC-US014-AC3](TC-US014-AC3.md) | US-014 — Giới hạn câu hỏi vào một hoặc vài tài liệu tôi chọn — tiêu chí AC3 | Thấp | `test_reports/TC-US014-AC3/` |
| [TC-US015-AC1](TC-US015-AC1.md) | US-015 — Mỗi câu trả lời kèm tên tài liệu và số trang nguồn — tiêu chí AC1 | Cao | `test_reports/TC-US015-AC1/` |
| [TC-US015-AC2](TC-US015-AC2.md) | US-015 — Mỗi câu trả lời kèm tên tài liệu và số trang nguồn — tiêu chí AC2 | Cao | `test_reports/TC-US015-AC2/` |
| [TC-US015-AC3](TC-US015-AC3.md) | US-015 — Mỗi câu trả lời kèm tên tài liệu và số trang nguồn — tiêu chí AC3 | Cao | `test_reports/TC-US015-AC3/` |
| [TC-US015-AC4](TC-US015-AC4.md) | US-015 — Mỗi câu trả lời kèm tên tài liệu và số trang nguồn — tiêu chí AC4 | Cao | `test_reports/TC-US015-AC4/` |
| [TC-US016-AC1](TC-US016-AC1.md) | US-016 — Xem đoạn nội dung gốc ứng với mỗi trích dẫn — tiêu chí AC1 | Trung bình | `test_reports/TC-US016-AC1/` |
| [TC-US016-AC2](TC-US016-AC2.md) | US-016 — Xem đoạn nội dung gốc ứng với mỗi trích dẫn — tiêu chí AC2 | Trung bình | `test_reports/TC-US016-AC2/` |
| [TC-US016-AC3](TC-US016-AC3.md) | US-016 — Xem đoạn nội dung gốc ứng với mỗi trích dẫn — tiêu chí AC3 | Trung bình | `test_reports/TC-US016-AC3/` |
| [TC-US017-AC1](TC-US017-AC1.md) | US-017 — Xem danh sách tài liệu tôi được phép truy cập — tiêu chí AC1 | Cao | `test_reports/TC-US017-AC1/` |
| [TC-US017-AC2](TC-US017-AC2.md) | US-017 — Xem danh sách tài liệu tôi được phép truy cập — tiêu chí AC2 | Cao | `test_reports/TC-US017-AC2/` |
| [TC-US017-AC3](TC-US017-AC3.md) | US-017 — Xem danh sách tài liệu tôi được phép truy cập — tiêu chí AC3 | Cao | `test_reports/TC-US017-AC3/` |
| [TC-US018-AC1](TC-US018-AC1.md) | US-018 — Xóa tài liệu do mình tải lên — tiêu chí AC1 | Trung bình | `test_reports/TC-US018-AC1/` |
| [TC-US018-AC2](TC-US018-AC2.md) | US-018 — Xóa tài liệu do mình tải lên — tiêu chí AC2 | Trung bình | `test_reports/TC-US018-AC2/` |
| [TC-US018-AC3](TC-US018-AC3.md) | US-018 — Xóa tài liệu do mình tải lên — tiêu chí AC3 | Trung bình | `test_reports/TC-US018-AC3/` |
| [TC-US019-AC1](TC-US019-AC1.md) | US-019 — Tài liệu đã xóa không còn được dùng trong câu trả lời mới — tiêu chí AC1 | Cao | `test_reports/TC-US019-AC1/` |
| [TC-US019-AC2](TC-US019-AC2.md) | US-019 — Tài liệu đã xóa không còn được dùng trong câu trả lời mới — tiêu chí AC2 | Cao | `test_reports/TC-US019-AC2/` |
| [TC-US019-AC3](TC-US019-AC3.md) | US-019 — Tài liệu đã xóa không còn được dùng trong câu trả lời mới — tiêu chí AC3 | Cao | `test_reports/TC-US019-AC3/` |
| [TC-US020-AC1](TC-US020-AC1.md) | US-020 — Xem lại các phiên hội thoại trước của mình — tiêu chí AC1 | Thấp | `test_reports/TC-US020-AC1/` |
| [TC-US020-AC2](TC-US020-AC2.md) | US-020 — Xem lại các phiên hội thoại trước của mình — tiêu chí AC2 | Thấp | `test_reports/TC-US020-AC2/` |
| [TC-US020-AC3](TC-US020-AC3.md) | US-020 — Xem lại các phiên hội thoại trước của mình — tiêu chí AC3 | Thấp | `test_reports/TC-US020-AC3/` |
| [TC-US021-AC1](TC-US021-AC1.md) | US-021 — Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ — tiêu chí AC1 | Cao | `test_reports/TC-US021-AC1/` |
| [TC-US021-AC2](TC-US021-AC2.md) | US-021 — Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ — tiêu chí AC2 | Cao | `test_reports/TC-US021-AC2/` |
| [TC-US021-AC3](TC-US021-AC3.md) | US-021 — Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ — tiêu chí AC3 | Cao | `test_reports/TC-US021-AC3/` |
| [TC-US021-AC4](TC-US021-AC4.md) | US-021 — Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ — tiêu chí AC4 | Cao | `test_reports/TC-US021-AC4/` |
| [TC-US022-AC1](TC-US022-AC1.md) | US-022 — Đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích" — tiêu chí AC1 | Trung bình | `test_reports/TC-US022-AC1/` |
| [TC-US022-AC2](TC-US022-AC2.md) | US-022 — Đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích" — tiêu chí AC2 | Trung bình | `test_reports/TC-US022-AC2/` |
| [TC-US022-AC3](TC-US022-AC3.md) | US-022 — Đánh giá mỗi câu trả lời là "hữu ích" hoặc "không hữu ích" — tiêu chí AC3 | Trung bình | `test_reports/TC-US022-AC3/` |
| [TC-US023-AC1](TC-US023-AC1.md) | US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi — tiêu chí AC1 | Cao | `test_reports/TC-US023-AC1/` |
| [TC-US023-AC2](TC-US023-AC2.md) | US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi — tiêu chí AC2 | Cao | `test_reports/TC-US023-AC2/` |
| [TC-US023-AC3](TC-US023-AC3.md) | US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi — tiêu chí AC3 | Cao | `test_reports/TC-US023-AC3/` |
| [TC-US023-AC4](TC-US023-AC4.md) | US-023 — Nhận báo cáo hằng tuần về số người dùng hoạt động và số câu hỏi — tiêu chí AC4 | Cao | `test_reports/TC-US023-AC4/` |

## B.1 API và SSE (33)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [INT-API-001](INT-API-001.md) | `POST /api/auth/login` — Thông tin đúng | C | `test_reports/INT-API-001/` |
| [INT-API-002](INT-API-002.md) | `POST /api/auth/login` — Sai mật khẩu; tên không tồn tại | C | `test_reports/INT-API-002/` |
| [INT-API-003](INT-API-003.md) | `POST /api/auth/login` — Sai 5 lần liên tiếp | C | `test_reports/INT-API-003/` |
| [INT-API-004](INT-API-004.md) | Mọi route (trừ đăng nhập, health) — Không có cookie | C | `test_reports/INT-API-004/` |
| [INT-API-005](INT-API-005.md) | `GET /api/me` — Sau đăng nhập / sau đăng xuất | C | `test_reports/INT-API-005/` |
| [INT-API-006](INT-API-006.md) | `GET /api/documents` — Kho trống; có tài liệu | C | `test_reports/INT-API-006/` |
| [INT-API-007](INT-API-007.md) | `POST /api/documents` — PDF hợp lệ ≤ giới hạn | C | `test_reports/INT-API-007/` |
| [INT-API-008](INT-API-008.md) | `POST /api/documents` — `.docx`, `.jpg`, tệp `.pdf` giả, tệp 0 byte | C | `test_reports/INT-API-008/` |
| [INT-API-009](INT-API-009.md) | `POST /api/documents` — Đúng giới hạn dung lượng; giới hạn + 1 byte | C | `test_reports/INT-API-009/` |
| [INT-API-010](INT-API-010.md) | `POST /api/documents` — PDF vượt giới hạn số trang | C | `test_reports/INT-API-010/` |
| [INT-API-011](INT-API-011.md) | `POST /api/documents` — Khi đã có đủ số tài liệu tối đa | C | `test_reports/INT-API-011/` |
| [INT-API-012](INT-API-012.md) | `POST /api/documents` — Ngắt kết nối giữa luồng | C | `test_reports/INT-API-012/` |
| [INT-API-013](INT-API-013.md) | `POST /api/documents` — Tên tệp `../x.pdf`, ký tự Unicode, > 255 ký tự | T | `test_reports/INT-API-013/` |
| [INT-API-014](INT-API-014.md) | `GET /api/events` — Mở kết nối; một tài liệu đổi trạng thái | C | `test_reports/INT-API-014/` |
| [INT-API-015](INT-API-015.md) | `GET /api/events` — Ngắt, tạo 3 thay đổi, nối lại với `Last-Event-ID` | C | `test_reports/INT-API-015/` |
| [INT-API-016](INT-API-016.md) | `GET /api/events` — `Last-Event-ID` quá cũ | T | `test_reports/INT-API-016/` |
| [INT-API-017](INT-API-017.md) | `POST /api/conversations/{id}/messages` — Câu hỏi hợp lệ | C | `test_reports/INT-API-017/` |
| [INT-API-018](INT-API-018.md) | như trên — Câu hỏi rỗng / chỉ khoảng trắng / > 2000 ký tự | C | `test_reports/INT-API-018/` |
| [INT-API-019](INT-API-019.md) | như trên — Không có tài liệu `READY` | C | `test_reports/INT-API-019/` |
| [INT-API-020](INT-API-020.md) | như trên — Hội thoại không thuộc người dùng | C | `test_reports/INT-API-020/` |
| [INT-API-021](INT-API-021.md) | như trên — Dịch vụ AI lỗi 5xx/429 trước khi có token | C | `test_reports/INT-API-021/` |
| [INT-API-022](INT-API-022.md) | như trên — Nội dung không có căn cứ | C | `test_reports/INT-API-022/` |
| [INT-API-023](INT-API-023.md) | như trên — Mô hình trả số nguồn ngoài khoảng/trùng/tên bịa | C | `test_reports/INT-API-023/` |
| [INT-API-024](INT-API-024.md) | như trên — Vượt hạn mức 20 câu/phút; hơn 3 luồng đồng thời | T | `test_reports/INT-API-024/` |
| [INT-API-025](INT-API-025.md) | như trên — Client ngắt giữa luồng | C | `test_reports/INT-API-025/` |
| [INT-API-026](INT-API-026.md) | `GET /api/documents/{id}/file` — Không `Range`; `Range` đầu/giữa/cuối | T | `test_reports/INT-API-026/` |
| [INT-API-027](INT-API-027.md) | `GET /api/documents/{id}/file` — `Range` sai/vượt; tài liệu không tồn tại/đã xóa | C | `test_reports/INT-API-027/` |
| [INT-API-028](INT-API-028.md) | Mọi API — Lỗi bất kỳ | C | `test_reports/INT-API-028/` |
| [INT-API-029](INT-API-029.md) | API chờ hợp đồng (SAD §2.4) — Xóa tài liệu; phiên/lịch sử; phản hồi; báo cáo tuần; quản trị | T | `test_reports/INT-API-029/` |
| [INT-API-030](INT-API-030.md) | Mọi API — Đối chiếu OpenAPI | C | `test_reports/INT-API-030/` |
| [TC-SSE-01](TC-SSE-01.md) | Luồng hỏi và luồng `/api/events` qua proxy staging | C | `test_reports/TC-SSE-01/` |
| [TC-SSE-02](TC-SSE-02.md) | Trình đọc SSE: luồng bị cắt ở mọi vị trí byte (kể cả giữa ký tự UTF-8 nhiều byte) | C | `test_reports/TC-SSE-02/` |
| [TC-SSE-03](TC-SSE-03.md) | 500 `delta` trong 100 ms | T | `test_reports/TC-SSE-03/` |

## B.2 Telemetry, nhật ký, quan sát (6)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-TEL-01](TC-TEL-01.md) | Mỗi sự kiện PRD §5.2 (`login_success/denied`, `doc_upload_started/rejected`, `doc_ready`, `doc_unreadable`, `d | C | `test_reports/TC-TEL-01/` |
| [TC-TEL-02](TC-TEL-02.md) | Quét mọi sự kiện/log/số đo/`audit_log` bằng chuỗi "canary" có trong câu hỏi, câu trả lời, nội dung và tên tệp | C | `test_reports/TC-TEL-02/` |
| [TC-TEL-03](TC-TEL-03.md) | Danh sách khóa `attributes` được phép | T | `test_reports/TC-TEL-03/` |
| [TC-TEL-AUDIT](TC-TEL-AUDIT.md) | Hành động tải lên, xóa, truy vấn, đăng nhập/từ chối | C | `test_reports/TC-TEL-AUDIT/` |
| [TC-OBS-LOG](TC-OBS-LOG.md) | Chạy luồng E2E đầy đủ rồi quét log | C | `test_reports/TC-OBS-LOG/` |
| [TC-OBS-COST](TC-OBS-COST.md) | Mỗi câu trả lời | T | `test_reports/TC-OBS-COST/` |

## B.3 Chức năng bổ sung (5)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-EXT-01](TC-EXT-01.md) | Bấm Dừng giữa luồng | C | `test_reports/TC-EXT-01/` |
| [TC-EXT-02](TC-EXT-02.md) | Bấm Tạo lại sau Dừng/Gián đoạn/Quá hạn/Lỗi | C | `test_reports/TC-EXT-02/` |
| [TC-EXT-03](TC-EXT-03.md) | Luồng đóng bất ngờ (ngắt mạng/khởi động lại máy chủ) | C | `test_reports/TC-EXT-03/` |
| [TC-EXT-04](TC-EXT-04.md) | `error{TIMEOUT}` | C | `test_reports/TC-EXT-04/` |
| [TC-EXT-05](TC-EXT-05.md) | Bấm "Tạo lại" hai lần liên tiếp / gửi khi đang có luồng | T | `test_reports/TC-EXT-05/` |

## B.7 Độ bền và phục hồi (12)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-INT-UP-CONC](TC-INT-UP-CONC.md) | Hai yêu cầu tải đồng thời khi còn 1 chỗ (lặp ≥ 100 lần) | C | `test_reports/TC-INT-UP-CONC/` |
| [TC-INT-WORKER](TC-INT-WORKER.md) | 4 worker, 200 job; giết worker giữa job | C | `test_reports/TC-INT-WORKER/` |
| [TC-INT-IDEMP](TC-INT-IDEMP.md) | Chạy xử lý tài liệu hai lần | C | `test_reports/TC-INT-IDEMP/` |
| [TC-INT-CHUNK](TC-INT-CHUNK.md) | Cắt đoạn: mỗi đoạn đúng trang; `token ≤ tối đa`; offset khớp nội dung; ghép lại tái tạo trang; xác định | C | `test_reports/TC-INT-CHUNK/` |
| [TC-RES-01](TC-RES-01.md) | Dịch vụ AI timeout / 5xx / 429 / ngắt giữa luồng | C | `test_reports/TC-RES-01/` |
| [TC-RES-02](TC-RES-02.md) | Circuit breaker: 5 lỗi trong 30 s | C | `test_reports/TC-RES-02/` |
| [TC-RES-03](TC-RES-03.md) | Giết worker giữa xử lý tài liệu | C | `test_reports/TC-RES-03/` |
| [TC-RES-04](TC-RES-04.md) | Khởi động lại API trong lúc có luồng SSE | C | `test_reports/TC-RES-04/` |
| [TC-RES-05](TC-RES-05.md) | Object storage/CSDL lỗi khi tải lên | C | `test_reports/TC-RES-05/` |
| [TC-RES-06](TC-RES-06.md) | Mất mạng trình duyệt khi hỏi / khi tải lên | C | `test_reports/TC-RES-06/` |
| [TC-RES-07](TC-RES-07.md) | Phiên hết hạn khi đang nhập/gửi | T | `test_reports/TC-RES-07/` |
| [TC-RES-08](TC-RES-08.md) | Tải lặp 50 lần Dừng/gián đoạn | T | `test_reports/TC-RES-08/` |

## B.4 Bảo mật (16)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-SEC-01](TC-SEC-01.md) | Cookie phiên | C | `test_reports/TC-SEC-01/` |
| [TC-SEC-02](TC-SEC-02.md) | Kiểm tra bộ nhớ trình duyệt sau đăng nhập | C | `test_reports/TC-SEC-02/` |
| [TC-SEC-03](TC-SEC-03.md) | CSRF: POST từ origin lạ | C | `test_reports/TC-SEC-03/` |
| [TC-SEC-04](TC-SEC-04.md) | IDOR: truy cập tài liệu/phiên/trích dẫn/tệp bằng id của người khác (mọi route có `{id}`) | C | `test_reports/TC-SEC-04/` |
| [TC-SEC-05](TC-SEC-05.md) | Cô lập dữ liệu ở tầng truy vấn: người dùng A không nhận đoạn của B kể cả khi chỉ định phạm vi | C | `test_reports/TC-SEC-05/` |
| [TC-SEC-06](TC-SEC-06.md) | Cô lập ở tầng CSDL (nếu dùng RLS): truy vấn thẳng bằng vai trò ứng dụng; thiếu ngữ cảnh người dùng | C | `test_reports/TC-SEC-06/` |
| [TC-SEC-07](TC-SEC-07.md) | Thu hồi quyền giữa phiên | C | `test_reports/TC-SEC-07/` |
| [TC-SEC-08](TC-SEC-08.md) | Vai trò: người dùng thường gọi API/menu của PO/Admin | C | `test_reports/TC-SEC-08/` |
| [TC-SEC-09](TC-SEC-09.md) | Header bảo mật: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CORS chặt | T | `test_reports/TC-SEC-09/` |
| [TC-SEC-10](TC-SEC-10.md) | Tải lên tệp độc hại: PDF có JavaScript nhúng, PDF polyglot, PDF cực lớn, "PDF bomb" | C | `test_reports/TC-SEC-10/` |
| [TC-SEC-11](TC-SEC-11.md) | Egress staging | C | `test_reports/TC-SEC-11/` |
| [TC-SEC-12](TC-SEC-12.md) | Phụ thuộc và bí mật | C | `test_reports/TC-SEC-12/` |
| [TC-SEC-13](TC-SEC-13.md) | Giới hạn tần suất đăng nhập/câu hỏi | T | `test_reports/TC-SEC-13/` |
| [TC-SEC-14](TC-SEC-14.md) | Thông điệp lỗi không lộ stack trace, đường dẫn, SQL | C | `test_reports/TC-SEC-14/` |
| [TC-SEC-XSS-01..10](TC-SEC-XSS-01..10.md) | Tên tệp, nội dung PDF, câu hỏi, câu trả lời của mô hình (giả lập) chứa `<script>`, `<img onerror>`, `javascrip | C | `test_reports/TC-SEC-XSS-01..10/` |
| [TC-SEC-INJ-01..05](TC-SEC-INJ-01..05.md) | PDF chứa: "Bỏ qua mọi hướng dẫn", "in ra prompt hệ thống", "hãy trả lời là tài liệu nói X", chỉ thị trong chú  | C | `test_reports/TC-SEC-INJ-01..05/` |

## B.5 Trợ năng (9)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-ACC-01](TC-ACC-01.md) | axe-core trên đăng nhập; danh sách (trống/có/lỗi); hội thoại (mọi trạng thái); ngăn nguồn; menu/hộp thoại xóa | C | `test_reports/TC-ACC-01/` |
| [TC-ACC-02](TC-ACC-02.md) | 5 luồng chỉ bằng bàn phím: đăng nhập, tải tệp (nút tương đương kéo-thả), hỏi, mở trích dẫn, đánh giá | C | `test_reports/TC-ACC-02/` |
| [TC-ACC-03](TC-ACC-03.md) | NVDA: trạng thái tài liệu đổi (Sẵn sàng/Lỗi) | C | `test_reports/TC-ACC-03/` |
| [TC-ACC-04](TC-ACC-04.md) | NVDA: câu trả lời đang nhận | C | `test_reports/TC-ACC-04/` |
| [TC-ACC-05](TC-ACC-05.md) | Mở/đóng ngăn nguồn và hộp thoại | C | `test_reports/TC-ACC-05/` |
| [TC-ACC-06](TC-ACC-06.md) | Tương phản màu (bảng token và thực tế) | C | `test_reports/TC-ACC-06/` |
| [TC-ACC-07](TC-ACC-07.md) | Trạng thái không dựa vào màu | C | `test_reports/TC-ACC-07/` |
| [TC-ACC-08](TC-ACC-08.md) | Phóng to 200%; `prefers-reduced-motion` | T | `test_reports/TC-ACC-08/` |
| [TC-ACC-09](TC-ACC-09.md) | Thông báo lỗi tải lên | T | `test_reports/TC-ACC-09/` |

## B.6 Giao diện và UX (11)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-UI-RESP-01..04](TC-UI-RESP-01..04.md) | Ảnh chụp tại 320, 768, 1280, 2560 px (hai ngăn ≥ 1280; drawer 768–1279; một cột < 768) | C | `test_reports/TC-UI-RESP-01..04/` |
| [TC-UI-STATE](TC-UI-STATE.md) | Mỗi thành phần: mặc định, hover, focus, active, disabled, loading, lỗi, trống | C | `test_reports/TC-UI-STATE/` |
| [TC-UI-MSG-01..xx](TC-UI-MSG-01..xx.md) | Từng thông điệp ở Blueprint §3.5.5 (sai định dạng, quá lớn, hết chỗ, không truy vấn được + lý do, lỗi AI, quá  | C | `test_reports/TC-UI-MSG-01..xx/` |
| [TC-UI-DISCLAIMER](TC-UI-DISCLAIMER.md) | Dòng "câu trả lời mang tính tham khảo, cần kiểm chứng" dưới hội thoại | T | `test_reports/TC-UI-DISCLAIMER/` |
| [TC-UI-FEEDBACK](TC-UI-FEEDBACK.md) | Mọi thao tác bất đồng bộ với trễ giả 300 ms và 3 s | C | `test_reports/TC-UI-FEEDBACK/` |
| [TC-UI-TOKEN](TC-UI-TOKEN.md) | Lint cấm màu/cỡ chữ/khoảng cách cứng; ≥ 95% thành phần từ thư viện chung | T | `test_reports/TC-UI-TOKEN/` |
| [TC-UI-IA](TC-UI-IA.md) | Số thao tác cho: tải tài liệu, hỏi, xem nguồn, xem phiên cũ, xóa tài liệu; báo cáo từ menu | T | `test_reports/TC-UI-IA/` |
| [TC-UI-I18N](TC-UI-I18N.md) | Tên tệp rất dài/Unicode NFC-NFD/văn bản mở rộng +30%; nhập tiếng Việt bằng Telex/VNI (IME) | C | `test_reports/TC-UI-I18N/` |
| [TC-UI-MOB](TC-UI-MOB.md) | Hai kích thước điện thoại; vùng chạm ≥ 44×44 px | Th | `test_reports/TC-UI-MOB/` |
| [TC-UI-UAT](TC-UI-UAT.md) | Người dùng lần đầu hoàn thành tải–hỏi–kiểm chứng không trợ giúp | C | `test_reports/TC-UI-UAT/` |
| [TC-UI-VISUAL](TC-UI-VISUAL.md) | So sánh với `html_design/` cho 9 màn hình | T | `test_reports/TC-UI-VISUAL/` |

## B.8 Dữ liệu và migration (7)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-DATA-01](TC-DATA-01.md) | Migration trên CSDL trống; chạy lại | C | `test_reports/TC-DATA-01/` |
| [TC-DATA-02](TC-DATA-02.md) | Ràng buộc CHECK/UNIQUE/FK (trạng thái, kết quả, trích dẫn duy nhất theo thứ tự) | C | `test_reports/TC-DATA-02/` |
| [TC-DATA-03](TC-DATA-03.md) | Truy vấn lai dùng chỉ mục vector và toàn văn (EXPLAIN) | T | `test_reports/TC-DATA-03/` |
| [TC-DATA-04](TC-DATA-04.md) | Trích dẫn sau khi tài liệu bị xóa/purge | C | `test_reports/TC-DATA-04/` |
| [TC-DATA-05](TC-DATA-05.md) | Bộ PDF: có chữ, bảng, nhiều cột, nửa scan, scan, mật khẩu, hỏng, 101 trang, đúng biên dung lượng | C | `test_reports/TC-DATA-05/` |
| [TC-DATA-06](TC-DATA-06.md) | Chuẩn hóa tiếng Việt NFC/NFD trong tên tệp, câu hỏi, nội dung | C | `test_reports/TC-DATA-06/` |
| [TC-DATA-BKP](TC-DATA-BKP.md) | Sao lưu rồi **khôi phục** vào môi trường riêng; kiểm tra số tài liệu/đoạn/truy vấn mẫu | T | `test_reports/TC-DATA-BKP/` |

## B.9 Đánh giá chất lượng AI (EVAL) (14)

| Ca | Tiêu đề | Ưu | Bằng chứng |
|---|---|---|---|
| [TC-EVAL-01](TC-EVAL-01.md) | `answerable` |  | `test_reports/TC-EVAL-01/` |
| [TC-EVAL-02](TC-EVAL-02.md) | `answerable` |  | `test_reports/TC-EVAL-02/` |
| [TC-EVAL-03](TC-EVAL-03.md) | `not_found` + `general` (kiến thức phổ thông) |  | `test_reports/TC-EVAL-03/` |
| [TC-EVAL-04](TC-EVAL-04.md) | Mọi loại |  | `test_reports/TC-EVAL-04/` |
| [TC-EVAL-05](TC-EVAL-05.md) | `multi_doc` |  | `test_reports/TC-EVAL-05/` |
| [TC-EVAL-06](TC-EVAL-06.md) | `followup` (5 cặp dùng đại từ) |  | `test_reports/TC-EVAL-06/` |
| [TC-EVAL-07](TC-EVAL-07.md) | Hỏi tiếng Việt |  | `test_reports/TC-EVAL-07/` |
| [TC-EVAL-08](TC-EVAL-08.md) | `cross_language` (Việt↔Anh) |  | `test_reports/TC-EVAL-08/` |
| [TC-EVAL-09](TC-EVAL-09.md) | Hai tài liệu mâu thuẫn |  | `test_reports/TC-EVAL-09/` |
| [TC-EVAL-10](TC-EVAL-10.md) | Một phần có đáp án |  | `test_reports/TC-EVAL-10/` |
| [TC-EVAL-VN-01](TC-EVAL-VN-01.md) | Câu hỏi không dấu ("quy trinh hoan tien") |  | `test_reports/TC-EVAL-VN-01/` |
| [TC-EVAL-VN-02](TC-EVAL-VN-02.md) | Câu trộn Việt–Anh, thuật ngữ giữ nguyên |  | `test_reports/TC-EVAL-VN-02/` |
| [TC-EVAL-11](TC-EVAL-11.md) | Cả bộ |  | `test_reports/TC-EVAL-11/` |
| [TC-EVAL-12](TC-EVAL-12.md) | Mọi lần chạy |  | `test_reports/TC-EVAL-12/` |
