import { setupServer } from 'msw/node';
import { MockDb } from './db';
import { createHandlers } from './handlers';

/** Máy chủ giả cho test (Node). Mỗi test tạo `db` riêng để không dính trạng thái nhau. */
export function createMockServer(db: MockDb = new MockDb()) {
  return { db, server: setupServer(...createHandlers(db)) };
}
