import { LIMITS } from '../../shared/lib/limits';

export type RejectReason = 'NOT_PDF' | 'FILE_TOO_LARGE' | 'WORKSPACE_FULL';

export interface FileCheck {
  file: File;
  ok: boolean;
  /** Mã lỗi theo hợp đồng API (cùng bộ với máy chủ) để dùng chung bảng thông điệp. */
  reason?: RejectReason;
}

/** Đọc 5 byte đầu của tệp (chỉ slice, không nạp cả tệp vào bộ nhớ). */
function readHead(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve('');
    reader.readAsText(file.slice(0, 5), 'latin1');
  });
}

/**
 * ALG-02 — kiểm tra từng tệp THEO THỨ TỰ CHỌN để phản hồi nhanh (máy chủ vẫn là nơi quyết định cuối):
 *  1. đuôi `.pdf` (không phân biệt hoa thường); 2. 5 byte đầu là `%PDF-`; 3. ≤ LIMITS.maxFileMb;
 *  4. còn chỗ: `slotsUsed` (tài liệu đã có + tệp đang chờ/đang tải) + số tệp hợp lệ trước đó < LIMITS.maxDocuments.
 * Tệp sai bị loại RIÊNG LẺ kèm lý do; tệp đúng vẫn được nhận. Tệp 0 byte coi là sai loại.
 */
export async function checkFiles(files: File[], slotsUsed: number): Promise<FileCheck[]> {
  const maxBytes = LIMITS.maxFileMb * 1024 * 1024;
  const results: FileCheck[] = [];
  let used = slotsUsed;
  for (const file of files) {
    if (!/\.pdf$/i.test(file.name) || (await readHead(file)) !== '%PDF-') {
      results.push({ file, ok: false, reason: 'NOT_PDF' });
    } else if (file.size > maxBytes) {
      results.push({ file, ok: false, reason: 'FILE_TOO_LARGE' });
    } else if (used >= LIMITS.maxDocuments) {
      results.push({ file, ok: false, reason: 'WORKSPACE_FULL' });
    } else {
      used += 1;
      results.push({ file, ok: true });
    }
  }
  return results;
}
