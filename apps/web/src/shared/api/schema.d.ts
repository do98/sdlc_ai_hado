/* TỆP SINH TỰ ĐỘNG từ api/openapi.yaml — KHÔNG SỬA TAY. Chạy `npm run gen:api` sau khi đổi hợp đồng. */

export interface paths {
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Đăng nhập
         * @description Đúng → 204 và cookie phiên. Sai tên hoặc sai mật khẩu trả cùng một lỗi `INVALID_CREDENTIALS`.
         */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Đăng xuất (hủy phiên phía máy chủ)
         * @description Luôn trả 204, kể cả khi chưa đăng nhập.
         */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Người dùng hiện tại */
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tiến trình còn sống */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sẵn sàng nhận yêu cầu (CSDL và thư mục lưu tệp)
         * @description Không kiểm tra dịch vụ AI để không kéo sập khi AI lỗi.
         */
        get: operations["getReady"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** IF-02 — Danh sách tài liệu của workspace */
        get: operations["listDocuments"];
        put?: never;
        /**
         * IF-03 — Tải lên một tệp PDF
         * @description **Một tệp mỗi yêu cầu** (để có tiến trình và thử lại từng tệp). Kiểm tra theo thứ tự: tên tệp → `%PDF-` trong
         *     1024 byte đầu → chỗ trống → dung lượng (kiểm khi truyền, vượt là dừng ngay). Tệp bị từ chối không tạo bất kỳ dữ liệu nào.
         */
        post: operations["uploadDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/documents/{id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * IF-07 — PDF gốc (hỗ trợ Range)
         * @description Hỗ trợ một dải `Range: bytes=a-b` (206). Tài liệu không tồn tại, đã xóa hoặc ở trạng thái lỗi → 404.
         */
        get: operations["getDocumentFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * IF-06 — Luồng sự kiện workspace (SSE)
         * @description Xem [sse-events.md](sse-events.md#if-06-get-apievents).
         */
        get: operations["streamEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tạo hội thoại */
        post: operations["createConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/conversations/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * IF-05 — Đặt câu hỏi, nhận câu trả lời qua SSE
         * @description Kiểm tra **trước** khi mở luồng (lỗi trả HTTP thường): rỗng → `EMPTY_QUESTION`; > 2000 ký tự →
         *     `QUESTION_TOO_LONG`; hội thoại không thuộc người dùng → `NOT_FOUND`; không có tài liệu sẵn sàng →
         *     `NO_READY_DOCUMENTS`; vượt hạn mức → `RATE_LIMITED`. Sau đó trả luồng sự kiện, xem
         *     [sse-events.md](sse-events.md#if-05-post-apiconversationsidmessages).
         */
        post: operations["askQuestion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        LoginRequest: {
            username: string;
            password: string;
        };
        Me: {
            /** Format: uuid */
            id: string;
            username: string;
            /** @enum {string} */
            role: "ADMIN" | "MEMBER";
        };
        Health: {
            /** @enum {string} */
            status: "UP";
        };
        Readiness: {
            /** @enum {string} */
            status: "UP" | "DOWN";
            checks: {
                /** @enum {string} */
                database: "UP" | "DOWN";
                /** @enum {string} */
                storage: "UP" | "DOWN";
            };
        };
        /** @enum {string} */
        DocumentStatus: "PROCESSING" | "READY" | "ERROR";
        /**
         * @description Lý do tài liệu ở trạng thái `ERROR` (xử lý nền, T08).
         * @enum {string}
         */
        DocumentErrorCode: "PASSWORD_PROTECTED" | "SCANNED_NO_TEXT" | "CORRUPT" | "TOO_MANY_PAGES" | "PROCESSING_FAILED";
        DocumentWarning: {
            /** @enum {string} */
            code: "UNREADABLE_PAGES";
            pages?: number[];
        };
        DocumentSummary: {
            /** Format: uuid */
            id: string;
            name: string;
            /** Format: int64 */
            sizeBytes: number;
            pageCount: number | null;
            status: components["schemas"]["DocumentStatus"];
            /** @enum {string|null} */
            errorCode: "PASSWORD_PROTECTED" | "SCANNED_NO_TEXT" | "CORRUPT" | "TOO_MANY_PAGES" | "PROCESSING_FAILED" | null;
            warning: {
                /** @enum {string} */
                code: "UNREADABLE_PAGES";
                pages?: number[];
            } | null;
            /** Format: uuid */
            uploadedBy: string;
            /** Format: date-time */
            uploadedAt: string;
        };
        DocumentList: {
            items: components["schemas"]["DocumentSummary"][];
            count: number;
            /** @example 20 */
            limit: number;
        };
        UploadAccepted: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            status: "PROCESSING";
        };
        Conversation: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            createdAt: string;
        };
        AskRequest: {
            /** @description Đếm theo điểm mã Unicode; chuỗi chỉ khoảng trắng bị từ chối `EMPTY_QUESTION`. */
            text: string;
        };
        /**
         * @description Danh mục mã lỗi **duy nhất** cho BE và FE. Mỗi mã có HTTP status và cờ `retryable` trong `x-catalog`;
         *     test ở cả hai phía kiểm tra khớp với tệp này.
         * @enum {string}
         */
        ErrorCode: "UNAUTHENTICATED" | "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "CSRF_REJECTED" | "INVALID_REQUEST" | "NOT_PDF" | "FILE_TOO_LARGE" | "WORKSPACE_FULL" | "EMPTY_QUESTION" | "QUESTION_TOO_LONG" | "NO_READY_DOCUMENTS" | "RATE_LIMITED" | "LLM_UNAVAILABLE" | "TIMEOUT" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "UNSUPPORTED_MEDIA_TYPE" | "NOT_READY" | "INTERNAL";
        Error: {
            code: components["schemas"]["ErrorCode"];
            /** @description Ngắn, chung, bằng tiếng Anh; không lộ chi tiết nội bộ. Văn bản tiếng Việt cho người dùng do FE ánh xạ theo `code`. */
            message: string;
            /** @description Giá trị header `X-Request-Id`. */
            traceId: string | null;
        };
    };
    responses: {
        /** @description Yêu cầu sai định dạng (`INVALID_REQUEST`). */
        InvalidRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Chưa đăng nhập hoặc phiên hết hạn (`UNAUTHENTICATED`). */
        Unauthenticated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Sai tên đăng nhập hoặc mật khẩu (`INVALID_CREDENTIALS`) — không phân biệt hai trường hợp. */
        InvalidCredentials: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Bị khóa tạm sau nhiều lần sai (`ACCOUNT_LOCKED`), kể cả khi nhập đúng mật khẩu. */
        AccountLocked: {
            headers: {
                /** @description Số giây còn bị khóa. */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Vượt hạn mức (`RATE_LIMITED`). */
        RateLimited: {
            headers: {
                /** @description Số giây cần chờ. */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Origin không được phép (`CSRF_REJECTED`). */
        CsrfRejected: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Không tồn tại hoặc không có quyền xem (`NOT_FOUND`) — không phân biệt. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Không phải PDF (`NOT_PDF`). */
        NotPdf: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Quá giới hạn dung lượng (`FILE_TOO_LARGE`). */
        FileTooLarge: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Workspace đã đủ số tài liệu tối đa (`WORKSPACE_FULL`). */
        WorkspaceFull: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Chưa có tài liệu sẵn sàng (`NO_READY_DOCUMENTS`). */
        NoReadyDocuments: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Câu hỏi rỗng (`EMPTY_QUESTION`) hoặc quá dài (`QUESTION_TOO_LONG`). */
        InvalidQuestion: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: {
        /** @description Luôn là nosniff. */
        XContentTypeOptions: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Đã đăng nhập; cookie phiên được đặt. */
            204: {
                headers: {
                    /** @description `DOCCHAT_SESSION`; `HttpOnly; SameSite=Lax; Path=/; Max-Age=28800` (và `Secure`). */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["InvalidRequest"];
            401: components["responses"]["InvalidCredentials"];
            403: components["responses"]["CsrfRejected"];
            423: components["responses"]["AccountLocked"];
            429: components["responses"]["RateLimited"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Đã hủy phiên; cookie bị xóa. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            403: components["responses"]["CsrfRejected"];
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Thông tin người dùng đang đăng nhập. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Me"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Còn sống. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
        };
    };
    getReady: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sẵn sàng. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Readiness"];
                };
            };
            /** @description Chưa sẵn sàng (một thành phần lỗi). */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Readiness"];
                };
            };
        };
    };
    listDocuments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Danh sách, mới nhất trước; không gồm tài liệu đã xóa. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentList"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    uploadDocument: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            /** @description Đã nhận; đang xử lý nền. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadAccepted"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["CsrfRejected"];
            409: components["responses"]["WorkspaceFull"];
            413: components["responses"]["FileTooLarge"];
            415: components["responses"]["NotPdf"];
            429: components["responses"]["RateLimited"];
        };
    };
    getDocumentFile: {
        parameters: {
            query?: never;
            header?: {
                Range?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Toàn bộ tệp. */
            200: {
                headers: {
                    "X-Content-Type-Options": components["headers"]["XContentTypeOptions"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Một khoảng của tệp. */
            206: {
                headers: {
                    "Content-Range"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            /** @description Dải không hợp lệ. */
            416: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    streamEvents: {
        parameters: {
            query?: never;
            header?: {
                "Last-Event-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Luồng `text/event-stream`. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    createConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Đã tạo. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Conversation"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["CsrfRejected"];
        };
    };
    askQuestion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AskRequest"];
            };
        };
        responses: {
            /** @description Luồng `text/event-stream`. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            401: components["responses"]["Unauthenticated"];
            403: components["responses"]["CsrfRejected"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["NoReadyDocuments"];
            422: components["responses"]["InvalidQuestion"];
            429: components["responses"]["RateLimited"];
        };
    };
}
