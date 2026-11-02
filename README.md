# Chat với tài liệu (MVP)

Web app: tải PDF lên workspace chung, hỏi bằng tiếng Việt/Anh và nhận câu trả lời **kèm trích dẫn tên tài liệu + trang**.
Kế hoạch và các task: [docs/implement/Implement_plan.md](docs/implement/Implement_plan.md), [docs/implement/tasks/](docs/implement/tasks/README.md).

```text
apps/web   Vue 3 + TypeScript + Vite (frontend)
apps/api   Java 21 + Spring Boot 3, Maven (backend REST + SSE)
docs/      Yêu cầu, thiết kế, kế hoạch
```

## Chạy nhanh

Cần: Node 24 (xem `.nvmrc`; tối thiểu 20.19) và JDK 21 (xem `.sdkmanrc`). Không cần cài Maven (dùng `./mvnw`; nếu Linux/macOS báo thiếu quyền chạy: `sh ./mvnw …`).

```bash
# Frontend
cd apps/web && npm ci && npm run dev            # http://localhost:5173
cd apps/web && npm run lint && npm test && npm run build

# Backend
cd apps/api && ./mvnw spring-boot:run           # http://localhost:8080
cd apps/api && ./mvnw verify                    # test + kiểm tra định dạng + build
cd apps/api && ./mvnw spotless:apply            # tự sửa định dạng
```

Trên Windows dùng `mvnw.cmd` thay cho `./mvnw`.

## Đăng nhập (T04)

Tài khoản do Admin tạo sẵn; phiên bằng cookie `HttpOnly` sống **8 giờ tuyệt đối**; sai mật khẩu 5 lần thì khóa 15 phút. API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`. Mọi route `/api/**` khác đều cần phiên (mặc định từ chối).

Chạy cục bộ (cần PostgreSQL 16 + pgvector — `docker compose up -d db` dựng sẵn ở thư mục gốc):

```bash
export DOCCHAT_DB_URL=jdbc:postgresql://localhost:5432/docchat DOCCHAT_DB_USER=docchat DOCCHAT_DB_PASSWORD=...
export DOCCHAT_ADMIN_USERNAME=admin DOCCHAT_ADMIN_PASSWORD='mật-khẩu-dài-≥-12-ký-tự'   # tạo Admin lần đầu; chạy lại không tạo trùng
export DOCCHAT_STORAGE_DIR=/duong/dan/luu-tep    # BẮT BUỘC: thư mục lưu PDF (mã hóa AES-256-GCM)
export DOCCHAT_STORAGE_ENCRYPTION_KEY=$(openssl rand -base64 32)   # BẮT BUỘC: base64 của đúng 32 byte; GIỮ BÍ MẬT và cố định (mất khóa = mất tệp)
export DOCCHAT_AUTH_COOKIE_SECURE=false      # chỉ khi chạy http không phải localhost
cd apps/api && ./mvnw spring-boot:run        # cổng 8080
cd apps/web && npm run dev                   # cổng 5173, tự chuyển /api sang 8080 (đổi bằng DOCCHAT_API_URL)
```

**Thử nhanh không cần PostgreSQL/Docker** (chỉ cho máy phát triển): chạy backend với PostgreSQL nhúng và một tài khoản mẫu.

```bash
cd apps/api && ./mvnw spring-boot:test-run -Dspring-boot.run.main-class=vn.docchat.DevServer
cd apps/web && npm run dev      # rồi mở http://localhost:5173
# Tài khoản mẫu: admin / Docchat-Dev-2026!  (đổi bằng DOCCHAT_ADMIN_USERNAME, DOCCHAT_ADMIN_PASSWORD)
# Dữ liệu lưu ở apps/api/target/dev-postgres; xóa thư mục này để làm lại từ đầu.
```

| Biến (`docchat.auth.*` hoặc `DOCCHAT_AUTH_*`) | Mặc định |
|---|---|
| `session-ttl` | `PT8H` |
| `max-failed-logins` / `lock-duration` | `5` / `PT15M` |
| `cookie-name` / `cookie-secure` / `cookie-same-site` | `DOCCHAT_SESSION` / `true` / `Lax` |
| `allowed-origins` | rỗng = chỉ cùng origin với `Host` |
| `login-rate-limit-per-minute` (theo IP) | `20` |

Kiểm thử: backend dùng PostgreSQL nhúng (`./mvnw verify`, không cần Docker); giao diện có E2E trên API giả (`cd apps/web && npm run e2e`; trên Windows có thể `PW_CHANNEL=msedge` để dùng Edge sẵn có thay vì tải Chromium).

## Luật kiến trúc (được máy kiểm tra, CI đỏ nếu vi phạm)

Frontend (`apps/web/eslint.config.js`, test ở `apps/web/tests/lint-rules.test.ts`) — bộ luật **đề xuất**, đối chiếu SDD UI/UX khi có:

| Luật | Nội dung |
|---|---|
| R-1 | `shared` không import `features` hay `app` |
| R-2 | `features/<A>` không import `features/<B>` |
| R-3 | Chỉ `shared/api` được gọi mạng (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`) |
| R-4 | Chỉ `shared/lib/markdown` được tạo HTML từ chuỗi (`v-html`, `innerHTML`…) |
| R-5 | `app` là nơi duy nhất ghép các feature |
| R-6 | Không import thư viện HTTP (`axios`, `ky`…) ngoài `shared/api` |
| Token | Không dùng `localStorage`/`sessionStorage` |

Backend (`apps/api/src/test/java/vn/docchat/ArchitectureRules.java`, ArchUnit): `api` không gọi `repository` trực tiếp; `domain` không phụ thuộc Spring và không gọi tầng khác; `service`/`repository`/`integration` không gọi ngược lên `api`.

Quy ước nhánh, commit và review: [CONTRIBUTING.md](CONTRIBUTING.md).

## Hợp đồng API, API giả và bộ thành phần giao diện (T02, T03, T05)

**Hợp đồng API** — nguồn sự thật duy nhất: [api/openapi.yaml](api/openapi.yaml) (REST + danh mục mã lỗi) và [api/sse-events.md](api/sse-events.md) (luồng SSE; cần BE và FE cùng duyệt).
- Backend: `./mvnw verify` có test hợp đồng — phản hồi thật phải khớp OpenAPI và enum mã lỗi Java phải khớp `x-catalog`; đỏ khi lệch.
- Frontend: sau khi sửa hợp đồng chạy `cd apps/web && npm run gen:api` để sinh lại `src/shared/api/schema.d.ts` (test sẽ đỏ nếu quên); chỗ nào dùng sai kiểu sẽ không biên dịch.
- Thao tác mới được hiện thực thì đổi `x-implemented: true` trong OpenAPI **và** thêm kịch bản vào `OpenApiContractTest`.

**Chạy giao diện không cần backend** (API giả MSW, mọi luồng đều chạy): `cd apps/web && VITE_API_MOCK=true npm run dev`. Tài khoản `minh` / `mat-khau-dung-123`. Từ khóa trong câu hỏi chọn kịch bản (`#not_found`, `#partial`, `#interrupted`, `#timeout`, `#llm-error`); tên tệp chọn kết quả xử lý (`password`, `scan`, `partial-scan`, `corrupt`, `toomany`).

**Bộ thành phần**: tokens ở `apps/web/src/shared/ui/tokens.css`, component ở `apps/web/src/shared/ui/`. Khi chạy dev mở `/design-system` để xem đủ Button, Input, Dialog, Toast, Tooltip, Skeleton và các trạng thái. Mọi màu/khoảng cách phải lấy từ tokens và mọi chuỗi hiển thị phải ở `src/shared/lib/messages.ts` (có test kiểm tra).

**Backend cần thêm cấu hình bắt buộc** `DOCCHAT_STORAGE_DIR` và `DOCCHAT_STORAGE_ENCRYPTION_KEY` (thiếu hoặc sai thì không khởi động và báo rõ biến). `GET /api/health` (sống) và `GET /api/ready` (CSDL + thư mục lưu tệp) không cần đăng nhập. Migration `db/vector` cần pgvector (có trong `docker-compose.yml`); PostgreSQL nhúng dùng cho test/`DevServer` không có pgvector nên bỏ qua thư mục này.
