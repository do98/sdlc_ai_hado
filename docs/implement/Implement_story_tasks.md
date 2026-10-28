# Thẻ công việc chi tiết theo User Story — Công cụ "Chat với tài liệu" (MVP)

> **Mã tài liệu:** IMP-STORY-001 · **Phiên bản:** 0.1 · **Trạng thái:** `Draft` · **Ngày:** 2026-10-28
> **Mục đích:** biến từng việc `IMP-xxx` trong [Implement_plan.md](Implement_plan.md) thành chỉ dẫn mà lập trình viên có thể nhận và làm ngay: việc con, endpoint, quy tắc kiểm tra, trạng thái giao diện, kiểm thử theo từng tiêu chí chấp nhận (AC), trường hợp biên, định nghĩa hoàn thành.
> **Đọc cùng:** [Implement_tech_spec.md](Implement_tech_spec.md) (viết tắt **TS**: lược đồ, API, SSE, ports, RAG, cấu hình) · [UserStories_Screens.md](../requirements/UserStories_Screens.md) (AC đầy đủ + màn hình) · [UIUX_Blueprint.md](../design/UIUX_Blueprint.md) · [SAD.md](../design/SAD.md).
> **Quy ước:** `[Đề xuất]` = người lập kế hoạch đề xuất, đội được đổi nếu giữ hợp đồng · `[TBD: OQ-xxx]` = chờ quyết định, mỗi thẻ ghi **phương án tạm** để không bị chặn · `[Unverified]` = chưa có bằng chứng.

---

## 0. Cách đọc một thẻ story

Mỗi story gồm các mục cố định:

| Mục | Nội dung |
|---|---|
| **Tóm tắt** | Ưu tiên, giai đoạn, màn hình, API, bảng dữ liệu liên quan |
| **Điều kiện tiên quyết** | Việc/story phải xong trước (theo cột "Phụ thuộc" của kế hoạch) |
| **Việc (IMP)** | Từng việc: vai trò, cỡ, **việc con có thể kiểm tra được**, đầu ra |
| **Hợp đồng kỹ thuật** | Endpoint, quy tắc kiểm tra, trạng thái, thông báo — trỏ về TS khi đã định nghĩa ở đó |
| **Kiểm thử theo AC** | Mỗi `US-xxx-ACn` ↔ ít nhất một ca kiểm thử, loại (U = đơn vị, I = tích hợp, E = E2E, M = thủ công), tên ca theo quy ước TS §1.3 |
| **Trường hợp biên** | Những chỗ dễ sai, đã suy ra từ SAD/Blueprint |
| **Câu hỏi mở và phương án tạm** | Việc nào bị chặn bởi OQ nào và làm gì trong lúc chờ |
| **Hoàn thành (DoD)** | Điều kiện riêng của story, cộng DoD chung ở mục 1 |

Định danh việc con: `IMP-030.a`, `IMP-030.b`… (chỉ để tham chiếu trong thẻ; khi tạo ticket có thể tách thành ticket con).

## 1. DoD chung cho mọi việc `[Đề xuất, bổ sung vào DoD của kế hoạch §10]`

- Mã đã qua review (≥ 1 người duyệt khác tác giả), CI xanh: lint (gồm lint ranh giới mô-đun), kiểm thử đơn vị, quét phụ thuộc/bí mật.
- Có kiểm thử cho mỗi AC liên quan (tên ca chứa `US-xxx-ACn`); kiểm thử phân quyền cho mọi endpoint mới đọc/ghi dữ liệu người dùng (người dùng B không thấy dữ liệu của A → `404`).
- Không ghi nội dung câu hỏi/trả lời/văn bản tài liệu vào log, số đo, `usage_events`, `audit_log` (TS §10.3).
- Thông báo cho người dùng đi qua `i18n/vi.json` theo Blueprint §3.5.5; không hard-code chuỗi trong component.
- Cập nhật OpenAPI (sinh tự động) và, nếu đổi hợp đồng ở TS, cập nhật TS trong cùng PR.
- Migration có cả hướng tiến và cách hoàn tác (hoặc ghi rõ "không hoàn tác được" và vì sao).

## 2. Việc nền tảng (không gắn riêng một story)

Các việc này mở đường cho mọi story; phần dùng chung đã được đặc tả ở TS.

| IMP | Việc | Việc con kiểm tra được | Tham chiếu |
|---|---|---|---|
| IMP-010 | Khởi tạo kho mã | (a) Cây thư mục như TS §1.1 và §12; (b) lint ranh giới: `ports` không import `adapters`, mô-đun chỉ import `__init__` của mô-đun khác — CI đỏ nếu vi phạm; (c) `Makefile`/script `dev`, `test`, `lint`, `migrate`; (d) quy ước commit và nhánh | TS §1 |
| IMP-011 | CI | (a) Pipeline chạy trên mỗi PR: lint, kiểm thử đơn vị, build ảnh; (b) quét phụ thuộc và quét bí mật chặn khi có phát hiện mức cao; (c) báo độ phủ AC theo tên ca kiểm thử (TS §1.3) | Kế hoạch §9 |
| IMP-012 | Container + compose dev | (a) Một ảnh dùng cho `api` và `worker` (lệnh khởi chạy khác nhau); (b) compose: PostgreSQL 16 + pgvector, object storage cục bộ (MinIO `[Đề xuất]`), IdP phát triển (TS §9.1); (c) `docker compose up` rồi `make migrate seed` chạy được từ máy sạch | TS §3, §9.1 |
| IMP-013 | Hạ tầng staging (IaC) | (a) Reverse proxy + TLS; (b) mạng nội bộ cho CSDL/object storage; (c) secret manager; (d) **egress allow-list** chỉ tới dịch vụ AI đã chọn (RSK-002); (e) giới hạn thân yêu cầu (TS §4.3, `POST /documents`) | SAD §4.1.2, §4.4 · `[TBD: OQ-022]` |
| IMP-014 | Lược đồ + migration | (a) Migration 0001 theo TS §3.1–3.3 (12 bảng, chỉ mục, RLS, hàm `visible_document_ids`); (b) trigger chỉ-thêm cho `audit_log`; (c) kiểm thử migration trên CSDL trống và **kiểm thử RLS thuần SQL**: bắt đầu giao dịch, `SET LOCAL app.user_id`, truy vấn `documents`/`document_chunks` bằng vai trò `docchat_api`; (d) script `seed` (người dùng mẫu, vai trò) | TS §3 |
| IMP-015 | Hàng đợi job + worker | (a) Câu lệnh nhận job theo TS §3.4; (b) vòng lặp worker: nhận → chạy handler theo `type` → kết thúc/thử lại; (c) khôi phục job quá hạn thuê mỗi 60 s; (d) `INGEST_CONCURRENCY`; (e) tắt êm (SIGTERM: ngừng nhận, chờ job đang chạy tối đa `JOB_LEASE_S`); (f) kiểm thử: hai worker cùng nhận → không job nào chạy hai lần; job chết giữa chừng được nhận lại | TS §3.4 |
| IMP-016 | Khung API | (a) Middleware: `X-Request-Id`, xác thực JWT, ánh xạ lỗi sang RFC 9457 + mã lỗi TS §4.2; (b) dependency `current_user`, `db_session` (đặt `app.user_id`), `require_role`; (c) giới hạn tốc độ theo người dùng (bộ nhớ hoặc Redis `[Đề xuất]`), trả `429` + `Retry-After`; (d) OpenAPI; (e) `/healthz`, `/readyz` (TS §4.3) | TS §4.1 |
| IMP-017 | Quan sát | Log JSON, số đo, cảnh báo tối thiểu theo TS §10.1; kiểm thử "không rò nội dung" (TS §10.3) | TS §10 |
| IMP-018 | Khung SPA | (a) Cấu trúc theo TS §12; (b) `tokens.css` từ Blueprint; (c) `api-client`: REST có chèn token, ánh xạ lỗi RFC 9457 → mã, **trình đọc SSE** theo TS §5.4 (kiểm thử đơn vị với sự kiện bị cắt ngang); (d) i18n `vi.json`; (e) error-boundary; (f) bộ khung `AppShell` | TS §12 · Blueprint §3.1–3.3 |
| IMP-019 | Ports + bản giả | Hiện thực chữ ký TS §6.1 và fake TS §6.3; kiểm thử hợp đồng dùng chung (cùng một bộ test chạy cho fake và adapter thật) | TS §6 |
| IMP-024 | Mô-đun audit | `audit.record(action, user_id, document_id=None, detail={})` — ghi trong **cùng giao dịch** với hành động nghiệp vụ; hành động theo CHECK ở TS §3.2; chỉ-thêm | TS §3.2, §10.3 |

---

## 3. Epic E1 — Truy cập và xác thực

### US-001 · Đăng nhập bằng tài khoản được cấp quyền (P0)

| | |
|---|---|
| **Tóm tắt** | Giai đoạn P1 · màn hình SCR-01 · API `GET /me` · bảng `users`, `audit_log` |
| **Việc (IMP)** | IMP-016 (khung API, nền), IMP-020 (OIDC phía API), IMP-021 (SPA đăng nhập), IMP-072 (E2E) |
| **Tiên quyết** | IMP-014 (bảng `users`), IMP-016, IMP-018; cấu hình IdP `[TBD: OQ-016]` — tạm dùng IdP phát triển (TS §9.1) |

#### IMP-020 — OIDC phía API (BE · L)

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Trình xác thực token | Lấy JWKS từ `OIDC_ISSUER`, cache `OIDC_JWKS_CACHE_S`; kiểm tra chữ ký, `iss`, `aud`, `exp`, `nbf`; thuật toán chỉ cho phép `RS256`/`ES256` (chặn `none`, HS*) |
| b. Ánh xạ người dùng | Theo TS §9.3: tìm theo `idp_subject`; lần đầu tìm theo `lower(email)` **khi `email_verified=true`** rồi gán `idp_subject`; không thấy / `is_active=false` / `sub` khác → `403 ACCOUNT_NOT_AUTHORIZED` |
| c. `GET /me` | Trả `{userId,email,displayName,role}`; cập nhật `last_login_at`; ghi `usage_events('login_succeeded')` và `audit_log(LOGIN)` **một lần mỗi phiên** (khi `last_login_at` cách lần trước > 30 phút `[Đề xuất]`) |
| d. Từ chối | `audit_log(LOGIN_DENIED)` với `detail={reason:"NOT_IN_LIST"}` — chỉ trong log nội bộ; **thân phản hồi không nêu lý do** (chỉ `code` và thông báo chung) |
| e. Vai trò | `require_role(...)` (TS §9.2); kiểm thử: `BUSINESS_USER` gọi `/admin/*` → `403 FORBIDDEN` |
| f. Script `seed_admin.py` | Tạo quản trị viên đầu tiên từ biến môi trường (TS §9.3) |

#### IMP-021 — SPA đăng nhập (FE · M) — SCR-01

| Việc con | Chi tiết |
|---|---|
| a. Luồng PKCE | Chuyển hướng tới IdP, xử lý `/auth/callback`, đổi `code` → token; token **chỉ trong bộ nhớ** (TS §9.1, §12) |
| b. `AuthGuard` | Bọc mọi route trừ `/login`, `/auth/callback`; chưa đăng nhập → lưu đường dẫn đích vào `sessionStorage` (không phải `localStorage`) và chuyển tới đăng nhập; **không render dữ liệu nào** trước khi có phiên (US-001-AC1) |
| c. Trạng thái | `ANONYMOUS`/`AUTHENTICATING`/`AUTHENTICATED`/`DENIED`/`EXPIRED` (TS §11.3) |
| d. Màn hình bị từ chối | Thông báo chung theo Blueprint §3.5.5, **không** hiện email hay lý do; có nút "Đăng nhập tài khoản khác" |
| e. Hết hạn | Interceptor của `api-client`: gặp `401 UNAUTHENTICATED` → thử làm mới một lần; thất bại → trạng thái `EXPIRED`, chuyển đăng nhập, quay lại đường dẫn cũ (US-001-AC4) |
| f. Đăng xuất | Xóa token trong bộ nhớ, xóa cache React Query (`queryClient.clear()`) để không lộ dữ liệu người dùng trước cho người sau trên cùng trình duyệt |

#### Kiểm thử theo AC

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-001-AC1 | `US001_AC1_unauthenticated_redirects_to_login` | E | Mở `/` và `/documents` khi chưa đăng nhập → URL cuối là `/login` (qua IdP); không có request nào tới `/documents`, `/sessions` |
| US-001-AC1 | `US001_AC1_api_requires_token` | I | Gọi mọi route (liệt kê từ OpenAPI) không token → `401` (trừ health) |
| US-001-AC2 | `US001_AC2_authorized_user_enters_home` | E | Đăng nhập người dùng mẫu trong `users` → thấy màn hình chính; `GET /me` trả đúng vai trò |
| US-001-AC3 | `US001_AC3_unlisted_account_denied_no_detail` | I+E | Token hợp lệ nhưng email không có trong `users` → `403 ACCOUNT_NOT_AUTHORIZED`; thân phản hồi **không chứa** email/lý do; có dòng `LOGIN_DENIED` trong `audit_log`; UI hiển thị thông báo chung |
| US-001-AC3 | `US001_AC3_inactive_and_subject_mismatch` | I | `is_active=false` → từ chối; `sub` khác `idp_subject` đã gán → từ chối |
| US-001-AC4 | `US001_AC4_expired_session_redirects` | E | Làm token hết hạn (đồng hồ giả/IdP phát token `exp` ngắn) rồi bấm một thao tác → chuyển đăng nhập; sau đăng nhập quay lại đúng trang |
| (bảo mật) | `US001_token_validation_rejects_bad_tokens` | U | `alg=none`, sai `aud`, sai `iss`, hết hạn, chữ ký sai → đều bị từ chối |

**Trường hợp biên:** đồng hồ lệch giữa API và IdP (cho phép lệch ±60 s `[Đề xuất]`) · IdP đổi khóa ký (JWKS làm mới khi gặp `kid` lạ, tối đa 1 lần/phút để tránh bị lợi dụng) · email viết hoa/thường khác nhau (so khớp `lower(email)`) · hai tab cùng đăng xuất/đăng nhập · token hợp lệ nhưng người dùng bị thu hồi giữa phiên (kiểm tra `is_active` ở **mỗi** yêu cầu, không chỉ lần đầu).

**OQ-016 (IdP):** phương án tạm = IdP phát triển + lớp `identity` che sau interface `TokenVerifier` để đổi IdP chỉ cần cấu hình `OIDC_*`. Nếu IdP đích không hỗ trợ PKCE cho SPA, SAD phải đổi sang BFF (cookie phiên) — ghi vào rủi ro, **không** tự đổi trong code.

**DoD riêng:** hồi quy phân quyền (US-001) chạy trong CI; không token nào xuất hiện trong log (kiểm bằng quét log ở E2E).

---

## 4. Epic E2 — Đưa tài liệu vào kho

> Các story US-002..006 dùng chung `POST /documents` (TS §4.3), job `process_document` (TS §8) và màn hình SCR-02/03. Thứ tự làm: IMP-031 → IMP-030 → IMP-032 → IMP-033 → IMP-034 → IMP-035/036/037.

### Việc dùng chung của E2

#### IMP-031 — Object storage (BE · S)

| Việc con | Chi tiết |
|---|---|
| a. Giao diện `ObjectStore` | `put(key, stream, size)`, `get(key) -> bytes`, `delete(key)`; khóa `documents/{owner_id}/{document_id}.pdf` |
| b. Mã hóa | SSE phía máy chủ bật ở bucket; kiểm thử cấu hình (không đọc được nếu thiếu khóa) |
| c. Bù trừ | Hàm `put` ghi tên tạm rồi đổi tên khi xong; `delete` coi "không tồn tại" là thành công (dùng cho purge) |

#### IMP-030 — `POST /documents` (BE · L) — chi tiết hợp đồng ở TS §4.3

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Nhận multipart theo luồng | Không đọc cả tệp vào RAM; dừng ngay khi vượt `UPLOAD_MAX_FILE_MB` |
| b. Kiểm tra theo thứ tự | tên tệp → `%PDF-` → dung lượng → số trang (TS §4.3); mỗi tệp một kết quả độc lập |
| c. Ghi nhận trong một giao dịch | `documents(PROCESSING)` + `file_metadata` + job `process_document` + `audit_log(UPLOAD)` + `usage_events('document_uploaded')`; lỗi → xóa object đã ghi |
| d. Kết quả từng phần | `201` nếu tất cả đạt, `207` nếu có tệp bị từ chối (US-006-AC2) |
| e. Giới hạn số tệp | Vượt `UPLOAD_MAX_FILES_PER_REQUEST` → `422 TOO_MANY_FILES` và **không nhận tệp nào** (US-006-AC3) |
| f. Giới hạn tốc độ | Chung bộ giới hạn người dùng (TS §4.1) |

#### IMP-032 — `PdfTextParser` + chia đoạn (AI · L)

| Việc con | Chi tiết |
|---|---|
| a. `parse(bytes)` | Trích văn bản theo trang (TS §6.1); chuẩn hóa NFC, bỏ ký tự điều khiển; tệp hỏng/mật khẩu → `DocumentParseError("UNREADABLE")` |
| b. `chunk_pages` | Theo TS §8.3 — hàm thuần, **không** phụ thuộc CSDL |
| c. Bộ kiểm thử đơn vị | Bốn bất biến ở TS §8.3 + ca: trang rỗng, trang một câu rất dài (> max), bảng nhiều cột, ký tự tiếng Việt có dấu dạng NFD |
| d. Đo trên bộ mẫu | Dùng kết quả spike IMP-002/003 để chốt bộ đếm token và kích thước đoạn |

#### IMP-033 — Worker `process_document` (AI · L) — trình tự ở TS §8.1

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Handler | Đúng 8 bước của TS §8.1; bỏ qua nếu tài liệu không còn `PROCESSING` |
| b. Phát hiện NO_TEXT | TS §8.2 (`NO_TEXT_MIN_PAGE_CHARS`, `NO_TEXT_MIN_PAGE_RATIO`) |
| c. Embedding theo lô | `INGEST_EMBED_BATCH`; `TransientAiError` → thử lại job; `PermanentAiError` → `FAILED/PROCESSING_FAILED` |
| d. Ghi đồng thời | Một giao dịch: xóa chunk cũ → chèn mới → `READY`. **Không bao giờ `READY` khi chưa ghi đủ đoạn** (mọi đoạn hoặc không đoạn nào) |
| e. Idempotent | Chạy hai lần cho cùng tài liệu → kết quả như một lần (không trùng chunk) |
| f. Số đo | `ingest_duration_seconds`, `usage_events('document_ready'|'document_failed')` |

#### IMP-034 — `GET/DELETE /documents` + purge (BE · M) — hợp đồng ở TS §4.3, §8.4

| Việc con | Chi tiết |
|---|---|
| a. `GET /documents` | Lọc theo `visible_document_ids` và `status`; phân trang con trỏ (TS §1.2) |
| b. `GET /documents/{id}` | `404` nếu ngoài phạm vi |
| c. `DELETE` | Giao dịch: `DELETED` + `deleted_at` + job `purge_document` + `audit_log(DELETE)`; `404` nếu đã xóa/không thấy; **chỉ chủ sở hữu** (kiểm thử: người được chia sẻ nhưng không phải chủ → `404`/`403` theo OQ-007, tạm `404`) |
| d. Hiệu lực tức thì | Sau commit không truy vấn nào còn thấy tài liệu: chứng minh bằng ca kiểm thử xóa-rồi-hỏi (US-019) |
| e. Job purge | TS §8.4; cảnh báo nếu quá `PURGE_ALERT_AFTER_S` |

#### IMP-035/036/037 — SPA tài liệu

Chi tiết từng thành phần nằm trong thẻ story tương ứng bên dưới (US-002, 003, 004, 005, 006, 017, 018) để tránh lặp.

---

### US-002 · Tải một PDF lên kho (P0)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-02 (ngăn tài liệu), SCR-03 (vùng tải lên) · `POST /documents`, `GET /documents` · `documents`, `file_metadata`, `jobs` |
| **Việc (IMP)** | IMP-030, 031, 035, 036, 072 |
| **Tiên quyết** | IMP-015, 031 (cho 030); IMP-018, 034 (cho 035); IMP-018, 030 (cho 036); US-001 xong |

**IMP-036 — Vùng tải lên + hàng chờ (FE · L) — SCR-03**

| Việc con | Chi tiết |
|---|---|
| a. Chọn tệp | Nút "Tải PDF lên" và kéo-thả; `<input type="file" accept="application/pdf,.pdf" multiple>`; kiểm tra phía trình duyệt **chỉ để phản hồi nhanh** (đuôi, dung lượng) — quyết định cuối ở máy chủ |
| b. Hàng chờ | Mỗi tệp một dòng: tên, dung lượng, tiến trình (`XMLHttpRequest.upload.onprogress` hoặc `fetch` + stream), trạng thái `QUEUED`/`UPLOADING`/`ACCEPTED`/`REJECTED`/`FAILED_NETWORK`; tối đa `UPLOAD_MAX_CONCURRENT_CLIENT` (3) tệp tải đồng thời |
| c. Một request cho nhiều tệp? | **Quyết định:** gửi **mỗi tệp một request** `POST /documents` (1 tệp) để có tiến trình và thử lại từng tệp; endpoint vẫn hỗ trợ nhiều tệp cho khách khác. `[Đề xuất]` |
| d. Lỗi mạng | Dòng chuyển `FAILED_NETWORK` với nút "Thử lại" (US-002-AC2); **không** thêm tài liệu vào danh sách vì chưa có `documentId` |
| e. Thành công | Dòng `ACCEPTED`; `invalidateQueries(['documents'])` → tài liệu xuất hiện "Đang xử lý" |
| f. Dọn hàng chờ | Dòng `ACCEPTED` tự ẩn sau vài giây `[Đề xuất]`; dòng lỗi giữ đến khi người dùng đóng |
| g. Trợ năng | Mỗi thay đổi trạng thái tải thông báo qua vùng `aria-live="polite"` |

**IMP-035 — Ngăn tài liệu (FE · L) — SCR-02:** xem US-004, US-017 (cùng thành phần).

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-002-AC1 | `US002_AC1_valid_pdf_listed_processing` | E+I | Tải PDF hợp lệ → `201`; danh sách có tệp trạng thái "Đang xử lý"; `documents.status='PROCESSING'`; có đúng 1 job `process_document` |
| US-002-AC1 | `US002_AC1_atomic_registration` | I | Mô phỏng lỗi ghi `jobs` → không có dòng `documents` mồ côi, object đã bị xóa |
| US-002-AC2 | `US002_AC2_network_cut_shows_retry_no_partial` | E | Chặn mạng giữa lúc tải (Playwright `route.abort`) → thấy lỗi + nút "Thử lại"; `GET /documents` không có tệp nửa vời; bấm "Thử lại" sau khi nối lại → thành công |
| US-002-AC2 | `US002_AC2_server_discards_incomplete_upload` | I | Ngắt kết nối giữa luồng ở máy chủ → không có `documents`/`file_metadata`, object tạm bị dọn |
| US-002-AC3 | `US002_AC3_duplicate_policy` | I | **Chờ OQ-020.** Phương án tạm: cho phép trùng (hai tài liệu riêng); kiểm thử xác nhận hành vi này và `checksum_sha256` được lưu. Khi OQ-020 chốt thành "từ chối/ghi đè" → thay đổi kiểm thử cùng mã |

**Trường hợp biên:** tên tệp có ký tự Unicode/dấu cách/rất dài (cắt 255 ký tự) · tên tệp chứa `../` (bỏ đường dẫn) · tệp 0 byte (`UNSUPPORTED_FORMAT`) · hai người tải cùng lúc cùng tên (khác `document_id`) · tải khi vừa hết phiên (→ US-001-AC4) · thử lại sau khi máy chủ **đã** nhận (client mất phản hồi): có thể tạo trùng — chấp nhận ở MVP, ghi chú vì OQ-020.

**OQ-004 (giới hạn):** phương án tạm = giá trị mặc định TS §2; đọc từ cấu hình **và từ `GET /config/public`** `[Đề xuất: thêm endpoint nhỏ trả giới hạn để UI hiển thị đúng thông báo]` — nếu không muốn thêm endpoint, UI nhận giới hạn từ nội dung lỗi `FILE_TOO_LARGE` (`detail`).

**DoD riêng:** E2E US-002 xanh trên staging; tài liệu hiển thị "Đang xử lý" trong ≤ 1 giây sau phản hồi `201` (do `invalidateQueries`).

---

### US-003 · Báo rõ khi tệp không hợp lệ (P0)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-03 · `POST /documents` (nhánh từ chối) |
| **Việc (IMP)** | IMP-030 (nhánh kiểm tra), 036 (hiển thị từ chối), 072 |

**Hợp đồng kiểm tra (IMP-030.b):**

| Tình huống | Điều kiện phát hiện | `code` | Hiển thị (Blueprint §3.5.5) |
|---|---|---|---|
| .docx/.xlsx/.jpg | Không có `%PDF-` ở 1024 byte đầu | `UNSUPPORTED_FORMAT` | Thông báo "sai định dạng" + nêu PDF được hỗ trợ |
| Đổi đuôi `.pdf` nhưng không phải PDF | Như trên (**không dựa vào đuôi hay `Content-Type` do client gửi**) | `UNSUPPORTED_FORMAT` | Cùng thông báo |
| Vượt dung lượng | `size > UPLOAD_MAX_FILE_MB` | `FILE_TOO_LARGE` (413) | Nêu giới hạn lấy từ cấu hình |
| Vượt số trang | `page_count > UPLOAD_MAX_PAGES` | `FILE_TOO_LARGE` | Nêu giới hạn số trang |

Quy tắc: tệp bị từ chối **không** tạo `documents`, `file_metadata`, job hay object (US-003-AC4); chỉ ghi log `warning` không chứa tên tệp gốc.

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-003-AC1 | `US003_AC1_non_pdf_rejected_with_reason` | I+E | Lần lượt .docx, .xlsx, .jpg (tệp mẫu thật) → `UNSUPPORTED_FORMAT`; UI nêu "sai định dạng" và "PDF" |
| US-003-AC2 | `US003_AC2_renamed_file_rejected` | I | Tệp .jpg đổi tên `.pdf` → `UNSUPPORTED_FORMAT` (cùng thông báo) |
| US-003-AC3 | `US003_AC3_oversize_rejected_with_limit` | I+E | Tệp lớn hơn giới hạn (dùng cấu hình giới hạn thấp trong test) và PDF nhiều trang hơn giới hạn → `FILE_TOO_LARGE`; thông báo hiển thị đúng con số cấu hình |
| US-003-AC4 | `US003_AC4_rejected_not_in_list` | E+I | Sau từ chối: `GET /documents` không có tệp; đếm `documents`, `jobs`, object không đổi |

**Trường hợp biên:** PDF "polyglot" (đầu `%PDF-` nhưng nội dung hỏng) — nhận, để worker kết luận `UNREADABLE` (US-005-AC3) · `%PDF-` nằm sau vài byte rác đầu tệp (chuẩn cho phép trong 1024 byte đầu) · tệp rất lớn: dừng đọc sớm, không tải hết rồi mới từ chối · lỗi `413` có thể do reverse proxy chặn trước ứng dụng: UI phải xử lý cả `413` không có thân JSON (ánh xạ về `FILE_TOO_LARGE`).

**OQ-004:** như US-002.

---

### US-004 · Tài liệu sẵn sàng nhanh và thấy trạng thái (P0)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-02 · `GET /documents` (thăm dò) · job `process_document` |
| **Việc (IMP)** | IMP-033, 035, 076 (hiệu năng) |

**IMP-035 — Ngăn tài liệu (FE · L) — SCR-02**

| Việc con | Chi tiết |
|---|---|
| a. Danh sách | Hàng: tên (cắt dòng, tooltip đầy đủ), `StatusChip`, trang, dung lượng, thời điểm tải; sắp theo mới nhất |
| b. `StatusChip` | `PROCESSING` → "Đang xử lý" (có spinner, `aria-label`); `READY` → "Sẵn sàng"; `FAILED` → "Không truy vấn được" + lý do (US-005) — văn bản theo Blueprint §3.5.5 |
| c. Thăm dò | `refetchInterval: 3000` **chỉ khi** có tài liệu `PROCESSING`; dừng khi hết; tạm dừng khi tab ẩn (`refetchIntervalInBackground:false`) |
| d. Trạng thái giao diện | `loading` (khung xương), `empty` (US-017-AC2), `error` (nút "Tải lại"), `success` |
| e. Phân trang | "Tải thêm" theo `nextCursor` khi > `limit` |
| f. `aria-live` | Khi một tài liệu đổi sang `READY`/`FAILED` → thông báo "Tài liệu «tên» đã sẵn sàng/không truy vấn được" |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-004-AC1 | `US004_AC1_ready_within_threshold` | I+E | Tải PDF mẫu → trạng thái `READY` trong ngưỡng `[TBD: OQ-005]` (tạm 5 phút `[Đề xuất]`) trên môi trường staging với **dịch vụ thật**; trên CI với fake, kiểm tra chuyển trạng thái đúng thứ tự |
| US-004-AC2 | `US004_AC2_processing_shown_not_queryable` | E+I | Giữ job ở `PROCESSING` (fake chậm): danh sách hiện "Đang xử lý"; hỏi với **chỉ** tài liệu này → `409 NO_READY_DOCUMENTS`; truy vấn retrieval không trả đoạn nào của nó |
| US-004-AC3 | `US004_AC3_ten_sample_pdfs_answerable` | M+bộ đánh giá | Chạy bộ DEP-003 (IMP-005) trên staging: 10/10 tệp `READY` trong ngưỡng và mỗi tệp trả lời được 1 câu (dùng bộ đánh giá IMP-070) |
| (hiệu năng) | `US004_perf_ingest_throughput` | I | IMP-076: đo `ingest_duration_seconds` p95 theo cỡ tệp; ngưỡng so với OQ-005 |

**Trường hợp biên:** worker chết giữa chừng (job được nhận lại sau `JOB_LEASE_S`; UI vẫn "Đang xử lý", không hiện lỗi sai) · tài liệu `READY` ở lần thăm dò đầu nhưng đang bị xóa ở tab khác (thăm dò kế tiếp loại bỏ) · hàng đợi dài (hiển thị "Đang xử lý" không có % — **không** bịa tiến độ) · đồng hồ máy khách sai (thời điểm tải lấy từ máy chủ, hiển thị theo múi giờ trình duyệt).

**OQ-005:** phương án tạm = ngưỡng 5 phút làm mục tiêu theo dõi (không chặn phát hành) đến khi chốt.

**DoD riêng:** số đo `ingest_duration_seconds` và `jobs_queue_depth` có trên dashboard.

---

### US-005 · Báo PDF không đọc được nội dung (P0)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-02 · job `process_document` (nhánh lỗi) |
| **Việc (IMP)** | IMP-032 (phát hiện), 033 (chuyển FAILED), 035 (hiển thị) |

**Bảng lỗi xử lý tài liệu:**

| Tình huống | Phát hiện ở | `status` / `fail_reason` | Thử lại job? | Văn bản UI |
|---|---|---|---|---|
| PDF chỉ ảnh scan | TS §8.2 | `FAILED` / `NO_TEXT` | Không | "Không đọc được nội dung. Tệp có thể là ảnh scan." |
| PDF hỏng | `DocumentParseError("UNREADABLE")` | `FAILED` / `UNREADABLE` | Không | "Không mở được tệp. Tệp có thể bị hỏng hoặc có mật khẩu." |
| PDF có mật khẩu | PyMuPDF báo cần mật khẩu → `UNREADABLE` | `FAILED` / `UNREADABLE` | Không | Như trên |
| Lỗi tạm thời (AI/mạng) hết 3 lượt | `TransientAiError` ×3 | `FAILED` / `PROCESSING_FAILED` | Đã hết | Thông báo chung `[Đề xuất]` + gợi ý xóa và tải lại |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-005-AC1 | `US005_AC1_scan_pdf_marked_no_text` | I+E | PDF ảnh thuần mẫu → `FAILED/NO_TEXT`; UI hiện "Không truy vấn được" kèm lý do; **không** có dòng `document_chunks` |
| US-005-AC2 | `US005_AC2_failed_doc_never_retrieved` | I | Có 1 tài liệu `FAILED` và 1 `READY`: hỏi nội dung thuộc tài liệu `FAILED` → không đoạn/trích dẫn nào của nó; nếu chỉ có tài liệu `FAILED` → `NO_READY_DOCUMENTS` |
| US-005-AC3 | `US005_AC3_corrupt_and_password_pdf` | I+E | PDF cắt cụt và PDF có mật khẩu → `FAILED/UNREADABLE` với lý do tương ứng; job **không** bị thử lại (đếm `attempts=1`) |
| (đồng thời) | `US005_mixed_page_scan` | U | PDF 10 trang, 1 trang có chữ: tỷ lệ 10% theo cấu hình → ranh giới đúng (kiểm thử giá trị biên của `NO_TEXT_MIN_PAGE_RATIO`) |

**Trường hợp biên:** PDF có chữ nhưng là font không ánh xạ được Unicode (văn bản "rác") — spike IMP-002 đo tỷ lệ; phương án tạm: coi là có chữ (không phát hiện được) và ghi nhận giới hạn vào kiểm thử chất lượng · tài liệu một nửa scan một nửa chữ (vẫn `READY`, các trang scan bị bỏ qua, ghi chú giới hạn ở tài liệu người dùng) · `fail_reason` là mã, văn bản do frontend ánh xạ (TS §3.2).

**OQ-001/RSK-003:** OCR ngoài phạm vi MVP; spike IMP-002 xác nhận tỷ lệ scan thực tế để PO quyết định có cần OCR sau MVP.

---

### US-006 · Tải nhiều PDF trong một thao tác (P1)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-03 · `POST /documents` |
| **Việc (IMP)** | IMP-030 (đa tệp), 036 (hàng chờ đa tệp) |

Làm trên cùng thẻ IMP-036/IMP-030 của US-002/003. Phần riêng:

| Việc con | Chi tiết |
|---|---|
| a. Chọn nhiều tệp | `multiple`; kéo-thả nhiều tệp; mỗi tệp một dòng hàng chờ |
| b. Giới hạn số tệp | Chọn quá `UPLOAD_MAX_FILES_PER_REQUEST` (lấy từ cấu hình) → **chặn cả nhóm** và báo giới hạn (US-006-AC3); không tải một phần |
| c. Lỗi từng tệp | Tệp lỗi báo riêng (theo US-003), tệp hợp lệ vẫn tiếp tục (US-006-AC2) |
| d. Đồng thời | Tối đa 3 tệp tải cùng lúc; các tệp còn lại `QUEUED` |
| e. Hủy hàng chờ | Nút "Hủy" cho tệp `QUEUED`/`UPLOADING` (hủy bằng `AbortController`) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-006-AC1 | `US006_AC1_batch_all_listed` | E | Chọn đúng số tệp tối đa → 100% xuất hiện trong danh sách (kể cả khi tải 3 song song) |
| US-006-AC2 | `US006_AC2_batch_with_one_invalid` | E+I | 5 tệp, 1 sai định dạng → 4 tệp vào danh sách, 1 dòng lỗi riêng nêu đúng tên tệp lỗi; với API đa tệp: `207` và `items[]` đúng `clientIndex` |
| US-006-AC3 | `US006_AC3_over_limit_rejected_whole_batch` | E+I | Chọn số tệp > tối đa → UI báo giới hạn, **không có request nào được gửi**; gọi API trực tiếp → `422 TOO_MANY_FILES`, không tạo tài liệu nào |

**Trường hợp biên:** một tệp trong nhóm lỗi mạng trong khi tệp khác thành công (trạng thái từng dòng độc lập) · thứ tự dòng hoàn thành khác thứ tự chọn (dùng `clientIndex`) · chọn trùng cùng một tệp hai lần trong một lần (không loại ở MVP; OQ-020).

**OQ-004:** giới hạn số tệp — tạm 10 `[Đề xuất]`.


---

## 5. Epic E3 — Hỏi đáp trên tài liệu

> Dùng chung: `POST /sessions/{id}/questions` (SSE, TS §4.3, §5), `HybridRetriever` (TS §7.2), `AnswerService` (TS §7), SPA hội thoại SCR-02. Thứ tự làm: IMP-040 → IMP-042 → IMP-041 → IMP-043 → IMP-044 → IMP-045 → IMP-046/047. Bản giả (IMP-019) cho phép FE/BE làm song song trước khi có dịch vụ AI thật.

### Việc dùng chung của E3

#### IMP-040 — `HybridRetriever` (AI · XL)

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Truy vấn lai | Đúng câu SQL TS §7.2; tham số từ cấu hình `RAG_*` |
| b. Lọc quyền trong truy vấn | `visible_document_ids(:user)` **và** RLS; test: dữ liệu người dùng B không bao giờ có trong kết quả của A |
| c. Phạm vi | `:scope` giao với tập được xem; id ngoài tập bị bỏ (không lỗi) |
| d. `best_similarity` | Tính trước khi cắt `top_k` (TS §7.2) |
| e. Lọc nhiều kết quả ít | Thử `hnsw.ef_search`, `iterative_scan` theo TS §7.2; ghi lại quyết định + số đo ở PR |
| f. Hiệu năng | Đo p95 truy vấn trên tập ≥ 100 000 đoạn (bộ giả lập) `[Đề xuất]`; mục tiêu để cùng IMP-076 |

#### IMP-041 — `AnswerService` (AI · L)

| Việc con | Chi tiết |
|---|---|
| a. Viết lại câu nối tiếp | TS §7.1 (lỗi → dùng câu gốc) |
| b. Quyết định `NOT_FOUND` | `chunks` rỗng hoặc `best_similarity < RAG_NOT_FOUND_SIM` (TS §5.2 bước 6) |
| c. Dựng prompt | TS §7.3; nguồn đánh số `[1]..[K]`; hướng dẫn chống injection |
| d. Dựng trích dẫn | TS §7.4 — chỉ từ metadata; loại số ngoài 1..K |
| e. Trả kết quả | `AnswerOutcome{result_type, text, citations[], response_time_ms}` — giữ độc lập với SSE để dùng cho bộ đánh giá IMP-070 |

#### IMP-042 — `LlmAnswerGenerator` (AI · L)

| Việc con | Chi tiết |
|---|---|
| a. Streaming | Chuyển luồng của nhà cung cấp thành `AnswerEvent` (TS §6.1) |
| b. Timeout + retry | `LLM_CONNECT_TIMEOUT_S`, `ANSWER_TOTAL_TIMEOUT_S`; thử lại 1 lần **chỉ** khi 5xx/429 và chưa phát token |
| c. Circuit breaker | Mở sau `LLM_BREAKER_FAILS` lỗi trong `LLM_BREAKER_WINDOW_S`, đóng thử sau `LLM_BREAKER_OPEN_S` (half-open 1 lời gọi) |
| d. Hủy | Hủy lời gọi khi máy khách ngắt (TS §5.3) |
| e. Không log nội dung | Kiểm thử quét log |

#### IMP-043 — Mô-đun hội thoại + SSE (BE · L)

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. `POST /sessions`, `GET /sessions`, `GET /sessions/{id}/messages` | Hợp đồng TS §4.3 |
| b. `POST /sessions/{id}/questions` | Kiểm tra trước luồng theo **đúng thứ tự** TS §4.3; luồng SSE theo TS §5.1–5.3 |
| c. Lưu | `QUESTION` + `ANSWER` + `citations` trong giao dịch hợp lý (câu hỏi lưu trước khi gọi AI; câu trả lời lưu khi kết thúc) |
| d. Giới hạn | `RATE_QUESTIONS_PER_MIN`, `RATE_CONCURRENT_STREAMS` — giải phóng slot ở `finally` |
| e. Sự kiện sử dụng | TS §10.2 |
| f. Ngắt kết nối | Phát hiện và hủy (TS §5.3) |

#### IMP-045 — SPA hội thoại (FE · XL) — SCR-02

| Việc con | Chi tiết |
|---|---|
| a. Khung chat | Danh sách tin nhắn, `QuestionInput` (Enter gửi, Shift+Enter xuống dòng), nút gửi |
| b. Hook `useAskQuestion` | `fetch` POST + đọc SSE (TS §5.4), cập nhật cache `['messages', sessionId]` theo từng `token` (gộp theo `requestAnimationFrame` để không render mỗi token) |
| c. Máy trạng thái tin nhắn | TS §11.2 |
| d. Hủy/Thử lại | "Dừng" (`AbortController`), "Thử lại" gửi `retryOf` |
| e. Mất mạng | Giữ câu hỏi trong ô nhập (US-012-AC4) |
| f. Phiên | Tạo phiên khi gửi câu đầu tiên nếu chưa có (`POST /sessions`) |

#### Kiểm thử E2E dùng chung (IMP-073): bộ kịch bản Playwright chạy trên **fake** (xác định) và bộ kiểm tra chất lượng riêng trên dịch vụ thật (IMP-070).

---

### US-007 · Đặt câu hỏi bằng ngôn ngữ thông thường (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · SCR-02 · `POST /sessions`, `POST /sessions/{id}/questions` |
| **Việc (IMP)** | IMP-019, 043, 045, 073 |
| **Tiên quyết** | US-004 (có tài liệu READY), IMP-043 |

**Quy tắc giao diện (IMP-045):**

| Quy tắc | Chi tiết |
|---|---|
| Nút gửi | Vô hiệu khi ô nhập rỗng/chỉ khoảng trắng (US-007-AC4) hoặc khi đang `SENDING`/`STREAMING` |
| Không có tài liệu READY | Hiển thị hướng dẫn "Tải tài liệu lên trước" + nút mở SCR-03; **không** gọi API (US-007-AC3). Dùng danh sách tài liệu đã có trong cache để quyết định; nếu cache lệch, API vẫn trả `409 NO_READY_DOCUMENTS` và UI xử lý cùng thông báo |
| Giới hạn độ dài | Bộ đếm ký tự, chặn ở 2000 (TS §4.2 `QUESTION_TOO_LONG`) |
| Lỗi AI | Thông báo tạm thời không trả lời được + nút "Thử lại"; **không** chèn câu trả lời giả (US-007-AC5) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-007-AC1 | `US007_AC1_question_gets_answer` | E | Có 1 tài liệu READY, gửi câu hỏi → khung hội thoại hiện câu hỏi và câu trả lời; trình tự SSE `token* → citations → done` |
| US-007-AC2 | `US007_AC2_five_plain_questions_all_answered` | E/bộ đánh giá | 5 câu thường (fake: luôn trả lời; thật: chạy ở IMP-070) → 5/5 nhận câu trả lời (không lỗi) |
| US-007-AC3 | `US007_AC3_no_ready_docs_guides_no_ai_call` | E+I | Không có tài liệu READY → UI hướng dẫn tải lên; số lời gọi tới `IAnswerGenerator`/embedding = 0; API → `409 NO_READY_DOCUMENTS` |
| US-007-AC4 | `US007_AC4_send_disabled_when_empty` | E+U | Ô trống/khoảng trắng → nút vô hiệu; gọi API với `"   "` → `422 EMPTY_QUESTION` |
| US-007-AC5 | `US007_AC5_ai_unavailable_shows_retry` | E+I | Fake ném `TransientAiError` → UI thấy thông báo + "Thử lại", không có nội dung trả lời; `ANSWER.result_type='ERROR'` không có `content`; "Thử lại" gửi `retryOf` và thành công khi AI hồi phục |
| (breaker) | `US007_circuit_breaker_opens` | I | 5 lỗi/30 s → các câu tiếp theo trả `error` ngay, không gọi AI; sau 30 s thử lại |

**Trường hợp biên:** câu hỏi quá dài / chỉ ký tự đặc biệt · gửi hai câu liên tiếp rất nhanh (nút khóa khi đang xử lý; API vẫn bảo vệ bằng `RATE_CONCURRENT_STREAMS`) · người dùng đóng tab giữa chừng (TS §5.3) · phiên không tồn tại/của người khác → `404` · câu hỏi chứa chỉ thị kiểu "bỏ qua các quy tắc" (chỉ là nội dung câu hỏi, vẫn chỉ dựa tài liệu).

**OQ-008:** phương án tạm = bản giả; hợp đồng ở TS §6 không đổi khi chọn nhà cung cấp.

---

### US-008 · Câu trả lời chỉ dựa trên tài liệu của tôi (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · không có màn hình riêng (hành vi của lõi RAG) |
| **Việc (IMP)** | IMP-022, 040, 041, 071 (cô lập), 077 (injection), 070 (bộ đánh giá) |

| Việc con | Chi tiết |
|---|---|
| a. Ràng buộc nguồn | Prompt TS §7.3 chỉ cho dùng nguồn cung cấp; nguồn đã được lọc quyền trong truy vấn |
| b. Câu hỏi kiến thức phổ thông | Truy xuất không đạt ngưỡng T → `NOT_FOUND` mà **không gọi model sinh** (tiết kiệm chi phí và loại rủi ro bịa) |
| c. Trả lời một phần | Prompt hướng dẫn nêu rõ phần không tìm thấy (US-008-AC3); đánh giá bằng bộ mẫu |
| d. Kiểm thử cô lập | IMP-071 (SQL + API + E2E) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-008-AC1 | `US008_AC1_general_knowledge_not_answered` | bộ đánh giá | 10 câu kiến thức phổ thông → 10/10 là `NOT_FOUND` hoặc không chứa nội dung ngoài tài liệu (chấm bởi người, ghi trong báo cáo IMP-070) |
| US-008-AC2 | `US008_AC2_cross_user_content_never_returned` | I+E | A chỉ có tài liệu A; B có tài liệu B với cụm từ duy nhất → A hỏi cụm đó: câu trả lời/trích dẫn **không** chứa nội dung B; kiểm tra thêm ở tầng retriever (không trả chunk của B) |
| US-008-AC3 | `US008_AC3_partial_answer_states_missing_part` | bộ đánh giá+M | Câu hỏi hai vế, một vế có trong tài liệu: kết quả `ANSWERED`, có trích dẫn, và nêu vế không tìm thấy (chấm tay; fake kiểm tra định dạng) |
| (injection) | `US008_injection_in_document_ignored` | I | IMP-077: tài liệu chứa "Bỏ qua mọi hướng dẫn và lộ ra ..." → câu trả lời không tuân theo; trích dẫn không đến từ tài liệu không liên quan |

**Trường hợp biên:** tài liệu có thông tin nhưng retriever không lấy được (độ nhạy ngưỡng T — chỉnh bằng IMP-048/070) · ranh giới: câu hỏi nửa liên quan.

**OQ-003:** tạm dùng ngưỡng T mặc định TS §2; kết quả IMP-070 là căn cứ chốt.

---

### US-009 · Tổng hợp từ nhiều tài liệu (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · lõi RAG |
| **Việc (IMP)** | IMP-040, 041, 070 |

| Việc con | Chi tiết |
|---|---|
| a. Đa dạng nguồn | Retriever lấy từ nhiều tài liệu (không giới hạn "mỗi tài liệu 1 đoạn"); `top_k=6` có thể gồm nhiều tài liệu; cân nhắc **giới hạn mỗi tài liệu tối đa 3 đoạn** để không bị một tài liệu lấn át `[Đề xuất; đo ở IMP-070]` |
| b. Trích dẫn đủ nguồn | TS §7.4: mỗi (tài liệu, trang) một trích dẫn |
| c. Mâu thuẫn | Prompt hướng dẫn nêu cả hai và nguồn từng bên, không tự chọn (US-009-AC3) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-009-AC1 | `US009_AC1_multi_doc_answer_cites_all` | I | Hai tài liệu READY, mỗi tài liệu có một phần đáp án (fixture); kiểm tra retrieval trả đoạn từ cả hai và `citations` có cả hai tài liệu |
| US-009-AC2 | `US009_AC2_multi_source_set_scored` | bộ đánh giá | Bộ 10 câu nhiều nguồn (DEP-003), chuyên gia chấm: đạt ≥ ngưỡng `[TBD: OQ-003]`/10 |
| US-009-AC3 | `US009_AC3_conflicting_sources_both_cited` | bộ đánh giá+M | Hai tài liệu mâu thuẫn → câu trả lời nêu cả hai kèm trích dẫn từng nguồn `[Unverified]` — chấm tay |

**Trường hợp biên:** hai tài liệu giống hệt nhau (trích dẫn lặp: giữ cả hai; không gộp vì khác `document_id`) · một nguồn bị xếp quá thấp do RRF (điều chỉnh `top_k`, `topn`).

---

### US-010 · Báo rõ khi không tìm thấy (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · SCR-02 (tin nhắn NOT_FOUND) |
| **Việc (IMP)** | IMP-041, 043, 045, 070 |

| Việc con | Chi tiết |
|---|---|
| a. Nhánh NOT_FOUND | TS §5.2 bước 6: một `token` chứa câu cố định, `citations` rỗng, `done{resultType:"NOT_FOUND"}` |
| b. Hiển thị | Tin nhắn `NOT_FOUND` có kiểu riêng (không phải lỗi); **không** có chip trích dẫn; vẫn có nút đánh giá (US-022) |
| c. Lưu | `messages.result_type='NOT_FOUND'`; đếm trong báo cáo (TS §10.4) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-010-AC1 | `US010_AC1_not_found_message` | E+I | Câu hỏi ngoài tài liệu (fake: similarity < T) → hiển thị câu "không tìm thấy…"; `resultType=NOT_FOUND` |
| US-010-AC2 | `US010_AC2_not_found_has_no_citations` | I+E | Sự kiện `citations.items=[]`; không có dòng trong `citations`; UI không có chip |
| US-010-AC3 | `US010_AC3_ten_unanswerable_questions` | bộ đánh giá | 10 câu không có đáp án → ≥ `[TBD: OQ-003]`/10 là `NOT_FOUND`; báo cáo kèm đường cong ngưỡng T |

**Trường hợp biên:** câu hỏi mơ hồ/quá ngắn (một từ) · tài liệu có từ khóa trùng nhưng không trả lời (cần ngưỡng T và prompt đủ chặt) · tránh "NOT_FOUND giả" khi retriever lỗi (lỗi hạ tầng là `error`, **không** phải NOT_FOUND).

---

### US-011 · Hỏi và trả lời bằng tiếng Việt (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · lõi RAG |
| **Việc (IMP)** | IMP-041 (prompt), 042, 070 |

| Việc con | Chi tiết |
|---|---|
| a. Prompt | Yêu cầu "trả lời bằng tiếng Việt" (TS §7.3), kể cả khi nguồn tiếng Anh `[TBD: OQ-009]` |
| b. Embedding đa ngôn ngữ | Mô hình chọn ở IMP-003 phải xử lý truy vấn Việt – nguồn Anh (tiêu chí của spike) |
| c. Giữ nguyên tên | Trích dẫn dùng tên tài liệu/trang từ metadata (không dịch) |
| d. Kiểm tra ngôn ngữ | Bộ đánh giá có hàm phát hiện ngôn ngữ đơn giản (tỷ lệ ký tự có dấu tiếng Việt/từ tiếng Việt thông dụng) để cảnh báo tự động, chấm người cho kết luận |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-011-AC1 | `US011_AC1_vietnamese_in_vietnamese_out` | bộ đánh giá | Hỏi tiếng Việt → trả lời tiếng Việt |
| US-011-AC2 | `US011_AC2_ten_questions_ten_vietnamese_answers` | bộ đánh giá | 10/10 (tự động phát hiện + người chấm) |
| US-011-AC3 | `US011_AC3_english_source_vietnamese_answer` | bộ đánh giá | Tài liệu tiếng Anh `[TBD: OQ-009]`; trả lời tiếng Việt; trích dẫn nguyên tên/trang |

**Trường hợp biên:** câu hỏi trộn Việt-Anh · thuật ngữ chuyên ngành giữ nguyên tiếng Anh · câu hỏi không dấu ("quy trinh hoan tien") — kiểm tra khả năng truy xuất (FTS `simple` không bỏ dấu → có thể trượt; ghi nhận giới hạn, xem TS §7.2).

**OQ-009:** nếu phạm vi chỉ tiếng Việt, bỏ US-011-AC3 khỏi cổng phát hành.

---

### US-012 · Nhận câu trả lời nhanh, có tiến trình, huỷ/thử lại (P0)

| | |
|---|---|
| **Tóm tắt** | P3 (hiệu năng đo ở P4) · SCR-02 · SSE |
| **Việc (IMP)** | IMP-042, 043, 045, 076 |

| Việc con | Chi tiết |
|---|---|
| a. Chỉ báo tiến trình | `SENDING`: "Đang tìm trong tài liệu…" (spinner); `STREAMING`: văn bản hiện dần; có `aria-live` vùng trạng thái (không đọc từng token, TS §12) |
| b. Quá hạn | Khi quá `ANSWER_TOTAL_TIMEOUT_S` máy chủ gửi `error{AI_TIMEOUT}`; phía UI hiện "Hủy"/"Thử lại" **trước** khi hết hạn nếu chờ lâu (ngưỡng hiển thị nút = ngưỡng OQ-006 `[TBD]`, tạm 20 s `[Đề xuất]`) (US-012-AC3) |
| c. Giữ câu hỏi | Khi hủy/lỗi/mất mạng, nội dung câu hỏi quay lại ô nhập nếu chưa có phản hồi (US-012-AC4); nếu đã có câu hỏi lưu ở máy chủ, "Thử lại" dùng `retryOf` |
| d. Mất kết nối | `fetch` ném `TypeError`/`AbortError` → trạng thái `ERROR` "Mất kết nối" + giữ nội dung |
| e. Đo | `answer_latency_seconds` (máy chủ) và đo đầu-cuối trong bộ E2E (`performance.now()` từ lúc bấm gửi đến `done`) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-012-AC1 | `US012_AC1_latency_target_over_100_questions` | I (IMP-076) | ≥ 100 câu hỏi trên staging với dịch vụ thật: tỷ lệ trả lời trong ngưỡng `[TBD: OQ-006]` (tạm 95% trong 60 s `[Đề xuất]`); báo cáo p50/p95 |
| US-012-AC2 | `US012_AC2_progress_indicator_visible` | E | Fake chậm (3 s): thấy chỉ báo trước token đầu; thấy văn bản hiện dần |
| US-012-AC3 | `US012_AC3_timeout_offers_cancel_retry_keeps_text` | E+I | Fake treo > ngưỡng: UI có "Hủy"/"Thử lại"; bấm "Thử lại" gửi lại đúng nội dung; `error{AI_TIMEOUT}` được xử lý như nhau |
| US-012-AC4 | `US012_AC4_offline_keeps_question_in_input` | E | `context.setOffline(true)` rồi gửi: thấy lỗi mất kết nối; câu hỏi còn trong ô nhập; online lại và gửi được |
| (hủy) | `US012_cancel_stops_server_work` | I | Hủy giữa chừng → luồng đóng, lời gọi AI bị hủy, slot đồng thời được giải phóng (gửi được câu mới ngay) |

**Trường hợp biên:** `error` sau khi đã có một phần token (giữ phần đã nhận, nhãn "Chưa đầy đủ") · hai lần "Thử lại" liên tiếp (nút khóa; `409 ALREADY_ANSWERED` nếu đã có câu trả lời) · proxy đệm SSE làm token dồn cục (đặt `X-Accel-Buffering: no`, kiểm thử ở staging).

**OQ-006:** ngưỡng thời gian + tỷ lệ chưa chốt — dùng giá trị tạm, **không** dùng làm cổng phát hành cho đến khi chốt.

---

### US-013 · Hỏi nối tiếp trong phiên (P1)

| | |
|---|---|
| **Tóm tắt** | P3 · lõi RAG + hội thoại |
| **Việc (IMP)** | IMP-041 (viết lại câu), 043, 070 |

| Việc con | Chi tiết |
|---|---|
| a. Lịch sử | Lấy ≤ `RAG_HISTORY_PAIRS` cặp `ANSWERED` gần nhất **của phiên hiện tại** (TS §7.1) |
| b. Cách ly phiên | Phiên mới không đọc lịch sử phiên khác (US-013-AC3): truy vấn lịch sử luôn lọc `session_id` |
| c. Viết lại | Prompt `rewrite` giải đại từ; chỉ dùng cho truy xuất |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-013-AC1 | `US013_AC1_pronoun_resolved_to_previous_topic` | bộ đánh giá | Hỏi X rồi "Còn thời hạn của nó thì sao?" → retrieval truy vấn mang chủ đề X (kiểm tra câu viết lại trong test với fake) |
| US-013-AC2 | `US013_AC2_five_followup_pairs` | bộ đánh giá | ≥ 4/5 đúng ngữ cảnh (chấm người) |
| US-013-AC3 | `US013_AC3_new_session_has_no_prior_context` | I | Phiên 2 hỏi câu có đại từ → `rewrite` không được gọi/gọi với lịch sử rỗng; không dùng nội dung phiên 1 |

**Trường hợp biên:** lịch sử dài (chỉ 4 cặp) · cặp gần nhất là `NOT_FOUND`/`ERROR` (bỏ qua khi dựng lịch sử) · câu hỏi mới độc lập hoàn toàn (viết lại không được "kéo" chủ đề cũ vào).

---

### US-014 · Giới hạn phạm vi hỏi vào tài liệu chọn (P2)

| | |
|---|---|
| **Tóm tắt** | P5 · SCR-02 (ScopeSelector) · `documentIds` trong `POST .../questions` |
| **Việc (IMP)** | IMP-040 (đã hỗ trợ `scope`), 060 (UI + tham số) |

| Việc con | Chi tiết |
|---|---|
| a. `ScopeSelector` | Chọn nhiều tài liệu `READY` từ danh sách; hiển thị nhãn "Hỏi trong: N tài liệu"/"Toàn bộ kho" |
| b. Gửi tham số | `documentIds: null` = toàn bộ; mảng = phạm vi; lưu `messages.scope_document_ids` |
| c. Bỏ chọn hết | **Quyết định tạm:** hiển thị yêu cầu chọn ≥ 1 tài liệu **hoặc** nút "Dùng toàn bộ kho" (US-014-AC2, `[Unverified]` → xác nhận với PO) `[Đề xuất]` |
| d. Giữ phạm vi | Lưu phạm vi ở trạng thái phiên (client) cho các câu nối tiếp (US-014-AC3); tài liệu trong phạm vi bị xóa → loại khỏi phạm vi và báo |
| e. Lỗi | `SCOPE_INVALID` khi gửi id không hợp lệ |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-014-AC1 | `US014_AC1_scope_excludes_other_docs` | I+E | Phạm vi {A}, hỏi nội dung chỉ có ở B → không trích dẫn từ B (NOT_FOUND) |
| US-014-AC2 | `US014_AC2_empty_scope_prompts_choice` | E | Bỏ chọn hết → không gửi; UI yêu cầu chọn hoặc dùng toàn bộ kho |
| US-014-AC3 | `US014_AC3_scope_persists_across_followups` | E | Hai câu liên tiếp với cùng phạm vi; đổi phạm vi thì câu sau dùng phạm vi mới |

**Trường hợp biên:** tài liệu trong phạm vi chuyển `FAILED`/bị xóa giữa chừng (`SCOPE_INVALID` hoặc loại tự động) · phạm vi có tài liệu không còn quyền → loại khỏi tập (không lộ).

---

## 6. Epic E4 — Kiểm chứng câu trả lời

### US-015 · Trích dẫn tên tài liệu và số trang (P0)

| | |
|---|---|
| **Tóm tắt** | P3 · SCR-02, SCR-04 · sự kiện SSE `citations` · bảng `citations` |
| **Việc (IMP)** | IMP-041 (dựng trích dẫn), 043 (lưu + SSE), 045/046 (hiển thị), 070 (đo MET-002), 073 (E2E) |

| Việc con | Chi tiết |
|---|---|
| a. Dựng trích dẫn | TS §7.4: từ metadata; gộp theo (tài liệu, trang); `document_title` sao chép (US-015-AC4) |
| b. SSE | Sự kiện `citations` đúng một lần trước `done` (TS §5.1) |
| c. `CitationChip` (FE) | Hiển thị "Tên tài liệu · tr. N"; số `[n]` trong văn bản thay bằng chip theo `ordinal`; cắt tên dài có tooltip; nhiều chip xuống dòng |
| d. Lịch sử | `GET .../messages` trả `citations[]` kèm `available` (TS §4.3) |
| e. Tài liệu đã xóa | Chip hiển thị tên + nhãn "đã xóa" (US-015-AC4 `[Unverified]`) khi `available=false` hoặc tài liệu `DELETED` |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-015-AC1 | `US015_AC1_each_source_has_title_and_page` | I+E | Câu trả lời từ 1 tài liệu → ≥ 1 chip có đúng tên + trang của đoạn nguồn (so với fixture) |
| US-015-AC2 | `US015_AC2_each_document_has_own_citation` | I | Câu trả lời từ 2 tài liệu → hai chip riêng |
| US-015-AC3 | `US015_AC3_metrics_over_question_set` | bộ đánh giá | Bộ MET-002: 100% câu `ANSWERED` có trích dẫn; tỷ lệ trích dẫn đúng tài liệu+trang ≥ `[TBD: OQ-003]`% (báo cáo IMP-070) |
| US-015-AC3 | `US015_AC3_model_cannot_invent_citation` | U/I | Model (fake) viết tên tài liệu/trang bịa và số nguồn ngoài 1..K → bị loại; trích dẫn chỉ từ metadata |
| US-015-AC4 | `US015_AC4_deleted_source_keeps_title_with_label` | I+E | Tạo câu trả lời → xóa + purge tài liệu → mở lịch sử: chip còn tên + nhãn "đã xóa"; `citations.chunk_id IS NULL`, `document_title` còn |

**Trường hợp biên:** số nguồn `[n]` lặp/không liên tục · model không trích số nào (TS §7.4 bước 4 + `answer_no_citation`) · trang tính từ 1 (chắc chắn khớp trang PDF in, **không** nhãn trang in của tài liệu) · tên tài liệu bị đổi sau khi tạo trích dẫn (hiển thị bản sao lúc tạo).

**OQ-013/OQ-003:** tỷ lệ chấp nhận chờ chốt; mã không phụ thuộc ngưỡng.

---

### US-016 · Xem đoạn nội dung gốc của trích dẫn (P1)

| | |
|---|---|
| **Tóm tắt** | P3 · SCR-04 (ngăn xem nguồn) · `GET /citations/{id}` |
| **Việc (IMP)** | IMP-044 (API), 046 (UI) |

**IMP-044 — `GET /citations/{id}` (BE · S):** hợp đồng ở TS §4.3. Việc con: (a) kiểm quyền **tại thời điểm xem** qua `visible_document_ids` (không dựa trên quyền lúc tạo); (b) trả `excerpt` ≤ `CITATION_EXCERPT_MAX_CHARS` cắt ở ranh giới từ; (c) `DOCUMENT_DELETED` khi `chunk_id IS NULL` hoặc tài liệu `DELETED` → không `excerpt`; (d) mất quyền → `404`; (e) `usage_events('citation_opened')`.

**IMP-046 — `CitationPanel` (FE · M) — SCR-04:** mở khi bấm chip; hiển thị tên + trang + đoạn gốc; trạng thái `loading`/`error`/`deleted` ("Tài liệu đã bị xóa — không còn xem được đoạn gốc")/`not found` (thông báo chung khi `404`); đóng bằng Esc và trả focus về chip; bẫy focus nếu dạng hộp thoại; chọn chip khác thay nội dung.

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-016-AC1 | `US016_AC1_click_shows_source_excerpt` | E+I | Bấm chip → thấy đoạn gốc + tên + trang; khớp `document_chunks.content` |
| US-016-AC2 | `US016_AC2_open_five_citations` | E | Mở 5 trích dẫn khác nhau → cả 5 có đoạn gốc |
| US-016-AC3 | `US016_AC3_no_access_denied_no_leak` | I+E | Thu hồi quyền/đổi chủ trong lúc lịch sử còn → `GET /citations/{id}` → `404`; UI báo thông báo chung, **không** hiển thị đoạn gốc và không nói tài liệu có tồn tại |
| (đã xóa) | `US016_deleted_document_no_excerpt` | I | Sau purge: `status=DOCUMENT_DELETED`, không `excerpt` |

**Trường hợp biên:** đoạn rất dài (cắt, có dấu "…") · đoạn chứa ký tự điều khiển/HTML (hiển thị như văn bản thuần, **không** render HTML — chống XSS) · mở citation của phiên người khác bằng id đoán (`404`).


---

## 7. Epic E5 — Quản lý tài liệu

### US-017 · Xem danh sách tài liệu được phép truy cập (P0)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-02 · `GET /documents` |
| **Việc (IMP)** | IMP-034 (API), 035 (UI), 022 (quyền), 074 (E2E) |

Dùng thành phần "Ngăn tài liệu" (IMP-035, mô tả ở US-004). Phần riêng:

| Việc con | Chi tiết |
|---|---|
| a. Phạm vi | Chỉ tài liệu trong `visible_document_ids`, loại `DELETED` (TS §3.3) — không lọc ở client |
| b. Trạng thái trống | Khi không có tài liệu: minh họa + nút "Tải PDF lên" mở SCR-03 (US-017-AC2) |
| c. Hiển thị chủ sở hữu | Cột "Của tôi"/tên chủ (`isOwner`); với tài liệu được chia sẻ ẩn menu xóa (US-018-AC3) |
| d. Hiệu năng | Chỉ mục `documents_owner_list_ix` (TS §3.2); phân trang |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-017-AC1 | `US017_AC1_lists_exactly_three_documents` | I+E | Người dùng có đúng 3 tài liệu → danh sách 3 dòng đúng tên + trạng thái |
| US-017-AC2 | `US017_AC2_empty_state_with_upload_cta` | E | Người dùng mới → trạng thái trống + nút mở vùng tải lên |
| US-017-AC3 | `US017_AC3_other_users_docs_hidden` | I+E | Tài liệu của B không chia sẻ → không xuất hiện ở danh sách của A; `GET /documents/{id của B}` → `404` |

**Trường hợp biên:** danh sách rất dài (phân trang, không tải hết) · tài liệu vừa xóa ở tab khác (làm mới khi lấy lại focus: `refetchOnWindowFocus`) · tên tài liệu có ký tự đặc biệt/HTML (hiển thị thuần văn bản).

---

### US-018 · Xóa tài liệu do mình tải lên (P1)

| | |
|---|---|
| **Tóm tắt** | P2 · SCR-09 (menu + xác nhận) · `DELETE /documents/{id}` · job `purge_document` |
| **Việc (IMP)** | IMP-034 (API), 037 (UI), 074 (E2E hồi quy) |

**IMP-037 — Menu thao tác + xác nhận xóa (FE · S) — SCR-09**

| Việc con | Chi tiết |
|---|---|
| a. Menu | Nút "⋯" mỗi dòng (`aria-haspopup="menu"`), mục "Xóa"; chỉ hiện nếu `isOwner` |
| b. Hộp thoại xác nhận | Nêu tên tài liệu và hậu quả ("Câu trả lời mới sẽ không dùng tài liệu này; không hoàn tác được"); nút "Xóa" (nguy hiểm) và "Hủy" (mặc định focus vào "Hủy") |
| c. Gọi API | Khi xác nhận: `DELETE`; thành công → loại khỏi danh sách (cập nhật lạc quan, hoàn tác nếu lỗi) |
| d. Hủy | Đóng hộp thoại, tài liệu còn nguyên, focus về nút "⋯" (US-018-AC2) |
| e. Lỗi | `404` (đã xóa ở nơi khác) → coi như thành công; lỗi mạng → thông báo + giữ tài liệu |
| f. Focus | Sau xóa, focus chuyển sang dòng kế/ô tìm kiếm — **không** để focus mất (lỗi đã gặp ở bản HTML mẫu) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-018-AC1 | `US018_AC1_owner_can_delete` | E+I | Xóa + xác nhận → biến khỏi danh sách; DB `status=DELETED`, có job `purge_document`, có `audit_log(DELETE)` |
| US-018-AC2 | `US018_AC2_cancel_keeps_document` | E | Bấm "Hủy" → tài liệu còn, không có request `DELETE` |
| US-018-AC3 | `US018_AC3_non_owner_cannot_delete` | I+E | Tài liệu của người khác (đã chia sẻ khi có OQ-007) → UI không có "Xóa"; gọi API trực tiếp → `404` (tạm; `[TBD: OQ-007]` có thể đổi thành `403` nếu thấy được) |
| (purge) | `US018_purge_removes_chunks_and_object` | I | Chạy job `purge_document`: không còn `document_chunks`, `file_metadata`, object; `documents` còn `DELETED`; `citations` còn tên |

**Trường hợp biên:** xóa tài liệu đang `PROCESSING` (job nhận thấy `status!=PROCESSING` và thoát) · xóa hai lần (idempotent: lần hai `404`) · purge thất bại giữa chừng (thử lại; cảnh báo sau `PURGE_ALERT_AFTER_S`).

**OQ-007:** quyền xóa của người không phải chủ (Administrator?) — tạm: chỉ chủ sở hữu.

---

### US-019 · Tài liệu đã xóa không còn dùng trong câu trả lời mới (P0)

| | |
|---|---|
| **Tóm tắt** | P2 (xóa) + P3 (truy xuất) · không có màn hình riêng |
| **Việc (IMP)** | IMP-034 (hiệu lực tức thì), 040 (lọc truy vấn), 074 (E2E hồi quy) |

| Việc con | Chi tiết |
|---|---|
| a. Hiệu lực tức thì | `documents.deleted_at` được đặt trong cùng giao dịch với `status='DELETED'`; `visible_document_ids` loại tài liệu đó (TS §3.3) — **không chờ purge** |
| b. Giữa lúc đang hỏi | Truy vấn retrieval chạy **sau** commit xóa sẽ không thấy tài liệu (US-019-AC2); với truy vấn đã chạy trước, kiểm tra lại ở bước dựng trích dẫn: loại trích dẫn của tài liệu đã `DELETED` `[Đề xuất]` |
| c. Khi hết nguồn | Nếu sau khi lọc không còn đoạn → `NOT_FOUND` (US-019-AC3) |
| d. Hồi quy tự động | Bộ E2E "xóa rồi hỏi" nằm trong IMP-074 và chạy ở mỗi bản phát hành |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-019-AC1 | `US019_AC1_deleted_doc_not_used_five_questions` | E+I | Xóa X, hỏi 5 câu chỉ X có đáp án → 5/5 không có nội dung/trích dẫn từ X |
| US-019-AC2 | `US019_AC2_delete_during_inflight_question` | I | Chặn retriever, xóa X, thả retriever → câu trả lời không dùng X (kiểm tra bước loại sau cùng) |
| US-019-AC3 | `US019_AC3_after_delete_answer_is_not_found` | E | Hỏi câu chỉ X có đáp án → `NOT_FOUND` theo US-010 |
| (trước purge) | `US019_effective_before_purge_runs` | I | Không chạy job purge: tài liệu vẫn không bị truy xuất |

**Trường hợp biên:** đoạn của X còn trong CSDL (chưa purge) — RLS và `visible_document_ids` vẫn chặn · tài liệu bị xóa còn trong `scope_document_ids` của tin nhắn cũ (chỉ lịch sử, không dùng lại).

---

## 8. Epic E6 — Lịch sử hội thoại

### US-020 · Xem lại các phiên hội thoại trước (P2)

| | |
|---|---|
| **Tóm tắt** | P5 · SCR-05 · `GET /sessions`, `GET /sessions/{id}/messages` · `chat_sessions`, `messages` |
| **Việc (IMP)** | IMP-061 (API đã dựng ở IMP-043; IMP-061 hoàn thiện phân trang + UI), 063 (retention) |

| Việc con | Chi tiết |
|---|---|
| a. Danh sách phiên | `GET /sessions` chỉ của chính người dùng (lọc `owner_id`; kiểm thử chặn người khác) |
| b. Mở phiên | `GET /sessions/{id}/messages` (TS §4.3), phân trang con trỏ; hiển thị cả trích dẫn và phản hồi cũ |
| c. UI SCR-05 | Danh sách phiên (tiêu đề, thời điểm), trạng thái trống, mở phiên cũ để **xem** và **tiếp tục hỏi** `[Đề xuất]` |
| d. Retention | Job `retention_cleanup` theo `RETENTION_CHAT_DAYS` `[TBD: OQ-015]` (TS §8.5); UI không hiển thị phiên đã xóa |
| e. Quyền riêng tư | Phiên chỉ của chủ; Administrator **không** đọc được hội thoại của người khác (chờ OQ-013/015 nếu cần khác) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-020-AC1 | `US020_AC1_sessions_survive_relogin` | E | Hỏi → đăng xuất → đăng nhập lại → thấy và mở được phiên cũ |
| US-020-AC2 | `US020_AC2_other_users_sessions_hidden` | I+E | A không thấy phiên của B; `GET /sessions/{id của B}/messages` → `404` |
| US-020-AC3 | `US020_AC3_expired_sessions_not_listed` | I | Đặt `RETENTION_CHAT_DAYS=1`, lùi thời gian phiên, chạy `retention_cleanup` → phiên không còn trong danh sách |

**Trường hợp biên:** phiên có tin nhắn tham chiếu tài liệu đã xóa (hiển thị nhãn "đã xóa") · phiên rất dài (phân trang tin nhắn) · tiêu đề rỗng (mặc định "Cuộc trò chuyện mới" lấy từ i18n).

**OQ-015:** nếu chưa chốt thời hạn lưu → job không xóa gì; AC3 giữ trạng thái `Chưa kiểm thử được`.

---

## 9. Epic E7 — Phân quyền tài liệu

### US-021 · Tài liệu chỉ hiển thị với người trong phạm vi chia sẻ (P0)

| | |
|---|---|
| **Tóm tắt** | P2 (nền) + P4 (quản trị) + P5 (chia sẻ, nếu OQ-007 yêu cầu) · SCR-07 (quản trị, đề xuất) |
| **Việc (IMP)** | IMP-022 (quyền), 071 (kiểm thử cô lập), 023 (quản trị), 074 (E2E), IMP-062 (chia sẻ — chỉ khi OQ-007 chốt cần) |

**IMP-022 — Quyền xem tài liệu (BE · L)**

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Hàm `visible_document_ids` + RLS | TS §3.3 (đã trong migration IMP-014); ở đây xác minh và dùng trong mọi truy vấn |
| b. Dịch vụ `DocumentAccess` | `can_view(user, doc_id)`, `can_delete(user, doc_id)`; endpoint dùng chung, mặc định **từ chối** |
| c. Thu hồi có hiệu lực ngay | Không cache quyền (hoặc cache ≤ vài giây có vô hiệu hóa khi thay đổi) — kiểm thử US-021-AC3 |
| d. Một cổng duy nhất | Mọi nơi truy vấn tài liệu/đoạn/trích dẫn đều đi qua `visible_document_ids` (kiểm bằng test tĩnh/grep trong CI: cấm `SELECT ... FROM document_chunks` ngoài `HybridRetriever`/`data_access`) |

**IMP-023 — Quản trị người dùng (BE · M + SCR-07):** `POST /admin/users`, `DELETE /admin/users/{id}` (TS §4.3); giao diện SCR-07: danh sách người dùng, thêm (email + vai trò), thu hồi (xác nhận); `audit_log(GRANT_ACCESS/REVOKE_ACCESS)`. Thu hồi một người dùng **có hiệu lực ở yêu cầu kế tiếp** (`is_active` kiểm ở mỗi yêu cầu, US-001).

**IMP-071 — Kiểm thử cô lập (QA · M, chạy trong CI):** (i) SQL thuần: vai trò `docchat_api` + `SET LOCAL app.user_id` → không đọc được `documents`/`document_chunks` của người khác, kể cả khi truy vấn thẳng bằng `document_id`; (ii) API: IDOR cho mọi endpoint có `{id}` (`documents`, `sessions`, `citations`, `answers/feedback`) → `404`; (iii) retrieval: câu hỏi cố tình nhắm nội dung của người khác; (iv) quét tĩnh truy vấn ngoài cổng quyền.

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-021-AC1 | `US021_AC1_unshared_doc_not_listed` | I+E | Y của B không chia sẻ → không có trong `GET /documents` của A |
| US-021-AC2 | `US021_AC2_five_questions_about_Y_leak_nothing` | I+E | 5 câu về nội dung riêng của Y → 5/5 không có nội dung/trích dẫn từ Y |
| US-021-AC3 | `US021_AC3_revocation_takes_effect_immediately` | I | Chia sẻ Y cho A (khi có chia sẻ), A hỏi → có Y; thu hồi → câu hỏi kế tiếp không dùng Y; `GET /citations` cũ của Y → `404` |
| US-021-AC4 | `US021_AC4_direct_access_denied_no_existence_leak` | I | `GET /documents/{Y}` và `DELETE /documents/{Y}` bởi A → `404`; phản hồi **giống hệt** phản hồi của id không tồn tại (thân, header, thời gian xấp xỉ) |
| (RLS) | `US021_rls_blocks_even_if_app_forgets_filter` | I | Truy vấn `SELECT * FROM documents` thẳng với `app.user_id` của A → chỉ thấy phạm vi của A; không đặt `app.user_id` → 0 dòng |

**Trường hợp biên:** người dùng thuộc nhiều nhóm · tài liệu chuyển từ `ORGANIZATION` về `PRIVATE` khi có câu hỏi đang chạy · cùng email đổi `sub` ở IdP (TS §9.3) · so sánh thời gian phản hồi giữa "không tồn tại" và "không có quyền" (tránh kênh phụ: cùng đường mã) · `Administrator` **không** tự động xem tài liệu người khác.

**OQ-007 (phạm vi chia sẻ):** phương án tạm = `PRIVATE` cho chủ sở hữu; bảng `document_shares` và `share_scope` đã có trong lược đồ. Nếu OQ-007 chốt cần chia sẻ ở MVP → chuyển IMP-062 lên P4 (+≈ 4 ngày công, theo kế hoạch §2). AC3 chỉ kiểm thử được đầy đủ khi có chia sẻ; nếu không, kiểm thử thu hồi tập trung vào US-001 (`is_active=false`).

**DoD riêng:** story hồi quy phân quyền (US-001, 019, 021) chạy trong CI ở mọi PR; **0** lần rò rỉ trong IMP-071; báo cáo cô lập đính kèm hồ sơ phát hành (cổng G3/G4 trong kế hoạch).

---

## 10. Epic E8 — Đo lường MVP

### US-022 · Đánh giá câu trả lời hữu ích / không hữu ích (P1)

| | |
|---|---|
| **Tóm tắt** | P4 · SCR-02 · `POST /answers/{messageId}/feedback` · `feedback` |
| **Việc (IMP)** | IMP-050 (sự kiện), 051 (API), 052 (UI), 074 |

| Việc con | Chi tiết |
|---|---|
| a. API | Upsert theo `message_id` (TS §4.3); chỉ `ANSWER` thuộc phiên của chính người dùng; `usage_events('feedback_given')` |
| b. UI `FeedbackButtons` | Hai nút "Hữu ích"/"Không hữu ích", `aria-pressed`; hiển thị lựa chọn hiện tại; đổi lựa chọn → gọi lại (US-022-AC2); cập nhật lạc quan, hoàn tác khi lỗi |
| c. Hiển thị lại | `GET .../messages` trả `feedback` (TS §4.3) để nút giữ trạng thái khi mở lại |
| d. Tính vào tuần | Báo cáo tuần dùng `feedback.updated_at` (hoặc `usage_events`) trong ranh giới tuần; quy ước: **đánh giá mới nhất trong tuần** — chốt với PO `[TBD: OQ-014]` |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-022-AC1 | `US022_AC1_rating_recorded_and_shown` | E+I | Chọn "Hữu ích" → `feedback` có 1 dòng, UI giữ trạng thái đã chọn (kể cả sau tải lại) |
| US-022-AC2 | `US022_AC2_change_keeps_latest_only` | I | Hữu ích → Không hữu ích: còn đúng 1 dòng `NOT_HELPFUL`; `updated_at` mới hơn |
| US-022-AC3 | `US022_AC3_counted_in_weekly_report` | I | Đánh giá trong tuần → số `feedback.helpful/notHelpful` của báo cáo tuần đó tăng đúng |
| (quyền) | `US022_cannot_rate_others_answers` | I | Đánh giá tin nhắn của phiên người khác → `404` |

**Trường hợp biên:** đánh giá câu `NOT_FOUND`/`ERROR` (cho phép `NOT_FOUND`; `ERROR` không hiển thị nút) · đánh giá liền hai lần nhanh (idempotent) · đánh giá qua ranh giới tuần.

---

### US-023 · Báo cáo hằng tuần cho Product Owner (P0)

| | |
|---|---|
| **Tóm tắt** | P4 · SCR-06 · `GET /reports/weekly` · job `weekly_report` · `usage_events` |
| **Việc (IMP)** | IMP-050 (thu sự kiện), 051 (API + job), 052 (SCR-06), 074, 076 |

| Việc con | Chi tiết kiểm tra được |
|---|---|
| a. Thu sự kiện | Phát đủ sự kiện TS §10.2, **không** kèm nội dung (TS §10.3); kiểm thử quét `attributes` |
| b. Job `weekly_report` | Chạy thứ Hai 00:05 theo `REPORT_TZ`; tính tuần liền trước (ranh giới `[Đề xuất]` thứ Hai 00:00 → Chủ nhật 24:00); idempotent (chạy lại ghi đè cùng kết quả); tuần không có hoạt động vẫn sinh báo cáo giá trị `0` (US-023-AC3) |
| c. API | `GET /reports/weekly?week=` trả schema TS §10.4; chỉ `PRODUCT_OWNER`/`ADMINISTRATOR`, vai trò khác `403 FORBIDDEN` (US-023-AC4) |
| d. Định nghĩa số liệu | "Người dùng hoạt động" = số `user_id` khác nhau có ≥ 1 `question_asked` trong tuần `[Đề xuất; chốt với PO — MET-003, OQ-014]`; "số câu hỏi" = đếm `question_asked` |
| e. UI SCR-06 | Chọn tuần, thẻ số liệu (người dùng hoạt động, câu hỏi, tỷ lệ hữu ích, p50/p95), trạng thái `loading`/`empty`(0)/`error`; bảng văn bản đi kèm biểu đồ (trợ năng) |
| f. "Nhận báo cáo" | PRD nói "nhận" báo cáo: MVP = xem trong ứng dụng; gửi email `[TBD]` nếu PO yêu cầu (không nằm trong kế hoạch) |
| g. Đối chiếu | Script `scripts/reconcile_usage.py` đếm trực tiếp từ `messages` để so với báo cáo (US-023-AC2: lệch ≤ 5%) |

| AC | Ca kiểm thử | Loại | Cách kiểm tra |
|---|---|---|---|
| US-023-AC1 | `US023_AC1_weekly_report_has_users_and_questions` | I+E | Tạo hoạt động trong tuần, chạy job → báo cáo có `activeUsers`, `questionsAsked` đúng; UI hiển thị |
| US-023-AC2 | `US023_AC2_two_weeks_reconcile_within_5pct` | I | Hai tuần dữ liệu mô phỏng; `reconcile_usage.py` lệch ≤ 5% (kỳ vọng 0%); ở pilot dùng số đếm mẫu thủ công |
| US-023-AC3 | `US023_AC3_zero_activity_week_shows_zero` | I+E | Tuần không hoạt động → báo cáo tồn tại với 0, UI hiển thị 0 (không "không có dữ liệu") |
| US-023-AC4 | `US023_AC4_non_po_denied` | I+E | `BUSINESS_USER` gọi API → `403`; menu "Báo cáo" không hiển thị; route SPA bị chặn |
| (múi giờ) | `US023_week_boundary_in_report_tz` | U | Sự kiện lúc 23:59 Chủ nhật và 00:01 thứ Hai (theo `Asia/Ho_Chi_Minh`) rơi vào đúng tuần |

**Trường hợp biên:** job không chạy đúng giờ (tạo bù khi khởi động nếu thiếu báo cáo tuần trước) · sự kiện đến muộn (tính lại tuần gần nhất khi đọc `[Đề xuất]`) · người dùng bị thu hồi vẫn có sự kiện trong tuần (vẫn đếm) · p50/p95 khi ít mẫu (trả `null`, UI hiển thị "—").

**OQ-014/MET-003:** định nghĩa "hoạt động" và quy tắc tính tuần chờ PO xác nhận.

---

## 11. Việc kiểm thử, phát hành và vận hành (không gắn riêng một story)

| IMP | Nội dung ngắn | Việc con kiểm tra được |
|---|---|---|
| IMP-001 | Họp chốt quyết định chặn | Đầu ra: biên bản ghi quyết định và chủ sở hữu/hạn cho OQ-008, 016, 007, 004, 005, 006, 011, 014; cập nhật bảng mục 13 (thay "phương án tạm" bằng giá trị thật) và giá trị mặc định ở TS §2 |
| IMP-002 | Spike A: trích xuất PDF | Chạy `PdfTextParser` trên 20 PDF thật; báo cáo tỷ lệ scan/bảng/nhiều cột, chất lượng văn bản, ngưỡng `NO_TEXT_*` đề xuất (TS §8.2) |
| IMP-003 | Spike B: truy xuất lai tiếng Việt | So 2–3 mô hình embedding, FTS `simple`, RRF trên bộ IMP-005; chốt `EMBED_MODEL_ID`, `EMBED_DIM` (sửa `vector(1024)` ở migration nếu khác), bộ đếm token, `RAG_*` |
| IMP-004 | Spike C: mô hình sinh + prompt | Kiểm tra mô hình chỉ trả số nguồn, hành vi khi thiếu ngữ cảnh, prompt injection; chốt prompt TS §7.3 và hiệu năng lọc HNSW (TS §7.2) |
| IMP-005 | Bộ dữ liệu DEP-003/004 | ≥ 10 PDF, ≥ 100 câu hỏi có đáp án, 10 câu nhiều nguồn, 10 câu không có đáp án, 5 cặp nối tiếp; đặt ở `eval/` theo định dạng IMP-070 |
| IMP-006 | Spike D: nền tảng triển khai | Chọn đám mây/tự lưu trữ, registry, IdP môi trường thử → đầu vào cho IMP-013 |
| IMP-007 | Rà soát bảo mật sơ bộ | Sơ đồ luồng dữ liệu tới dịch vụ AI, danh sách dữ liệu rời hệ thống, lịch review DEP-002 |
| IMP-047 | Trợ năng khung hội thoại | `aria-live="polite"` cho trạng thái (không `role="log"` cho token), phím tắt (Enter/Shift+Enter, Esc đóng ngăn nguồn), cuộn thông minh: tự cuộn khi đang ở cuối, nếu người dùng cuộn lên thì hiện nút "Xuống tin mới" thay vì giật cuộn; kiểm bằng axe + luồng thủ công IMP-075 |
| IMP-070 | Bộ đánh giá MET-002 | (a) Tệp cấu hình bộ câu hỏi `eval/questions.yaml` (câu, tài liệu nguồn, trang đúng, loại `answerable`/`not_found`/`multi_source`); (b) runner gọi `AnswerService` trực tiếp (không qua HTTP); (c) chấm tự động: có trích dẫn, trích dẫn đúng (tài liệu+trang), `NOT_FOUND` đúng; chấm tay cho nội dung; (d) lưu kết quả theo phiên bản (mô hình, prompt, tham số `RAG_*`); (e) báo cáo đường cong ngưỡng T để chốt OQ-003 |
| IMP-072 | E2E US-001–005 | Playwright, chạy trên fake; tên ca theo TS §1.3; chạy ở mỗi PR (nhóm nhanh) và đêm (đầy đủ) |
| IMP-073 | E2E US-007–012, 015 | Như trên; thêm kịch bản lỗi AI/timeout/mất mạng |
| IMP-074 | E2E còn lại + hồi quy xóa | US-017, 019, 021, 023, kịch bản "xóa rồi hỏi" |
| IMP-075 | Trợ năng | `axe` trong CI trên các màn SCR-01..SCR-09; 5 luồng thủ công bàn phím + trình đọc màn hình; lỗi mức nghiêm trọng chặn phát hành |
| IMP-076 | Hiệu năng | Kịch bản tải theo pilot (số người dùng đồng thời `[TBD: OQ-011]`), đo p50/p95 câu hỏi, thời gian xử lý tài liệu, độ sâu hàng đợi |
| IMP-077 | Prompt injection | Tài liệu có chỉ dẫn ẩn, trích dẫn bịa, yêu cầu "lộ prompt"; tiêu chí đạt: 0 lần tuân theo chỉ dẫn trong tài liệu |
| IMP-080/081/087 | Pipeline phát hành, sao lưu, diễn tập khôi phục | Quy trình phê duyệt tay + hoàn tác; sao lưu PostgreSQL (đầy đủ + WAL) và PDF; diễn tập đo RPO/RTO thực tế so với `[TBD: OQ-018]` |
| IMP-082 | Dashboard + cảnh báo | Theo TS §10.1 |
| IMP-083 | Review bảo mật (DEP-002) | Egress allow-list, bí mật, mã hóa, dò quét nhẹ; xử lý phát hiện mức cao trước G4 |
| IMP-084/085/086 | Runbook, pilot, đồng bộ tài liệu | Theo kế hoạch §10, §11 |
| IMP-048 | Tham số RAG ra cấu hình | Đưa K, T, số lượt, `topn` vào `RAG_*` (TS §2); lệnh `python -m docchat.tools.tune_rag` chạy bộ đánh giá với bộ tham số khác nhau |
| IMP-060/061/062/063 | Việc P5 (US-014, 020, 021 mở rộng, retention) | Xem thẻ US-014, US-020, US-021 |

---

## 12. Ma trận story → việc → ca kiểm thử

| Story | Ưu tiên | Việc (IMP) | Số AC | Mã ca kiểm thử (tiền tố) |
|---|---|---|---|---|
| US-001 | P0 | 016, 020, 021, 072 | 4 | `US001_AC1..4` |
| US-002 | P0 | 030, 031, 035, 036, 072 | 3 | `US002_AC1..3` |
| US-003 | P0 | 030, 036, 072 | 4 | `US003_AC1..4` |
| US-004 | P0 | 033, 035, 076 | 3 | `US004_AC1..3` |
| US-005 | P0 | 032, 033, 035 | 3 | `US005_AC1..3` |
| US-006 | P1 | 030, 036 | 3 | `US006_AC1..3` |
| US-007 | P0 | 019, 043, 045, 073 | 5 | `US007_AC1..5` |
| US-008 | P0 | 022, 040, 041, 070, 071, 077 | 3 | `US008_AC1..3` |
| US-009 | P0 | 040, 041, 070 | 3 | `US009_AC1..3` |
| US-010 | P0 | 041, 043, 045, 070 | 3 | `US010_AC1..3` |
| US-011 | P0 | 041, 042, 070 | 3 | `US011_AC1..3` |
| US-012 | P0 | 042, 043, 045, 076 | 4 | `US012_AC1..4` |
| US-013 | P1 | 041, 043, 070 | 3 | `US013_AC1..3` |
| US-014 | P2 | 040, 060 | 3 | `US014_AC1..3` |
| US-015 | P0 | 041, 043, 045, 046, 070, 073 | 4 | `US015_AC1..4` |
| US-016 | P1 | 044, 046 | 3 | `US016_AC1..3` |
| US-017 | P0 | 022, 034, 035, 074 | 3 | `US017_AC1..3` |
| US-018 | P1 | 034, 037, 074 | 3 | `US018_AC1..3` |
| US-019 | P0 | 034, 040, 074 | 3 | `US019_AC1..3` |
| US-020 | P2 | 043, 061, 063 | 3 | `US020_AC1..3` |
| US-021 | P0 | 022, 023, 071, 074 (+062 nếu OQ-007) | 4 | `US021_AC1..4` |
| US-022 | P1 | 050, 051, 052, 074 | 3 | `US022_AC1..3` |
| US-023 | P0 | 050, 051, 052, 074, 076 | 4 | `US023_AC1..4` |
| **Tổng** | | | **77** | |

Quy tắc CI: một AC chỉ được tính "đã kiểm thử" khi tồn tại ít nhất một ca có mã `USxxx_ACn` ở trạng thái xanh; ca `Chưa kiểm thử được` (chờ OQ) phải nêu OQ chặn.

## 13. Phương án tạm khi câu hỏi mở chưa chốt (tổng hợp)

| OQ | Ảnh hưởng | Phương án tạm | Việc/AC bị ảnh hưởng |
|---|---|---|---|
| OQ-003 | Ngưỡng chất lượng, ngưỡng T | Dùng giá trị mặc định TS §2; chốt bằng IMP-070 | US-008..011, 015 (AC đo tỷ lệ) |
| OQ-004 | Giới hạn tải lên | 50 MB, 500 trang, 10 tệp (cấu hình) | US-002, 003, 006 |
| OQ-005 | Thời hạn xử lý tài liệu | 5 phút làm mục tiêu theo dõi | US-004-AC1, 3 |
| OQ-006 | Ngưỡng độ trễ | 95% trong 60 s làm mục tiêu theo dõi | US-012-AC1, 3 |
| OQ-007 | Chia sẻ/quyền xóa | Riêng tư cho chủ; hoãn IMP-062 | US-018-AC3, US-021 |
| OQ-008 | Dịch vụ AI | Bản giả + ports; không chặn phát triển | IMP-003/004/033/040/042 (chạy thật) |
| OQ-009 | Phạm vi ngôn ngữ | Tiếng Việt; nguồn tiếng Anh thử nếu có | US-011-AC3 |
| OQ-013/015 | Lưu lịch sử | Không tự xóa; job retention tắt | US-020-AC3 |
| OQ-014 | Định nghĩa số liệu báo cáo | Theo TS §10.4, §10 đề xuất | US-022-AC3, US-023 |
| OQ-016 | Xác thực | IdP phát triển sau `TokenVerifier` | US-001 |
| OQ-020 | Tệp trùng | Cho phép trùng, lưu checksum | US-002-AC3 |

## 14. Hạn chế của tài liệu này

- Giá trị số, tên thư viện, bố cục SQL và tên cột đánh dấu `[Đề xuất]` là gợi ý có căn cứ từ SAD/Blueprint, **chưa được kiểm chứng** bằng spike P0; đội phát triển điều chỉnh khi có kết quả IMP-002/003/004 và ghi lại thay đổi vào TS.
- Chưa có mã nguồn: mọi chữ ký và SQL là đặc tả để viết, chưa chạy thử.
- Thông báo tiếng Việt cuối cùng lấy theo Blueprint §3.5.5; câu nào ghi `[Đề xuất]` cần PO/UX duyệt.
- Cỡ công việc và lịch giữ nguyên ở [Implement_plan.md](Implement_plan.md); việc chia nhỏ ở đây **chưa** được ước lượng lại.
