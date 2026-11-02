import { apiRequest } from './http';
import type { DocumentList } from './types';

/** IF-02: danh sách tài liệu của workspace (T11 hoàn thiện phần hiển thị). */
export function listDocuments(): Promise<DocumentList> {
  return apiRequest<DocumentList>('/api/documents');
}
