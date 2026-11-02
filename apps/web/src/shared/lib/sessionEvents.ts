// Sự kiện "phiên đã bị xóa" (đăng xuất hoặc hết hạn): nơi nào giữ dữ liệu theo người dùng (cache truy vấn…)
// đăng ký lắng nghe để dọn, bảo đảm người đăng nhập sau không thấy dữ liệu của người trước.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionCleared(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionCleared(): void {
  listeners.forEach((l) => l());
}
