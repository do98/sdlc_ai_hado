# Đóng góp

## Nhánh và commit

- Nhánh chính: `main` (được bảo vệ: CI xanh và ≥ 1 review mới được merge).
- Nhánh làm việc: `feat/<task>-<mô-tả-ngắn>`, ví dụ `feat/T07-upload-api`; sửa lỗi: `fix/<mô-tả>`.
- Một PR cho một task (hoặc một phần rõ ràng của task). Mô tả PR nêu task (`T01`…`T23`) và cách kiểm chứng.
- Thông điệp commit: câu mệnh lệnh ngắn, có tiền tố `T07:` khi gắn với task.

## Trước khi mở PR

```bash
cd apps/web && npm run lint && npm test && npm run build
cd apps/api && ./mvnw verify
```

## Review

- Ít nhất 1 người khác tác giả duyệt. Người duyệt kiểm: tiêu chí hoàn thành của task, test, luật kiến trúc, không ghi nội dung câu hỏi/tài liệu vào log, không lưu token ở `localStorage`.
- Không tắt luật lint để qua CI. Nếu luật sai, sửa luật kèm test và nêu lý do trong PR.

## Đặt tên test

Test phục vụ một tiêu chí chấp nhận thì tên chứa mã đó (ví dụ `US-030-AC1` hoặc `T07_tai_len_vuot_20_tai_lieu`) để tra cứu và báo cáo độ phủ.

## Phiên bản công cụ

Node theo `.nvmrc`, JDK theo `.sdkmanrc`, Maven theo `apps/api/.mvn/wrapper`. Đổi phiên bản ở đúng các tệp này.
