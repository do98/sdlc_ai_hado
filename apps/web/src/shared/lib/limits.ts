// Giới hạn nghiệp vụ dùng để hiển thị thông điệp. Giá trị theo kế hoạch phát triển (T07):
// 20 tài liệu, 10 MB/tệp, 100 trang, câu hỏi ≤ 2.000 ký tự. Backend là nơi quyết định cuối cùng; các giá trị này
// `[TBD: OQ-004]` và phải khớp cấu hình backend. Đổi ở một nơi này.
export const LIMITS = {
  maxDocuments: 20,
  maxFileMb: 10,
  maxPages: 100,
  maxQuestionChars: 2000,
} as const;
