/** Định dạng dung lượng cho người đọc: "850 KB", "1,2 MB" (dấu phẩy thập phân kiểu Việt). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
}
