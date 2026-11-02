-- T07: nhật ký kiểm toán và sự kiện đo lường tối thiểu (T09 bổ sung bảng sự kiện workspace và phần đọc).
-- QUY TẮC: không ghi nội dung tài liệu, câu hỏi, câu trả lời hay TÊN TỆP gốc vào hai bảng này; chỉ định danh và số đo.
CREATE TABLE audit_log (
  id           uuid PRIMARY KEY,
  user_id      uuid REFERENCES users (id) ON DELETE SET NULL,
  action       text NOT NULL,
  subject_type text,
  subject_id   uuid,
  attributes   jsonb NOT NULL DEFAULT '{}',
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_at_ix ON audit_log (at DESC);
CREATE INDEX audit_log_subject_ix ON audit_log (subject_type, subject_id);

-- Chỉ-thêm: chặn sửa/xóa bằng trigger
CREATE FUNCTION audit_log_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END
$$;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

CREATE TABLE analytics_events (
  id         uuid PRIMARY KEY,
  event_code text NOT NULL,
  user_id    uuid,
  attributes jsonb NOT NULL DEFAULT '{}',
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_code_at_ix ON analytics_events (event_code, at);
