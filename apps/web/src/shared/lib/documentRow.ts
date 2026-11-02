// Mô hình hiển thị một hàng tài liệu (T11.b). Sáu trạng thái hiển thị là hợp của `status` ở máy chủ
// (PROCESSING|READY|ERROR + warning) với trạng thái cục bộ của hàng đợi tải lên (QUEUED|UPLOADING).
import type { DocumentErrorCode, DocumentSummary } from '../api/types';
import { messages } from './messages';

export type RowStatus = 'queued' | 'uploading' | 'processing' | 'ready' | 'readyWarning' | 'error';

export interface RowView {
  key: string;
  name: string;
  sizeBytes: number;
  status: RowStatus;
  /** 0–100 khi đang tải lên. */
  progress: number | null;
  /** Dòng phụ: số trang, lý do lỗi hoặc cảnh báo. */
  detail: string | null;
  /** Giá trị cho thuộc tính data-state (kiểm thử/E2E). */
  dataState: string;
}

/** Thông điệp theo mã lỗi xử lý nền; mã lạ vẫn có thông điệp chung (không lộ mã kỹ thuật). */
export function messageForDocumentError(code: DocumentErrorCode | string | null): string {
  const table = messages.documents.errorByCode as Record<string, string>;
  return (code !== null && table[code]) || messages.documents.errorUnknown;
}

export function viewOfDocument(doc: DocumentSummary): RowView {
  const pages = doc.pageCount !== null ? messages.documents.pages(doc.pageCount) : null;
  if (doc.status === 'ERROR') {
    return base(doc, 'error', messageForDocumentError(doc.errorCode));
  }
  if (doc.status === 'READY') {
    if (doc.warning) {
      const detail = messages.documents.unreadablePages(doc.warning.pages ?? []);
      return base(doc, 'readyWarning', pages ? `${detail} · ${pages}` : detail);
    }
    return base(doc, 'ready', pages);
  }
  return base(doc, 'processing', null);
}

function base(doc: DocumentSummary, status: RowStatus, detail: string | null): RowView {
  return {
    key: doc.id,
    name: doc.name,
    sizeBytes: doc.sizeBytes,
    status,
    progress: null,
    detail,
    dataState: doc.status,
  };
}

export function statusLabel(view: RowView): string {
  switch (view.status) {
    case 'queued':
      return messages.documents.status.queued;
    case 'uploading':
      return messages.documents.status.uploading(view.progress ?? 0);
    case 'processing':
      return messages.documents.status.processing;
    case 'ready':
      return messages.documents.status.ready;
    case 'readyWarning':
      return messages.documents.status.readyWarning;
    default:
      return messages.documents.status.error;
  }
}

/** Biểu tượng chữ cho mỗi trạng thái: trạng thái không chỉ dựa vào màu. */
export function statusIcon(status: RowStatus): string {
  switch (status) {
    case 'queued':
      return '○';
    case 'uploading':
      return '↑';
    case 'processing':
      return '…';
    case 'ready':
      return '✓';
    case 'readyWarning':
      return '⚠';
    default:
      return '✕';
  }
}
