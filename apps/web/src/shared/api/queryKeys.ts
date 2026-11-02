// Khóa truy vấn TanStack Query thống nhất (T02.f). Dùng hàm này thay vì viết mảng rải rác để invalidate đúng.
export const queryKeys = {
  me: ['me'] as const,
  documents: (filter: { status?: string } = {}) => ['documents', filter] as const,
  documentsAll: ['documents'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  citation: (id: string) => ['citation', id] as const,
};
