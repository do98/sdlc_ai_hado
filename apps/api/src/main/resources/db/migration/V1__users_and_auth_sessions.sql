-- T04: phần của lược đồ cần cho đăng nhập. T03 bổ sung các bảng còn lại (documents, chunks, ...) ở migration sau;
-- KHÔNG sửa tệp này sau khi đã chạy trên môi trường nào đó.
CREATE TABLE users (
  id            uuid PRIMARY KEY,
  username      text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
  failed_logins int  NOT NULL DEFAULT 0 CHECK (failed_logins >= 0),
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Tên đăng nhập không phân biệt hoa thường
CREATE UNIQUE INDEX users_username_lower_uq ON users (lower(username));

-- Phiên lưu phía máy chủ. Chỉ lưu BĂM SHA-256 của mã phiên: lộ CSDL không lộ phiên đang sống.
CREATE TABLE auth_sessions (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX auth_sessions_expires_ix ON auth_sessions (expires_at);
CREATE INDEX auth_sessions_user_ix ON auth_sessions (user_id);
