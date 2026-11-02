-- T09: nhật ký sự kiện của workspace cho kênh SSE (IF-06). `seq` tăng dần là id của sự kiện (Last-Event-ID).
-- Ghi cùng giao dịch với thay đổi tài liệu; EventRepository giữ khóa tư vấn khi chèn để thứ tự seq trùng thứ tự commit
-- (người đọc không bao giờ bỏ sót một seq nhỏ hơn đến muộn).
CREATE TABLE events (
  seq        bigserial PRIMARY KEY,
  type       text  NOT NULL,
  payload    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_created_ix ON events (created_at);
