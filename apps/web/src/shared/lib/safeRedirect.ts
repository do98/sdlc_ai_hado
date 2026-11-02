/**
 * Chỉ chấp nhận đường dẫn nội bộ làm đích quay lại sau đăng nhập (chống open redirect).
 * Trả '/' nếu giá trị lạ, trỏ ra ngoài hoặc trỏ về chính trang đăng nhập.
 */
export function safeRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  // Ký tự điều khiển hoặc dấu gạch chéo ngược (một số trình duyệt coi như '/')
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || ch === '\\') return '/';
  }
  const path = raw.split(/[?#]/)[0];
  if (path === '/login') return '/';
  return raw;
}
