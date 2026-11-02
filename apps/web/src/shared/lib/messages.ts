// Chuỗi hiển thị tiếng Việt TẬP TRUNG (T02.g). Component và template không chứa chuỗi người dùng trực tiếp
// (có test kiểm tra); thêm khóa mới ở đây. Nội dung các thông điệp lỗi là `[Đề xuất]`, cần đối chiếu
// UI/UX Blueprint §3.5.5 và PO/UX duyệt.
import { LIMITS } from './limits';

export const messages = {
  appName: 'Chat với tài liệu',

  ui: {
    loading: 'Đang xử lý…',
    close: 'Đóng',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    notifications: 'Thông báo',
    dismissNotification: 'Đóng thông báo',
    pageTitleSuffix: 'Chat với tài liệu',
  },

  auth: {
    title: 'Đăng nhập',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    submit: 'Đăng nhập',
    submitting: 'Đang đăng nhập…',
    // 401 và 423 dùng CHUNG một thông điệp: không cho biết sai tên, sai mật khẩu hay tài khoản bị khóa.
    failed:
      'Không đăng nhập được. Hãy kiểm tra tên đăng nhập và mật khẩu, hoặc thử lại sau ít phút.',
    rateLimited: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
    network: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.',
    unexpected: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    logout: 'Đăng xuất',
    greeting: (name: string) => `Xin chào, ${name}`,
  },

  // Thông điệp theo mã lỗi API (xem shared/api/errors.ts)
  errors: {
    permission: 'Bạn không có quyền thực hiện thao tác này.',
    csrf: 'Bạn không có quyền thực hiện thao tác này. Hãy tải lại trang rồi thử lại.',
    invalidRequest: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.',
    notPdf: 'Tệp không phải PDF. Chỉ hỗ trợ tệp định dạng PDF.',
    fileTooLarge: `Tệp vượt giới hạn cho phép (tối đa ${LIMITS.maxFileMb} MB và ${LIMITS.maxPages} trang).`,
    workspaceFull: `Kho đã đủ ${LIMITS.maxDocuments} tài liệu nên không thể tải thêm.`,
    emptyQuestion: 'Vui lòng nhập câu hỏi.',
    questionTooLong: `Câu hỏi quá dài (tối đa ${LIMITS.maxQuestionChars} ký tự).`,
    noReadyDocuments: 'Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong.',
    llmUnavailable: 'Dịch vụ trả lời tạm thời không khả dụng. Vui lòng thử lại sau.',
    timeout: 'Câu trả lời mất quá nhiều thời gian. Vui lòng thử lại.',
    notFound: 'Không tìm thấy nội dung yêu cầu.',
    methodNotAllowed: 'Thao tác không được hỗ trợ.',
    unsupportedMediaType: 'Định dạng dữ liệu gửi lên không được hỗ trợ.',
    notReady: 'Hệ thống chưa sẵn sàng. Vui lòng thử lại sau ít phút.',
    internal: 'Có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau.',
    generic: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
  },

  errorBoundary: {
    title: 'Đã xảy ra lỗi hiển thị',
    description: 'Ứng dụng gặp sự cố ngoài dự kiến. Bạn có thể thử lại hoặc tải lại trang.',
    retry: 'Thử lại',
    reload: 'Tải lại trang',
  },

  layout: {
    skipToContent: 'Bỏ qua điều hướng, tới nội dung chính',
    documents: 'Tài liệu',
    conversation: 'Hội thoại',
    source: 'Nguồn',
    openDocuments: 'Mở danh sách tài liệu',
    closePanel: 'Đóng ngăn',
    openSource: 'Mở ngăn nguồn',
    documentsEmpty: 'Chưa có tài liệu. Chức năng tải PDF lên sẽ có ở bước sau.',
    conversationEmpty: 'Hội thoại sẽ hiển thị ở đây.',
    sourceEmpty: 'Chọn một trích dẫn trong câu trả lời để xem đoạn nguồn.',
    tabs: 'Chuyển khu vực',
    userMenu: 'Người dùng',
  },

  upload: {
    button: 'Tải PDF lên',
    buttonFull: 'Đã đủ số tài liệu',
    hint: `Chọn hoặc kéo thả tệp PDF (tối đa ${LIMITS.maxFileMb} MB và ${LIMITS.maxPages} trang mỗi tệp).`,
    counter: (n: number, max: number) => `Đã dùng ${n}/${max} tài liệu`,
    dropTitle: 'Thả tệp PDF vào đây để tải lên',
    dropHint: 'Các tệp không hợp lệ sẽ được báo riêng, tệp hợp lệ vẫn được tải.',
    queueLabel: 'Hàng đợi tải lên',
    fileInputLabel: 'Chọn tệp PDF để tải lên',
    state: {
      queued: 'Đang chờ',
      uploading: (percent: number) => `Đang tải ${percent}%`,
      retrying: (seconds: number) => `Mất kết nối, tự thử lại sau ${seconds} giây`,
      accepted: 'Đã tải lên, đang xử lý',
      rejected: 'Bị từ chối',
      failed: 'Tải lên chưa thành công',
    },
    action: {
      cancel: 'Hủy',
      retry: 'Thử lại',
      dismiss: 'Đóng',
      cancelAria: (name: string) => `Hủy tải tệp ${name}`,
      retryAria: (name: string) => `Thử lại tải tệp ${name}`,
      dismissAria: (name: string) => `Đóng thông báo của tệp ${name}`,
    },
    progressLabel: (name: string) => `Tiến trình tải tệp ${name}`,
    announce: {
      accepted: (name: string) => `Tệp ${name} đã tải lên, đang xử lý.`,
      rejected: (name: string, reason: string) => `Tệp ${name} bị từ chối: ${reason}`,
      failed: (name: string, reason: string) => `Tải tệp ${name} chưa thành công: ${reason}`,
      retrying: (name: string) => `Mất kết nối khi tải tệp ${name}, đang thử lại.`,
      cancelled: (name: string) => `Đã hủy tải tệp ${name}.`,
    },
  },

  // Danh sách tài liệu (T11). Nội dung là `[Đề xuất]`, đối chiếu SDD/AC-012.x khi có.
  documents: {
    listLabel: 'Danh sách tài liệu',
    loading: 'Đang tải danh sách tài liệu',
    loadError: 'Không tải được danh sách tài liệu.',
    reload: 'Tải lại danh sách',
    empty: {
      title: 'Chưa có tài liệu nào',
      description: 'Tải lên tệp PDF để bắt đầu đặt câu hỏi về nội dung tài liệu.',
    },
    status: {
      queued: 'Chờ tải',
      uploading: (percent: number) => `Đang tải lên ${percent}%`,
      processing: 'Đang xử lý',
      ready: 'Sẵn sàng',
      readyWarning: 'Sẵn sàng, có cảnh báo',
      error: 'Lỗi',
    },
    pages: (n: number) => `${n} trang`,
    // Lỗi xử lý nền theo mã (T08). NOT_PDF/FILE_TOO_LARGE/WORKSPACE_FULL bị từ chối ngay lúc tải nên ở messages.errors.
    errorByCode: {
      PASSWORD_PROTECTED: 'Tệp có mật khẩu bảo vệ. Hãy gỡ mật khẩu rồi tải lên lại.',
      SCANNED_NO_TEXT: 'Tệp là ảnh scan, không có văn bản để đọc.',
      CORRUPT: 'Tệp bị hỏng, không mở được.',
      TOO_MANY_PAGES: `Tệp quá ${LIMITS.maxPages} trang.`,
      PROCESSING_FAILED: 'Xử lý tệp chưa thành công. Vui lòng tải lên lại.',
    },
    errorUnknown: 'Không xử lý được tệp này.',
    unreadablePages: (pages: number[]) =>
      pages.length > 0
        ? `Một số trang không đọc được: ${pages.join(', ')}`
        : 'Một số trang không đọc được.',
    connectionLost: 'Đã mất kết nối thời gian thực — đang thử lại.',
    announce: {
      ready: (name: string) => `«${name}» đã sẵn sàng.`,
      readyWarning: (name: string) => `«${name}» đã sẵn sàng, nhưng có trang không đọc được.`,
      error: (name: string, reason: string) => `«${name}» xử lý không thành công: ${reason}`,
    },
  },

  // Khu hội thoại (đầy đủ ở T14–T16): hiện chỉ có ô nhập bị khóa kèm giải thích (ST-04).
  conversation: {
    inputLabel: 'Câu hỏi về tài liệu',
    inputPlaceholder: 'Nhập câu hỏi…',
    lockedNoReady: 'Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi.',
    lockedSoon: 'Đã có tài liệu sẵn sàng. Tính năng đặt câu hỏi sẽ có ở bước sau.',
  },

  notFound: {
    title: 'Không tìm thấy trang',
    back: 'Về trang chính',
  },

  demo: {
    title: 'Bộ thành phần giao diện',
    subtitle: 'Trang thử cho nhà phát triển (chỉ có khi chạy ở chế độ phát triển).',
    buttons: 'Nút',
    primary: 'Nút chính',
    secondary: 'Nút phụ',
    danger: 'Nút nguy hiểm',
    disabled: 'Đã vô hiệu',
    loading: 'Đang tải',
    inputs: 'Ô nhập',
    inputNormal: 'Câu hỏi',
    inputNormalHint: 'Nhập nội dung cần hỏi',
    inputCounter: 'Câu hỏi có bộ đếm',
    sampleQuestion: 'Hãy cho tôi biết thời hạn bảo hành của hợp đồng ',
    inputError: 'Tên tệp',
    inputErrorText: 'Tên tệp không được để trống.',
    dialog: 'Hộp thoại',
    openDialog: 'Mở hộp thoại',
    dialogTitle: 'Xác nhận thao tác',
    dialogDescription:
      'Hộp thoại giữ focus bên trong, đóng bằng phím Esc và trả focus về nút đã mở.',
    toast: 'Thông báo ngắn',
    toastSuccess: 'Hiện thông báo thành công',
    toastError: 'Hiện thông báo lỗi',
    toastSuccessText: 'Đã lưu thay đổi.',
    toastErrorText: 'Không thể hoàn tất thao tác.',
    tooltip: 'Gợi ý',
    tooltipTrigger: 'Rê chuột hoặc focus vào đây',
    tooltipText: 'Gợi ý hiện khi rê chuột hoặc khi focus bàn phím.',
    skeleton: 'Khung chờ',
    skeletonLabel: 'Đang tải nội dung',
    states: 'Ba trạng thái',
    stateNormal: 'Bình thường',
    stateLoading: 'Đang tải',
    stateError: 'Lỗi',
    alerts: 'Thông báo gắn vùng',
    alertInfo: 'Thông tin: tài liệu đang được xử lý.',
    alertWarning: 'Cảnh báo: một số trang không đọc được.',
    alertError: 'Lỗi: không tải được danh sách.',
    alertSuccess: 'Thành công: tài liệu đã sẵn sàng.',
  },
} as const;
