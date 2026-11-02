-- T03: cột vector cho truy hồi. Cần PostgreSQL có phần mở rộng pgvector (ảnh pgvector/pgvector:pg16 trong
-- docker-compose.yml). Số chiều 1536 là giá trị tạm; đổi khi chốt mô hình embedding (T06) NẾU chưa có dữ liệu thật.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE chunks ADD COLUMN embedding_model text NOT NULL;
ALTER TABLE chunks ADD COLUMN embedding vector(1536) NOT NULL;
CREATE INDEX chunks_embedding_hnsw_ix ON chunks USING hnsw (embedding vector_cosine_ops);
