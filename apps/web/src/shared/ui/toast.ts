import { ref } from 'vue';

export interface ToastItem {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

// Trạng thái dùng chung toàn ứng dụng: gọi useToast() ở bất kỳ đâu; <Toaster /> (ở App) hiển thị.
const items = ref<ToastItem[]>([]);
let nextId = 1;

function push(kind: ToastItem['kind'], text: string): number {
  const id = nextId++;
  items.value = [...items.value, { id, kind, text }];
  return id;
}

export function useToast() {
  return {
    items,
    /** Thành công: tự ẩn sau 5 giây. */
    success: (text: string) => push('success', text),
    /** Lỗi cần hành động: giữ lại cho tới khi người dùng đóng. */
    error: (text: string) => push('error', text),
    dismiss: (id: number) => {
      items.value = items.value.filter((t) => t.id !== id);
    },
    clear: () => {
      items.value = [];
    },
  };
}

/** Thời gian tự ẩn của thông báo thành công (ms). */
export const SUCCESS_TOAST_MS = 5000;
/** "Không tự ẩn" cho thông báo lỗi (giá trị lớn nhất của setTimeout). */
export const PERSISTENT_TOAST_MS = 2_147_483_647;
