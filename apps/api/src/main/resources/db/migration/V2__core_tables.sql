-- T03: các bảng nghiệp vụ còn lại (users và auth_sessions đã có ở V1). Cột vector nằm ở db/vector/V3 vì cần pgvector.
CREATE TABLE documents (
  id          uuid PRIMARY KEY,
  name        text   NOT NULL,
  size_bytes  bigint NOT NULL CHECK (size_bytes >= 0),
  page_count  int    CHECK (page_count IS NULL OR page_count >= 0),
  status      text   NOT NULL CHECK (status IN ('PROCESSING', 'READY', 'ERROR', 'DELETED')),
  error_code  text   CHECK (error_code IS NULL OR error_code IN
                ('PASSWORD_PROTECTED', 'SCANNED_NO_TEXT', 'CORRUPT', 'TOO_MANY_PAGES', 'PROCESSING_FAILED')),
  warning     jsonb,            -- ví dụ {"code":"UNREADABLE_PAGES","pages":[3,7]}
  storage_key text   NOT NULL,
  uploaded_by uuid   NOT NULL REFERENCES users (id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  ready_at    timestamptz,
  CHECK (status <> 'ERROR' OR error_code IS NOT NULL)
);
CREATE INDEX documents_status_uploaded_ix ON documents (status, uploaded_at DESC);
CREATE INDEX documents_uploaded_by_ix ON documents (uploaded_by);

CREATE TABLE chunks (
  id          uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  page        int  NOT NULL CHECK (page >= 1),
  char_start  int  NOT NULL CHECK (char_start >= 0),
  char_end    int  NOT NULL,
  content     text NOT NULL,
  CHECK (char_end > char_start)
);
CREATE INDEX chunks_doc_page_ix ON chunks (document_id, page);

CREATE TABLE conversations (
  id         uuid PRIMARY KEY,
  owner_id   uuid NOT NULL REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_owner_ix ON conversations (owner_id, created_at DESC);

CREATE TABLE messages (
  id               uuid PRIMARY KEY,
  conversation_id  uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  question         text NOT NULL,
  answer           text,
  result           text CHECK (result IN ('ANSWERED', 'NOT_FOUND', 'PARTIAL', 'STOPPED', 'INTERRUPTED', 'TIMEOUT', 'ERROR')),
  prompt_tokens    int CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
  completion_tokens int CHECK (completion_tokens IS NULL OR completion_tokens >= 0),
  cost_usd         numeric(10, 6) CHECK (cost_usd IS NULL OR cost_usd >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz
);
CREATE INDEX messages_conversation_ix ON messages (conversation_id, created_at);

CREATE TABLE citations (
  id            uuid PRIMARY KEY,
  message_id    uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  idx           int  NOT NULL CHECK (idx >= 1),            -- số [n] trong câu trả lời
  document_id   uuid NOT NULL REFERENCES documents (id),
  document_name text NOT NULL,                               -- sao chép lúc tạo để vẫn hiển thị khi tài liệu đã xóa
  page          int  NOT NULL CHECK (page >= 1),
  char_start    int,
  char_end      int,
  UNIQUE (message_id, idx)
);
CREATE INDEX citations_document_ix ON citations (document_id);
