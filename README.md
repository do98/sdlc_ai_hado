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
