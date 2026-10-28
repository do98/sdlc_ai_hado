# Kế hoạch phát triển (Implementation Plan) — Công cụ "Chat với tài liệu" (MVP)

> **Mã tài liệu:** IMP-DOCCHAT-001 · **Phiên bản:** 0.1 · **Trạng thái:** `Draft` · **Ngày:** 2026-10-28
> **Đầu vào:** [SAD.md](../design/SAD.md) · [UserStories_Screens.md](../requirements/UserStories_Screens.md) · [UserStories.md](../requirements/UserStories.md) · [PRD.md](../requirements/PRD.md) · [BRD.md](../requirements/BRD.md) · [UIUX_Blueprint.md](../design/UIUX_Blueprint.md) · bản thiết kế HTML trong [html_design](../design/html_design/index.html)
> **Chi tiết cho lập trình viên:** [Implement_story_tasks.md](Implement_story_tasks.md) (thẻ việc theo từng story: việc con, API, kiểm thử theo AC) · [Implement_tech_spec.md](Implement_tech_spec.md) (lược đồ CSDL, hợp đồng API/SSE, ports, RAG, cấu hình)
> **Quy ước:** `[Đề xuất]` = lựa chọn của người lập kế hoạch, chưa được xác nhận · `[TBD: OQ-xxx]` = chờ câu hỏi mở · cỡ việc: **S** ≈ 2, **M** ≈ 4, **L** ≈ 8, **XL** ≈ 13 ngày công.

---

## 0. Tóm tắt điều hành

**Mục tiêu.** Xây MVP "Chat với tài liệu": tải PDF, hỏi AI bằng tiếng Việt, nhận câu trả lời tổng hợp **kèm trích dẫn để kiểm chứng**; có đo lường để quyết định đầu tư tiếp sau pilot. Phạm vi gồm **23 user story** (16 P0, 5 P1, 2 P2), 77 tiêu chí chấp nhận, 9 màn hình.

**Cách tiếp cận.** Xây theo **lát cắt dọc** từ khung xương chạy được đến hoàn chỉnh; dùng **bản giả của dịch vụ AI** (ports của SAD) để không bị chặn bởi OQ-008; làm **bộ đánh giá chất lượng và kiểm thử cô lập quyền từ sớm** vì đây là hai rủi ro lớn nhất (câu trả lời sai, lộ dữ liệu).

**Ước lượng (độ tin cậy thấp, cần tính lại sau Giai đoạn 0).**

| Chỉ tiêu | Giá trị |
|---|---|
| Số việc | 62 việc trong 9 nhóm công việc |
| Tổng khối lượng | **322 ngày công** |
| Thời gian — kịch bản cơ sở (đệm 20%) | **15 sprint ≈ 30 tuần** (xếp lịch có xét phụ thuộc và năng lực) |
| Độ nhạy theo quy mô đội | 14–22 sprint tùy đội 10 → 6 người (mục 4.1) |
| Đường găng (nhân lực không giới hạn) | ≈ 73 ngày làm việc, không thể rút ngắn bằng cách thêm người |
| Đội kịch bản cơ sở | Trưởng nhóm kỹ thuật 1, Backend 2, Backend AI/truy xuất 1,5, Frontend 1,5, QA / SDET 1, DevOps / SRE 0,5, BA / PO 1 (FTE) `[Đề xuất]` |
| Pilot | Thời lượng chưa xác định `[TBD: OQ-011]` |

**Quyết định cần ngay (chặn lộ trình):** OQ-008 (dịch vụ AI bên ngoài), OQ-011 (ngân sách, thời hạn), OQ-014 (chủ sở hữu và người phê duyệt), OQ-016 (xác thực), OQ-007 (chia sẻ tài liệu), OQ-004/005/006 (giới hạn và ngưỡng). Chi tiết và phương án tạm ở mục 2.

**Rủi ro lớn nhất:** (1) OQ-008 bị từ chối → phải tự lưu trữ mô hình, tăng chi phí và thời gian; (2) chất lượng truy xuất tiếng Việt chưa đạt ngưỡng; (3) ước lượng dựa trên giả định. Xem mục 11.

---

## 1. Phạm vi

### 1.1 Trong phạm vi MVP

| Nhóm | Nội dung | Nguồn |
|---|---|---|
| Chức năng | 16 story **P0**, 5 story **P1**, 2 story **P2** (xem mục 7) | UserStories.md |
| Giao diện | 9 màn hình SCR-01..09 theo bản thiết kế HTML | UIUX_Blueprint §3.5 |
| Phi chức năng | NFR-001..006 (hiệu năng, bảo mật, sẵn sàng, kiểm toán) với ngưỡng ở mục 8, 12 | PRD §3.4 |
| Hạ tầng | Một vùng, 1 bản sao mỗi thành phần; staging và production; sao lưu | SAD §4.4 |

### 1.2 Ngoài phạm vi MVP

OCR cho PDF scan (OQ-010); định dạng khác PDF; kết nối kho tài liệu ngoài; ứng dụng di động gốc; đa vùng và hot standby; chế độ tối; đa ngôn ngữ ngoài tiếng Việt; microservices (BRD §5.2, SAD §1.1).

### 1.3 Nguyên tắc triển khai

1. **Khung xương trước, chi tiết sau:** mỗi giai đoạn kết thúc bằng một bản chạy được, demo được cho Product Owner.
2. **Ports trước, dịch vụ thật sau (ARC-004):** làm `IDocumentParser`, `IEmbeddingModel`, `IRetriever`, `IAnswerGenerator` với bản giả để phát triển và kiểm thử không phụ thuộc OQ-008.
3. **Bảo mật là yêu cầu xây dựng, không phải bước cuối:** lọc quyền trong truy vấn + RLS (ARC-008) và kiểm thử cô lập chạy trong CI từ khi có dữ liệu đầu tiên.
4. **Đo chất lượng từ sớm:** bộ đánh giá MET-002 chạy tự động khi có truy xuất; mọi thay đổi mô hình/tham số đều có số liệu so sánh.
5. **Tham số không hard-code:** giới hạn tệp (OQ-004), ngưỡng thời gian (OQ-005/006), ngưỡng T, K, số lượt ngữ cảnh (OQ-003) đều là cấu hình.
6. **Mỗi story có tiêu chí hoàn thành kiểm thử được:** mỗi AC của story P0 có ít nhất một kiểm thử tự động (QAS-05).

---

## 2. Giả định, điều kiện tiên quyết và quyết định chặn

### 2.1 Giả định kế hoạch `[Đề xuất]`

| ID | Giả định | Nếu sai |
|---|---|---|
| ASM-IMP-01 | Đội theo kịch bản cơ sở (mục 0), làm toàn thời gian theo FTE nêu; hệ số tập trung 0,7; sprint = 10 ngày làm việc | Thời gian thay đổi theo mục 4.1 (độ nhạy theo quy mô đội) |
| ASM-IMP-02 | Sprint 2 tuần; cuối mỗi sprint có bản demo cho Product Owner | — |
| ASM-IMP-03 | Công nghệ theo SAD §10.1 (React/TypeScript, Python/FastAPI, PostgreSQL + pgvector); đội đồng ý (OQ-021) | Tính lại các việc nền tảng |
| ASM-IMP-04 | Có môi trường IdP để thử và dịch vụ AI (sandbox) từ cuối Giai đoạn 0 | Làm việc với bản giả lâu hơn; trễ tích hợp |
| ASM-IMP-05 | Product Owner và 3–5 người dùng pilot rảnh để duyệt demo và cung cấp bộ dữ liệu kiểm thử (DEP-003) | Không đo được MET-002; G2 bị chặn |
| ASM-IMP-06 | Chỉ dùng PDF có lớp văn bản (ASM-001); PDF scan trả trạng thái lỗi | Cần OCR → thêm phạm vi (OQ-010) |

### 2.2 Ma trận quyết định chặn

| OQ | Chặn việc | Cần trước | Phương án tạm nếu chưa có `[Đề xuất]` |
|---|---|---|---|
| OQ-008 | IMP-004, 033, 040–043 (tích hợp dịch vụ AI thật); IMP-013 (egress); G4 | Cuối P0 (trước khi P2 bắt đầu tích hợp embedding thật) | Làm với bản giả và dữ liệu không nhạy cảm; **nếu bị từ chối**: kích hoạt rủi ro RSK-IMP-01 (tự lưu trữ mô hình), kế hoạch được tính lại |
| OQ-016 | IMP-020, 021 | Đầu P1 | Dùng IdP môi trường thử; cấu hình OIDC thay được; **không** tự xây tài khoản riêng |
| OQ-007 | IMP-022, 023, 062 | Đầu P2 | Chỉ "riêng tư cho chủ sở hữu" (PRIVATE); hoãn IMP-062; cột và bảng chia sẻ vẫn tạo trong lược đồ. **Nếu OQ-007 yêu cầu chia sẻ ngay ở MVP:** chuyển IMP-062 lên P4 (≈ +4 ngày công) |
| OQ-004 | IMP-030, 036 | Đầu P2 | Giá trị cấu hình (đang minh họa 50 MB / tệp); đổi không cần sửa mã |
| OQ-005, 006 | IMP-033, 076; G3 | Cuối P3 | Dùng ngân sách độ trễ SAD §5.1 làm mục tiêu thiết kế; đo và đề xuất ngưỡng thật cho sponsor |
| OQ-003 | IMP-070; G2 | Giữa P3 | Báo cáo xu hướng MET-002; ngưỡng chấp nhận do sponsor chốt trước G2 |
| OQ-011 | Lịch tuyệt đối, ngân sách dịch vụ AI | P0 | Kế hoạch dùng sprint tương đối từ ngày bắt đầu (T0) |
| OQ-013 | US-013, 015, 016, 020, 022 (tính năng BA đề xuất) | Đầu P3 | Giữ US-015 vì BR-014 là Must; các story còn lại có thể cắt, không ảnh hưởng P0 khác |
| OQ-014 | Chủ sở hữu chỉ số, phê duyệt cổng | P0 | — |
| OQ-015, 017 | IMP-063; G8 | Trước pilot | Lưu đến hết pilot; thông báo miễn trừ dạng nội dung cấu hình |
| OQ-018 | IMP-081, 087; mục tiêu RPO/RTO | Giữa P4 | Dùng RPO ≤ 15 phút (CSDL), ≤ 24 giờ (PDF), RTO ≤ 4 giờ như SAD §4.2 |
| OQ-010 | Phạm vi OCR | P0 | Không làm OCR ở MVP |
| OQ-019, 024 | Bố cục di động, kế hoạch trình duyệt | Đầu P1 | Ưu tiên máy tính để bàn; Chrome/Edge bản mới nhất và liền trước |
| OQ-020 | Quy tắc tệp trùng (US-002-AC3) | Đầu P2 | Cho phép trùng, mỗi lần tải là một tài liệu riêng |
| OQ-021, 022 | Stack, nền tảng, CI | P0 | Dùng stack SAD §10.1 |

---

## 3. Kiến trúc triển khai và cấu trúc mã nguồn

### 3.1 Cấu trúc kho mã `[Đề xuất]`

```text
docchat/
├─ apps/
│  ├─ web/                  # SPA (React/TS): features/{documents,chat,history,reports,admin}, shared/{design-system,api-client,auth,i18n,telemetry}
│  └─ api/                  # modular monolith (Python/FastAPI)
│     ├─ docchat/identity  ├─ documents  ├─ ingestion  ├─ retrieval
│     ├─ conversation      ├─ answering  ├─ reporting  └─ audit
│     ├─ ports/            # IDocumentParser, IEmbeddingModel, IRetriever, IAnswerGenerator
│     ├─ adapters/         # pdf_text, embedding_remote, hybrid_retriever, llm_answer, data_access, fakes
│     └─ worker/           # vòng chạy job: process_document, purge_document, weekly_report, retention_cleanup
├─ db/migrations/           # lược đồ và RLS
├─ eval/                    # bộ câu hỏi chuẩn, chấm điểm MET-002
├─ e2e/                     # kiểm thử Playwright theo AC
├─ infra/                   # IaC, cấu hình proxy, compose
└─ docs/                    # BRD, PRD, SAD, kế hoạch (đã có)
```

Quy tắc ranh giới (kiểm bằng lint): mô-đun chỉ gọi mô-đun khác qua interface công khai; `ports` không phụ thuộc `adapters`; mô-đun tính năng trong SPA chỉ phụ thuộc `shared` (Blueprint §3.3).

### 3.2 Nhánh, tích hợp và phát hành

- **Trunk-based** với nhánh ngắn và pull request bắt buộc review; mỗi PR phải qua CI (build, lint, đơn vị, quét, kiểm thử cô lập quyền).
- **Cờ tính năng** cho story P1/P2 (US-006, 013, 014, 016, 018, 020, 022, chia sẻ) để có thể cắt mà không dừng phát hành.
- **Migrations** chỉ tiến (forward-only) kèm kiểm thử trên bản sao dữ liệu mẫu; lược đồ v1 tạo đủ 12 bảng ngay từ P1 để tránh đổi lớn về sau.
- **Phiên bản:** gắn thẻ `v0.x` mỗi cuối giai đoạn; ảnh container bất biến, cùng một ảnh cho API và worker.

### 3.3 Môi trường

| Môi trường | Dùng cho | Dữ liệu | Dịch vụ AI | Ghi chú |
|---|---|---|---|---|
| Dev (máy nhà phát triển) | Phát triển, kiểm thử đơn vị | Giả (seed) | Bản giả / sandbox | docker compose (IMP-012) |
| CI | Kiểm thử tích hợp tự động | Tổng hợp | Bản giả | Chạy cô lập quyền, E2E rút gọn |
| Staging | Kiểm thử đầy đủ, đánh giá MET-002, demo | Tổng hợp | Sandbox / khóa riêng | Giống production (IMP-013) |
| Production (pilot) | Người dùng thật | **Thật (duy nhất)** | Dịch vụ thật qua egress | Phê duyệt tay (IMP-080) |
| Khôi phục (DR) | Khôi phục từ sao lưu | Từ sao lưu | Như production | Không hot standby; diễn tập ở IMP-087 |

---

## 4. Lộ trình theo giai đoạn

Lịch được **mô phỏng** theo từng ngày làm việc: mỗi vai trò có năng lực = FTE × 0,7; một việc chỉ bắt đầu khi các việc phụ thuộc đã xong; việc cỡ S/M do một người làm, L/XL tối đa hai người; sau đó cộng **đệm 20%** cho rủi ro và việc phát sinh. Vì vậy các giai đoạn **chồng lấn** (ví dụ SPA làm trước khi API xong nhờ bản giả, hạ tầng làm song song); cột "Tuần" là khoảng thời gian mà các việc của giai đoạn trải ra, không phải khối tuần nối tiếp.

| Giai đoạn | Tên | Sprint | Tuần (tương đối) | Việc | Ngày công |
|---|---|---|---|---|---|
| P0 | Khởi động và khảo sát kỹ thuật (spike) | S1–S3 | 1–6 | 7 | 32 |
| P1 | Nền tảng và đăng nhập (walking skeleton) | S1–S8 | 3–15 | 11 | 60 |
| P2 | Nạp tài liệu | S4–S10 | 8–20 | 13 | 76 |
| P3 | Hỏi đáp có trích dẫn | S5–S14 | 10–27 | 12 | 82 |
| P4 | Đo lường, bảo mật và cứng hóa | S3–S15 | 7–29 | 12 | 48 |
| P5 | Tính năng P1/P2 và sẵn sàng pilot | S7–S15 | 14–30 | 7 | 24 |

**Kịch bản cơ sở: 15 sprint ≈ 30 tuần, 322 ngày công**, chưa gồm thời gian pilot `[TBD: OQ-011]` và thời gian chờ quyết định. Hoàn tất giai đoạn = hoàn tất mọi việc của giai đoạn đó.

### 4.1 Độ nhạy theo quy mô đội và đường găng

| Kịch bản đội | FTE | Ngày làm việc (chưa đệm) | Sprint (đệm 20%) | Tuần |
|---|---|---|---|---|
| Gọn (6 FTE) | 6 | 179 | 22 | 44 |
| Vừa (7,5 FTE) | 7,5 | 167 | 21 | 42 |
| Cơ sở (8,5 FTE) — **cơ sở** | 8,5 | 124 | 15 | 30 |
| Mở rộng (10 FTE) | 10 | 111 | 14 | 28 |

- Khối lượng không đổi (322 ngày công) nhưng thời gian giảm chậm khi thêm người: **đường găng** (chuỗi việc phụ thuộc nhau) dài ≈ **73 ngày làm việc** ngay cả khi có nhân lực không giới hạn.
- Chuỗi găng: IMP-001 → IMP-010 → IMP-016 → IMP-020 → IMP-022 → IMP-040 → IMP-041 → IMP-043 → IMP-045 → IMP-052 → IMP-074 → IMP-085.
- Hệ quả cho quản lý: thêm người sau P1 ít rút ngắn lịch; rút ngắn hiệu quả hơn bằng cách **bắt đầu sớm** các việc trên đường găng (khảo sát P0, bộ dữ liệu IMP-005, bản giả ports) và **chốt sớm** OQ-008.

### P0 — Khởi động và khảo sát kỹ thuật (spike) (Sprint 1–3, chồng lấn với giai đoạn khác)

**Mục tiêu.** Chốt các quyết định chặn, kiểm chứng rủi ro kỹ thuật lớn nhất (đọc PDF, truy xuất tiếng Việt, mô hình sinh) và có bộ dữ liệu kiểm thử trước khi xây dựng.

**Việc chính (7):** IMP-001, IMP-002, IMP-003, IMP-004, IMP-005, IMP-006, IMP-007. **Khối lượng:** 32 ngày công.

**Story có việc trong giai đoạn này:** —.

**Tiêu chí kết thúc giai đoạn**

- Quyết định OQ-008, 016, 007, 004–006, 011, 014 đã ghi nhận (hoặc phương án tạm được sponsor ký).
- Có kết quả 4 spike (PDF, truy xuất tiếng Việt, mô hình sinh, nền tảng) và khuyến nghị chọn công nghệ.
- Có bộ dữ liệu kiểm thử và baseline MET-001.

**Demo:** Trình bày kết quả spike và đề xuất công nghệ.

### P1 — Nền tảng và đăng nhập (walking skeleton) (Sprint 1–8, chồng lấn với giai đoạn khác)

**Mục tiêu.** Có khung hệ thống chạy được từ đầu đến cuối với bản giả của các dịch vụ AI: CI/CD, cơ sở dữ liệu, API, SPA, đăng nhập.

**Việc chính (11):** IMP-010, IMP-011, IMP-012, IMP-013, IMP-014, IMP-015, IMP-016, IMP-018, IMP-019, IMP-020, IMP-021. **Khối lượng:** 60 ngày công.

**Story có việc trong giai đoạn này:** US-001, US-004, US-007, US-011.

**Tiêu chí kết thúc giai đoạn**

- Khung hệ thống chạy được trên staging: đăng nhập OIDC → API → CSDL → SPA.
- CI xanh, lược đồ v1 và RLS đã triển khai; bản giả của các ports hoạt động.
- Story US-001 đạt (AC1–AC4).

**Demo:** Đăng nhập thật, gọi API, thấy ứng dụng trống trên staging.

### P2 — Nạp tài liệu (Sprint 4–10, chồng lấn với giai đoạn khác)

**Mục tiêu.** Người dùng tải PDF lên, thấy trạng thái, tài liệu được xử lý thật (trích xuất, chia đoạn, embedding) và quản lý được tài liệu của mình.

**Việc chính (13):** IMP-017, IMP-022, IMP-030, IMP-031, IMP-032, IMP-033, IMP-034, IMP-035, IMP-036, IMP-037, IMP-071, IMP-072, IMP-080. **Khối lượng:** 76 ngày công.

**Story có việc trong giai đoạn này:** US-001, US-002, US-003, US-004, US-005, US-006, US-008, US-017, US-018, US-019, US-021.

**Tiêu chí kết thúc giai đoạn**

- Tải PDF thật → xử lý (trích xuất, chia đoạn, embedding) → READY/FAILED hiển thị đúng; xóa tài liệu có hiệu lực tức thì.
- Story US-002–005, 017 (P0), US-006, 018 (P1) đạt; kiểm thử cô lập quyền tự động xanh trong CI.
- Demo cho Product Owner trên staging.

**Demo:** Tải 3 PDF (đọc được, scan, sai định dạng) và xem trạng thái; xóa một tài liệu.

### P3 — Hỏi đáp có trích dẫn (Sprint 5–14, chồng lấn với giai đoạn khác)

**Mục tiêu.** Hỏi đáp end-to-end trên tài liệu thật theo luồng SSE, có trích dẫn, xử lý không tìm thấy, lỗi, hủy và nối tiếp; có bộ đánh giá chất lượng MET-002.

**Việc chính (12):** IMP-040, IMP-041, IMP-042, IMP-043, IMP-044, IMP-045, IMP-046, IMP-047, IMP-048, IMP-070, IMP-073, IMP-081. **Khối lượng:** 82 ngày công.

**Story có việc trong giai đoạn này:** US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-019, US-022.

**Tiêu chí kết thúc giai đoạn**

- Hỏi đáp end-to-end trên tài liệu thật: SSE, trích dẫn từ metadata, NOT_FOUND, lỗi, hủy, nối tiếp.
- Bộ đánh giá MET-002 chạy tự động; có số liệu cơ sở để sponsor chốt ngưỡng (OQ-003).
- Story US-007–013, 015, 016, 019 đạt.

**Demo:** Hỏi 5 câu trên bộ tài liệu mẫu: có nguồn, không tìm thấy, lỗi AI, hủy, hỏi tiếp; mở nguồn.

### P4 — Đo lường, bảo mật và cứng hóa (Sprint 3–15, chồng lấn với giai đoạn khác)

**Mục tiêu.** Hoàn tất yêu cầu bắt buộc còn lại (đo lường, kiểm toán, phân quyền quản trị), kiểm thử toàn diện, sao lưu, quan sát và đạt các cổng phát hành.

**Việc chính (12):** IMP-023, IMP-024, IMP-050, IMP-051, IMP-052, IMP-074, IMP-075, IMP-076, IMP-077, IMP-087, IMP-082, IMP-083. **Khối lượng:** 48 ngày công.

**Story có việc trong giai đoạn này:** US-012, US-017, US-019, US-021, US-022, US-023.

**Tiêu chí kết thúc giai đoạn**

- US-021–023 và đo lường hoạt động; kiểm toán truy vấn; sao lưu đã diễn tập khôi phục.
- Toàn bộ E2E story P0 xanh; kiểm thử truy cập, hiệu năng, prompt injection đạt.
- Cổng G1–G7 đạt hoặc có kế hoạch xử lý được sponsor chấp nhận.

**Demo:** Báo cáo tuần, kiểm thử cô lập quyền, diễn tập khôi phục, bảng điều khiển quan sát.

### P5 — Tính năng P1/P2 và sẵn sàng pilot (Sprint 7–15, chồng lấn với giai đoạn khác)

**Mục tiêu.** Bổ sung tính năng nên có, tài liệu vận hành, đào tạo người dùng pilot và quyết định go/no-go phát hành.

**Việc chính (7):** IMP-060, IMP-061, IMP-062, IMP-063, IMP-084, IMP-085, IMP-086. **Khối lượng:** 24 ngày công.

**Story có việc trong giai đoạn này:** US-014, US-020.

**Tiêu chí kết thúc giai đoạn**

- Tính năng P1/P2 đã chọn đạt AC; runbook, hướng dẫn người dùng, kênh phản hồi sẵn sàng.
- Cổng G8, G9 đạt; họp go/no-go thông qua; pilot bắt đầu.

**Demo:** Dùng thử với người dùng pilot; go/no-go.

### Mốc chính

| Mốc | Sau giai đoạn | Ý nghĩa | Cổng liên quan |
|---|---|---|---|
| M0 | P0 | Quyết định chặn đã chốt, công nghệ được chọn, có dữ liệu kiểm thử | DEP-003, DEP-004 |
| M1 | P1 | Khung xương chạy được trên staging, đăng nhập thật | — |
| M2 | P2 | Nạp và quản lý tài liệu hoàn chỉnh, cô lập quyền được kiểm thử | G4 (một phần) |
| M3 | P3 | Hỏi đáp có trích dẫn end-to-end, có số liệu chất lượng | G2 |
| M4 | P4 | Ứng viên phát hành: đủ P0, kiểm thử toàn diện, sao lưu, quan sát | G1, G3–G7 |
| M5 | P5 | Sẵn sàng pilot, go/no-go | G8, G9 |

---

## 5. Phân rã công việc theo nhóm

Mỗi việc có mã `IMP-xxx`, giai đoạn, vai trò chính, cỡ, phụ thuộc và truy vết về story, SAD hoặc câu hỏi mở. Vai trò: **TL** = Trưởng nhóm kỹ thuật · **BE** = Backend · **AI** = Backend AI/truy xuất · **FE** = Frontend · **QA** = QA / SDET · **DO** = DevOps / SRE · **BA** = BA / PO.

### WS-0 — Khởi động và khảo sát kỹ thuật

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-001 | P0 | Họp chốt quyết định chặn: OQ-008, 016, 007, 004, 005, 006, 011, 014 (chủ sở hữu, hạn) | BA | S | — | BRD §12 |
| IMP-002 | P0 | Spike A: chất lượng trích xuất PDF trên 20 tệp thật (tỉ lệ scan, bảng, nhiều cột) → xác nhận ASM-001 | BE | M | — | RSK-003 · SAD ARR-03 |
| IMP-003 | P0 | Spike B: truy xuất lai tiếng Việt: so sánh 2–3 mô hình embedding, toàn văn cấu hình simple, RRF; đo trên bộ mẫu | AI | L | IMP-005 | SAD ARC-006, ARR-02 |
| IMP-004 | P0 | Spike C: mô hình sinh + prompt; kiểm tra mô hình chỉ trả số nguồn, hành vi khi thiếu ngữ cảnh, prompt injection | AI | L | IMP-005 | SAD ARC-007, ARR-04 |
| IMP-005 | P0 | Thu thập bộ kiểm thử DEP-003 (≥ 10 PDF, ≥ 100 câu hỏi có đáp án) và đo baseline thủ công DEP-004 | BA | M | — | DEP-003, DEP-004 · MET-001, MET-002 |
| IMP-006 | P0 | Spike D: nền tảng triển khai (đám mây hay tự lưu trữ), registry, IdP môi trường thử | DO | M | IMP-001 | OQ-008, 011, 022 · SAD §4.4 |
| IMP-007 | P0 | Rà soát bảo mật sơ bộ luồng dữ liệu gửi tới dịch vụ AI; đặt lịch review DEP-002 | TL | S | IMP-001 | RSK-002 · SAD §4.1.2 |

### WS-A — Nền tảng kỹ thuật

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-010 | P1 | Khởi tạo kho mã: cấu trúc modular monolith (7 mô-đun + ports), quy tắc lint ranh giới mô-đun, quy ước mã | TL | M | IMP-001 | SAD §1.2, §2.2 · ARC-001, 002 |
| IMP-011 | P1 | CI: build, lint, kiểm thử đơn vị, quét phụ thuộc và bí mật | DO | M | IMP-010 | SAD §4.4 |
| IMP-012 | P1 | Ảnh container (API và worker dùng chung); docker compose dev: PostgreSQL + pgvector, object storage cục bộ, Redis tùy chọn | DO | M | IMP-010 | SAD §4.4 · ARC-005 |
| IMP-013 | P1 | Hạ tầng staging bằng mã (IaC): reverse-proxy + TLS, mạng nội bộ, secret manager, egress allow-list | DO | L | IMP-006, IMP-012 | SAD §4.1.2, §4.4 |
| IMP-014 | P1 | Lược đồ CSDL v1 và migrations (12 bảng), chỉ mục HNSW/GIN, Row-Level Security | BE | L | IMP-010 | SAD §3.1 · ARC-003, 008 |
| IMP-015 | P1 | Hàng đợi job trong PostgreSQL (SKIP LOCKED), retry lũy thừa, idempotent; vòng chạy worker | BE | M | IMP-014 | SAD §2.2 · ARC-005 |
| IMP-016 | P1 | Khung API: middleware JWT, request-id, giới hạn tần suất, lỗi RFC 9457, OpenAPI, /healthz /readyz | BE | M | IMP-010 | SAD §2.4, §4.1, §4.2 |
| IMP-017 | P2 | Quan sát: log JSON có correlation id (không ghi nội dung), metric, khung OpenTelemetry | DO | M | IMP-016 | SAD §4.3 · QAS-06 |
| IMP-018 | P1 | Khung SPA: React/TypeScript, token thiết kế, app shell, api-client (REST + SSE), i18n tiếng Việt, error-boundary | FE | L | IMP-010 | Blueprint §3.1–3.3 · UXC-08 |
| IMP-019 | P1 | Interface (ports) và bản giả: IDocumentParser, IEmbeddingModel, IRetriever, IAnswerGenerator để phát triển không cần dịch vụ AI thật | BE | M | IMP-010 | SAD ARC-004 |

### WS-B — Xác thực và phân quyền

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-020 | P1 | Đăng nhập OIDC phía API: kiểm tra JWKS, ánh xạ người dùng, vai trò, danh sách người dùng được cấp quyền | BE | L | IMP-016, IMP-014 | US-001 · SAD §4.1.1 |
| IMP-021 | P1 | SPA đăng nhập OIDC (PKCE), AuthGuard, xử lý hết hạn phiên (SCR-01) | FE | M | IMP-018, IMP-020 | US-001 · SCR-01 |
| IMP-022 | P2 | Phân quyền tài liệu: tập tài liệu được xem, document_shares, RLS và kiểm thử cô lập | BE | L | IMP-014, IMP-020 | US-021, 008 · ARC-008 |
| IMP-023 | P4 | Quản trị cấp/thu hồi quyền: API + SCR-07 (màn hình đề xuất, chờ OQ-007, OQ-016) | BE | M | IMP-022 | UC-17, US-021 · SCR-07 |
| IMP-024 | P4 | Mô-đun audit: audit_log chỉ-thêm; ghi đăng nhập, tải lên, xóa, đổi quyền, mỗi truy vấn | BE | M | IMP-014 | NFR-006 · SAD §4.1.2 |

### WS-C — Nạp và quản lý tài liệu

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-030 | P2 | POST /documents: kiểm tra magic bytes, dung lượng, số trang; ghi documents + jobs trong một giao dịch | BE | L | IMP-015, IMP-031 | US-002, 003, 006 · SAD §3.2.1 |
| IMP-031 | P2 | Bộ điều hợp object storage: khóa đối tượng, mã hóa phía máy chủ | BE | S | IMP-012 | SAD §2.3 |
| IMP-032 | P2 | PdfTextParser: trích văn bản theo trang, nhận diện scan/hỏng/mật khẩu, chia đoạn ~500 token chồng lấn ~50 | AI | L | IMP-002, IMP-019 | US-005 · SAD §3.1.4 |
| IMP-033 | P2 | Worker process_document: embedding theo lô, ghi đoạn, chuyển READY/FAILED, retry; chỉ READY sau khi ghi đủ đoạn | AI | L | IMP-015, IMP-032, IMP-003 | US-004, 005 · SAD §3.2.1 |
| IMP-034 | P2 | GET /documents, DELETE (xóa mềm có hiệu lực tức thì) và job purge | BE | M | IMP-022, IMP-015 | US-017, 018, 019 · SAD §3.2.3 |
| IMP-035 | P2 | SPA: ngăn tài liệu (danh sách, chip trạng thái, thăm dò 3 s, trạng thái trống/lỗi) — SCR-02 | FE | L | IMP-018, IMP-034 | US-004, 005, 017 · SCR-02 |
| IMP-036 | P2 | SPA: vùng tải lên + hàng chờ (đa tệp, 3 tệp đồng thời, từ chối, thử lại) — SCR-03 | FE | L | IMP-018, IMP-030 | US-002, 003, 006 · SCR-03 |
| IMP-037 | P2 | SPA: menu thao tác tài liệu + hộp thoại xác nhận xóa — SCR-09 | FE | S | IMP-035, IMP-034 | US-018 · SCR-09 |

### WS-D — Hỏi đáp có trích dẫn

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-040 | P3 | HybridRetriever: vector HNSW + toàn văn GIN + RRF, lọc quyền và phạm vi ngay trong truy vấn | AI | XL | IMP-003, IMP-022, IMP-033 | US-008, 009, 014 · SAD §3.2.2 · ARC-006, 008 |
| IMP-041 | P3 | AnswerService: viết lại câu nối tiếp, ngưỡng NOT_FOUND, dựng prompt chống injection, kiểm tra số nguồn → citation từ metadata | AI | L | IMP-004, IMP-040 | US-008–011, 013, 015 · ARC-007 |
| IMP-042 | P3 | LlmAnswerGenerator: streaming, timeout, retry một lần, circuit breaker | AI | L | IMP-004, IMP-019 | US-012 · SAD §4.2 |
| IMP-043 | P3 | Mô-đun conversation + POST /sessions/{id}/questions (SSE: token, citations, done, error), lưu Answer/Citations | BE | L | IMP-041, IMP-042, IMP-014 | US-007, 012, 013, 015 · SAD §2.4 |
| IMP-044 | P3 | GET /citations/{id}: kiểm quyền lại tại thời điểm xem | BE | S | IMP-043 | US-015, 016 |
| IMP-045 | P3 | SPA hội thoại: khung chat, ô nhập, SSE, trạng thái đang chờ/đang nhận/lỗi/hủy/mất mạng, thử lại | FE | XL | IMP-018, IMP-043 | US-007–013 · SCR-02 |
| IMP-046 | P3 | SPA: chip trích dẫn + ngăn xem nguồn — SCR-04 | FE | M | IMP-045, IMP-044 | US-015, 016 · SCR-04 |
| IMP-047 | P3 | SPA: vùng aria-live, bàn phím, cuộn thông minh, nút "Xuống tin mới" | FE | M | IMP-045 | UXS-02, UXS-07 |
| IMP-048 | P3 | Tham số RAG (K, ngưỡng T, số lượt ngữ cảnh) đưa ra cấu hình + công cụ chỉnh | AI | S | IMP-041 | SAD §3.2.2 · OQ-003 |

### WS-E — Đo lường và báo cáo

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-050 | P4 | Sự kiện sử dụng (usage_events) và phát sự kiện PRD §5.2, không kèm nội dung | BE | M | IMP-014, IMP-016 | US-022, 023 · PRD §5.2 · QAS-06 |
| IMP-051 | P4 | POST feedback, GET /reports/weekly, job weekly_report | BE | M | IMP-050, IMP-015 | US-022, 023 |
| IMP-052 | P4 | SPA: báo cáo tuần (SCR-06) và nút đánh giá câu trả lời | FE | M | IMP-051, IMP-045 | US-022, 023 · SCR-06 |

### WS-F — Tính năng P1/P2

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-060 | P5 | Phạm vi hỏi: ScopeSelector (UI) + tham số documentIds (API) | FE | M | IMP-045, IMP-040 | US-014 (P2) |
| IMP-061 | P5 | Lịch sử phiên: GET sessions/messages, SCR-05, phân trang theo con trỏ | BE | M | IMP-043 | US-020 (P2) · SCR-05 |
| IMP-062 | P5 | Chia sẻ tài liệu: API + UI (chỉ làm khi OQ-007 chốt) | BE | M | IMP-022 | US-021 · OQ-007 |
| IMP-063 | P5 | Job retention_cleanup theo OQ-015 | BE | S | IMP-015 | OQ-015 · BRU-006 |

### WS-G — Chất lượng và kiểm thử

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-070 | P3 | Bộ đánh giá MET-002 tự động: chạy bộ câu hỏi chuẩn, chấm đúng/sai + trích dẫn đúng, lưu lịch sử theo bản phát hành | AI | L | IMP-005, IMP-041 | MET-002 · SAD §4.3 |
| IMP-071 | P2 | Kiểm thử cô lập quyền tự động (AC-020/021, IDOR, RLS) — chạy trong CI | QA | M | IMP-022 | AC-020, AC-021 · QAS-02 |
| IMP-072 | P2 | E2E tự động (Playwright): story đăng nhập và nạp tài liệu (US-001–005) | QA | L | IMP-036, IMP-035 | US-001–005 |
| IMP-073 | P3 | E2E tự động: story hỏi đáp và trích dẫn (US-007–012, 015) | QA | L | IMP-046 | US-007–012, 015 |
| IMP-074 | P4 | E2E tự động: story còn lại (US-017, 019, 021, 023) và hồi quy xóa tài liệu (BR-018) | QA | M | IMP-052, IMP-034 | US-017, 019, 021, 023 |
| IMP-075 | P4 | Kiểm thử truy cập: axe tự động trong CI + 5 luồng thủ công bằng bàn phím và trình đọc màn hình | QA | M | IMP-047 | UXS-02 · OQ-025 |
| IMP-076 | P4 | Kiểm thử hiệu năng: độ trễ câu hỏi, thời gian xử lý tài liệu, tải đồng thời pilot | QA | M | IMP-043, IMP-033 | NFR-001, 002 · OQ-005, 006 |
| IMP-077 | P4 | Kiểm thử prompt injection và trích dẫn bịa (tài liệu có chỉ dẫn ẩn) | QA | M | IMP-041 | ARR-04 · SAD §4.1.3 |

### WS-H — Vận hành và phát hành

| ID | GĐ | Việc | Vai trò | Cỡ | Phụ thuộc | Truy vết |
|---|---|---|---|---|---|---|
| IMP-080 | P2 | Pipeline staging → production, phê duyệt tay, hoàn tác, migrations an toàn | DO | M | IMP-013, IMP-011 | SAD §4.4 |
| IMP-081 | P3 | Thiết lập sao lưu: PostgreSQL (đầy đủ + WAL) và PDF theo ngày, mã hóa | DO | M | IMP-013 | SAD §4.2 · OQ-018 |
| IMP-087 | P4 | Diễn tập khôi phục từ sao lưu, đo RPO/RTO thực tế | DO | M | IMP-081 | SAD §4.2 · OQ-018 · G6 |
| IMP-082 | P4 | Dashboard và cảnh báo theo bảng metric (độ trễ, lỗi, hàng đợi, chi phí token, cô lập quyền = 0) | DO | M | IMP-017 | SAD §4.3 |
| IMP-083 | P4 | Review bảo mật (DEP-002): egress, bí mật, mã hóa, dò quét nhẹ; xử lý phát hiện | TL | M | IMP-013 | DEP-002 · RSK-002 · G4 |
| IMP-084 | P5 | Runbook vận hành, hướng dẫn ngắn cho người dùng pilot, kênh phản hồi | BA | M | IMP-080, IMP-081 | G9 |
| IMP-085 | P5 | Pilot: onboarding, theo dõi MET-001..004, họp go/no-go | BA | M | IMP-084, IMP-074, IMP-076, IMP-077, IMP-083, IMP-087 | BO-003 · MET-003, 004 (ứng viên phát hành đã qua kiểm thử) |
| IMP-086 | P5 | Đồng bộ tài liệu: cập nhật BRD §12, PRD, SAD, class/sequence diagram theo bản thực tế | BA | S | IMP-074 | Kỷ luật tài liệu |

---

## 6. Khối lượng và năng lực theo vai trò

Ngày công theo giai đoạn (cỡ S=2, M=4, L=8, XL=13) so với năng lực mỗi sprint (7 ngày hiệu quả × FTE) theo **kịch bản cơ sở**. *Mức sử dụng* = tổng ngày công ÷ năng lực trong 124 ngày làm việc của lịch mô phỏng.

| Vai trò | FTE | Năng lực / sprint | P0 | P1 | P2 | P3 | P4 | P5 | Tổng | Mức sử dụng |
|---|---|---|---|---|---|---|---|---|---|---|
| Trưởng nhóm kỹ thuật | 1 | 7 | 2 | 4 | — | — | 4 | — | 10 | 12% |
| Backend | 2 | 14 | 4 | 28 | 22 | 10 | 16 | 10 | 90 | 52% |
| Backend AI/truy xuất | 1,5 | 10,5 | 16 | — | 16 | 39 | — | — | 71 | 55% |
| Frontend | 1,5 | 10,5 | — | 12 | 18 | 21 | 4 | 4 | 59 | 45% |
| QA / SDET | 1 | 7 | — | — | 12 | 8 | 16 | — | 36 | 41% |
| DevOps / SRE | 0,5 | 3,5 | 4 | 16 | 8 | 4 | 8 | — | 40 | 92% |
| BA / PO | 1 | 7 | 6 | — | — | — | — | 10 | 16 | 18% |

**Nhận xét.**
- Vai trò dùng nhiều nhất: **DevOps / SRE** (92%) và **Backend AI/truy xuất** (55%) — đây là điểm nghẽn của lịch; mức thấp ở các vai trò khác cho thấy việc của họ bị **chờ phụ thuộc**, không phải thiếu việc.
- **Backend AI/truy xuất** gánh P3 (truy xuất, trả lời, bộ đánh giá); nếu chỉ có 1 người ở vai trò này (kịch bản Vừa, Gọn), nên giảm phạm vi P3 trước khi giảm chất lượng.
- **QA** có tải dồn ở P2–P4; viết kiểm thử song song với phát triển, không dồn cuối.
- **DevOps** (0,5 FTE ở kịch bản cơ sở) là **điểm nghẽn thực sự** của lịch (92% công suất): hạ tầng, CI/CD, sao lưu và quan sát đều nằm trên một người. **Nâng DevOps lên 1 FTE đưa lịch cơ sở từ 15 xuống 15 sprint** (khuyến nghị); nếu không, chuyển bớt việc IaC cho Backend. Hạ tầng staging (IMP-013) cũng là nơi dễ trễ nếu OQ-022 chậm. Sao lưu và diễn tập khôi phục đã được tách ra (IMP-081, IMP-087) để không dồn cuối.
- Con số là **ước lượng thô theo cỡ áo**; cần ước lượng lại từng việc sau P0 (kết quả spike) và sau mỗi sprint theo vận tốc thực tế.

---

## 7. Ma trận story → công việc → màn hình → API

Thứ tự phát triển theo [UserStories.md §3.4](../requirements/UserStories.md): nền tảng → nạp tài liệu → hỏi đáp lõi → đo lường → P1 → P2. Ảnh minh họa từng story xem [UserStories_Screens.md](../requirements/UserStories_Screens.md).

| Story | Ưu tiên | Màn hình | API chính | Việc triển khai | Giai đoạn hoàn tất |
|---|---|---|---|---|---|
| US-001 | P0 | SCR-01 | GET /me | IMP-016, IMP-020, IMP-021, IMP-072 | P2 |
| US-002 | P0 | SCR-02, 03 | POST /documents | IMP-030, IMP-031, IMP-035, IMP-036, IMP-072 | P2 |
| US-003 | P0 | SCR-03 | POST /documents | IMP-030, IMP-036, IMP-072 | P2 |
| US-004 | P0 | SCR-02 | GET /documents | IMP-015, IMP-033, IMP-035, IMP-072 | P2 |
| US-005 | P0 | SCR-02 | GET /documents | IMP-032, IMP-033, IMP-035, IMP-072 | P2 |
| US-006 | P1 | SCR-03 | POST /documents | IMP-030, IMP-036 | P2 |
| US-007 | P0 | SCR-02 | POST /sessions · POST /sessions/{id}/questions | IMP-019, IMP-043, IMP-045, IMP-073 | P3 |
| US-008 | P0 | SCR-02 | POST /sessions/{id}/questions | IMP-022, IMP-040, IMP-041 | P3 |
| US-009 | P0 | SCR-02 | POST /sessions/{id}/questions | IMP-040, IMP-041, IMP-073 | P3 |
| US-010 | P0 | SCR-02 | POST /sessions/{id}/questions | IMP-041, IMP-045, IMP-073 | P3 |
| US-011 | P0 | SCR-02 | POST /sessions/{id}/questions | IMP-018, IMP-041, IMP-045 | P3 |
| US-012 | P0 | SCR-02 | POST /sessions/{id}/questions (SSE) | IMP-042, IMP-043, IMP-045, IMP-076 | P4 |
| US-013 | P1 | SCR-02 | POST /sessions/{id}/questions | IMP-041, IMP-043, IMP-045 | P3 |
| US-014 | P2 | SCR-02 | documentIds trong câu hỏi | IMP-040, IMP-060 | P5 |
| US-015 | P0 | SCR-02 | sự kiện citations | IMP-041, IMP-043, IMP-044, IMP-046, IMP-073 | P3 |
| US-016 | P1 | SCR-04 | GET /citations/{id} | IMP-044, IMP-046 | P3 |
| US-017 | P0 | SCR-02 | GET /documents | IMP-034, IMP-035, IMP-074 | P4 |
| US-018 | P1 | SCR-09 | DELETE /documents/{id} | IMP-034, IMP-037 | P2 |
| US-019 | P0 | SCR-02 | DELETE /documents/{id} | IMP-034, IMP-040, IMP-074 | P4 |
| US-020 | P2 | SCR-05 | GET /sessions · GET /sessions/{id}/messages | IMP-061 | P5 |
| US-021 | P0 | SCR-02, 07, 08 | PATCH /documents/{id}/share · /admin/users | IMP-022, IMP-023, IMP-071, IMP-074 | P4 |
| US-022 | P1 | SCR-02 | POST /answers/{id}/feedback | IMP-047, IMP-050, IMP-051, IMP-052 | P4 |
| US-023 | P0 | SCR-06 | GET /reports/weekly | IMP-050, IMP-051, IMP-052, IMP-074 | P4 |

**Kiểm tra truy vết:** 23/23 story có ít nhất một việc; 0 việc phụ thuộc việc ở giai đoạn muộn hơn; không story P0 nào cần việc ở P5.

### 7.1 Chia lát cắt dọc (đề xuất thứ tự làm trong mỗi story lớn)

| Story lớn | Lát cắt 1 (khung xương) | Lát cắt 2 | Lát cắt 3 |
|---|---|---|---|
| Hỏi đáp (US-007..015) | Gửi câu hỏi → bản giả trả lời cố định qua SSE → hiển thị (kiểm khung SSE, SPA) | Truy xuất thật + mô hình thật + trích dẫn từ metadata | NOT_FOUND, lỗi, quá hạn, hủy, mất mạng, nối tiếp |
| Nạp tài liệu (US-002..006) | Tải 1 PDF → READY (parser và embedding giả) | Parser và embedding thật; FAILED có lý do | Đa tệp, hàng chờ, thử lại, xóa |
| Phân quyền (US-021) | Chỉ chủ sở hữu thấy tài liệu của mình | Lọc quyền trong truy vấn tìm kiếm + RLS + kiểm thử cô lập | Chia sẻ (sau OQ-007) |

---

## 8. Chiến lược kiểm thử và chất lượng

| Lớp | Công cụ `[Đề xuất]` | Phạm vi | Việc |
|---|---|---|---|
| Kiểm thử đơn vị | pytest, Vitest | Logic mô-đun, chia đoạn, RRF, kiểm tra trích dẫn, máy trạng thái | Mọi việc BE/FE; độ phủ logic ≥ 80% |
| Kiểm thử hợp đồng | OpenAPI + schemathesis; kiểm thử sự kiện SSE | API và luồng SSE đúng hợp đồng SAD §2.4, Blueprint §3.5.4 | IMP-016, 043 |
| Kiểm thử tích hợp | pytest + PostgreSQL thật (container) | Giao dịch tài liệu+job, RLS, truy vấn lai, hàng đợi, retry | IMP-014, 015, 033, 040 |
| **Cô lập quyền** | pytest + người dùng giả nhiều vai trò | 0 rò rỉ giữa người dùng (NFR-004), IDOR → 404, thu hồi quyền | **IMP-071** (chạy mỗi PR) |
| E2E theo AC | Playwright | Mỗi AC của story P0 ≥ 1 kiểm thử; mã kiểm thử gắn `US-xxx-ACn` | IMP-072, 073, 074 |
| Chất lượng câu trả lời | Bộ đánh giá `eval/` | MET-002: đúng, trích dẫn đúng, tỉ lệ NOT_FOUND; so sánh theo bản | **IMP-070** (mỗi lần đổi mô hình/tham số) |
| Truy cập | axe trong CI + thủ công | WCAG 2.1 AA 5 luồng chính | IMP-075 |
| Hiệu năng | k6 | Độ trễ câu hỏi, thời gian xử lý tài liệu, ≈ 5 truy vấn đồng thời | IMP-076 |
| Bảo mật | Quét phụ thuộc/bí mật, kiểm thử injection | Prompt injection, trích dẫn bịa, XSS qua nội dung AI | IMP-011, 077, 083 |
| Khôi phục | Diễn tập | Khôi phục từ sao lưu, đo RPO/RTO | IMP-081, 087 |

**Quy ước đặt tên:** mỗi kiểm thử E2E có mã `US-xxx-ACn` để báo cáo độ phủ AC tự động; bản dựng không qua cổng nếu một AC của story P0 không có kiểm thử.

---

## 9. CI/CD và phát hành

```text
PR → build → lint (gồm ranh giới mô-đun) → kiểm thử đơn vị → quét phụ thuộc/bí mật → tích hợp + cô lập quyền
   → (nhánh chính) ảnh container bất biến → triển khai staging → E2E + eval MET-002 → phê duyệt tay → production
```

- **Hoàn tác:** giữ ảnh bản trước; migrations chỉ tiến nên thay đổi lược đồ theo kiểu tương thích ngược (mở rộng rồi thu hẹp).
- **Cửa sổ triển khai:** ngoài giờ làm việc nếu không có cập nhật cuốn chiếu (SAD §4.4).
- **Bí mật:** tiêm khi khởi động từ secret manager; không có trong ảnh hay mã nguồn; xoay vòng ≥ 90 ngày.
- **Quan sát:** log JSON không chứa nội dung; dashboard và cảnh báo theo SAD §4.3 (IMP-082).

---

## 10. Cổng chất lượng và tiêu chí phát hành

Ánh xạ cổng phát hành của [PRD §5.1](../requirements/PRD.md) tới việc cụ thể:

| Cổng | Tiêu chí | Việc đảm bảo | Giai đoạn |
|---|---|---|---|
| G1 | 100% story P0 (16) đạt AC | IMP-072, 073, 074 | P4 |
| G2 | MET-002 đạt ngưỡng trên ≥ 100 câu `[TBD: OQ-003]` | IMP-005, 070, 048 | P3–P4 |
| G3 | NFR-001, 002 đạt `[TBD: OQ-005, 006]` | IMP-076 | P4 |
| G4 | 0 rò rỉ quyền; Bảo mật/Pháp chế phê duyệt | IMP-071, 083, 007 | P2, P4 |
| G5 | 0 lỗi Blocker/Critical đang mở | Quy trình lỗi (mục 13) | P4 |
| G6 | 100% AC P0 đã chạy và đạt; hồi quy phân quyền và xóa | IMP-072, 073, 074 | P4 |
| G7 | Báo cáo tuần và sự kiện đo lường hoạt động | IMP-050, 051, 052 | P4 |
| G8 | Quyết định lưu giữ dữ liệu và thông báo miễn trừ | OQ-015, 017; IMP-063 | P5 |
| G9 | Hướng dẫn người dùng pilot, kênh phản hồi | IMP-084 | P5 |

### 10.1 Định nghĩa sẵn sàng (DoR) cho một story đưa vào sprint

- AC đã rõ; mọi giá trị `[TBD]` của story đã có số hoặc đã được đặt thành cấu hình với giá trị tạm do PO duyệt.
- Có màn hình thiết kế tương ứng ([UserStories_Screens.md](../requirements/UserStories_Screens.md)) và hợp đồng API (SAD §2.4).
- Phụ thuộc kỹ thuật (bản giả, dữ liệu mẫu) đã sẵn có.

### 10.2 Định nghĩa hoàn thành (DoD)

Kế thừa [UserStories.md §4](../requirements/UserStories.md), bổ sung:
- Mọi AC có kiểm thử tự động gắn mã `US-xxx-ACn`; PR đã review; không lỗi Blocker/Critical liên quan.
- Không có nội dung tài liệu/câu hỏi trong log, metric, telemetry (kiểm bằng kiểm thử).
- Sự kiện đo lường liên quan (PRD §5.2) được phát; thông báo người dùng đúng văn bản ở Blueprint §3.5.5.
- Tài liệu cập nhật nếu hợp đồng API hoặc hành vi thay đổi.

---

## 11. Rủi ro triển khai

| ID | Rủi ro | Mức | Giảm thiểu | Chủ sở hữu |
|---|---|---|---|---|
| RSK-IMP-01 | OQ-008 bị từ chối hoặc trễ → không dùng được dịch vụ AI ngoài (SAD ARR-01) | Cao | Ports + bản giả; spike C và D sớm; đặt hạn quyết định cuối P0; nếu từ chối, dừng và tính lại kế hoạch (tự lưu trữ mô hình, GPU) | Sponsor / TL |
| RSK-IMP-02 | Chất lượng truy xuất tiếng Việt chưa đạt (ARR-02) | Cao | Spike B; bộ đánh giá IMP-070 từ P3; thử reranker, đổi chunking; thời gian đệm 1 sprint cho tinh chỉnh | AI |
| RSK-IMP-03 | Lỗi cô lập quyền → lộ tài liệu | Cao | Lọc quyền trong truy vấn + RLS; IMP-071 chạy mỗi PR; review bảo mật bắt buộc (IMP-083) | TL / QA |
| RSK-IMP-04 | Ước lượng sai do dựa trên cỡ áo và giả định đội | Trung bình | Tính lại sau P0; theo dõi vận tốc từng sprint; đệm 20% | TL |
| RSK-IMP-05 | Thiếu bộ dữ liệu thật (DEP-003) → G2 không đo được | Trung bình | Thu thập từ P0 (IMP-005); phương án tổng hợp để phát triển, nhưng G2 cần dữ liệu thật | BA / PO |
| RSK-IMP-06 | Trượt phạm vi (RSK-005): thêm tính năng ngoài P0 | Trung bình | Khóa P0; thay đổi theo quy trình kiểm soát; cờ tính năng cho P1/P2 | PO |
| RSK-IMP-07 | Nền tảng hạ tầng chậm (OQ-022) | Trung bình | Dev bằng compose; IaC; bắt đầu IMP-013 ngay khi OQ-008 và OQ-022 chốt | DO |
| RSK-IMP-08 | Chi phí dịch vụ AI vượt dự toán (RSK-006) | Trung bình | Ngưỡng bỏ gọi AI khi NOT_FOUND; giới hạn tần suất; metric token theo ngày; ngân sách theo người dùng | AI / PO |
| RSK-IMP-09 | PDF phức tạp (bảng, nhiều cột, scan) (RSK-003) | Trung bình | Spike A; FAILED có lý do; OCR là mở rộng sau | AI |
| RSK-IMP-10 | Prompt injection qua nội dung PDF (ARR-04) | Trung bình | Prompt tách dữ liệu; mô hình không có công cụ; kiểm tra đầu ra; IMP-077 | AI / QA |
| RSK-IMP-11 | Đội nhỏ, kiến thức tập trung vào ít người | Trung bình | Review chéo bắt buộc; tài liệu ADR; luân phiên vai trò ở mô-đun then chốt | TL |
| RSK-IMP-12 | Người dùng pilot hoặc PO không sẵn sàng duyệt/đo | Trung bình | Lịch demo cố định mỗi sprint; chọn người dùng pilot từ P2 | PO |
| RSK-IMP-13 | Mô hình sinh thay đổi hành vi theo thời gian hoặc nhà cung cấp | Thấp | Ghim phiên bản mô hình; eval trước khi nâng cấp | AI |

---

## 12. Vai trò, nghi thức và cộng tác `[Đề xuất]`

| Vai trò | Trách nhiệm chính trong kế hoạch |
|---|---|
| Executive sponsor | Chốt OQ-008, OQ-011; ngưỡng thành công (OQ-002, OQ-003); quyết định go/no-go |
| Product Owner / BA | Ưu tiên backlog, duyệt demo, bộ dữ liệu kiểm thử, hướng dẫn người dùng, đồng bộ tài liệu |
| Trưởng nhóm kỹ thuật | Kiến trúc, review mã, ranh giới mô-đun, review bảo mật với Bảo mật/Pháp chế |
| Backend / Backend AI | Hạ tầng dịch vụ, truy xuất, trả lời, bộ đánh giá |
| Frontend | SPA theo thiết kế HTML; truy cập; telemetry |
| QA / SDET | Chiến lược kiểm thử, tự động hóa theo AC, cô lập quyền |
| DevOps / SRE | CI/CD, hạ tầng, sao lưu, quan sát |
| Bảo mật / Pháp chế | Phê duyệt DEP-002, OQ-008, OQ-015; không tham gia hằng ngày |

**Nghi thức (sprint 2 tuần):** lập kế hoạch sprint (kiểm tra DoR) · họp đứng hằng ngày · **demo cho Product Owner trên staging** (bắt buộc cuối mỗi sprint) · retro · tinh chỉnh backlog giữa sprint · **báo cáo MET-002 hằng tuần từ P3** · họp rủi ro/câu hỏi mở hằng tuần cho tới hết P1.

**Quy trình lỗi:** Blocker/Critical dừng phát hành và xử lý ngay; Major có kế hoạch trước khi qua cổng G5; lỗi bảo mật/cô lập quyền luôn là Critical.

---

## 13. Hạng mục hoãn và hướng sau MVP

| Hạng mục | Lý do hoãn | Điều kiện xem lại |
|---|---|---|
| OCR cho PDF scan | OQ-010, phạm vi | Tỉ lệ PDF scan trong pilot cao (spike A, IMP-002) |
| Mở tệp PDF gốc tại trang trích dẫn | OQ-027; SAD chưa có API trả tệp | Sponsor và Bảo mật đồng ý |
| Chia sẻ theo nhóm/dự án | OQ-007 | Có quyết định mô hình chia sẻ |
| Hiển thị định dạng phong phú (bảng, danh sách) | OQ-026 | PO yêu cầu; cần thư viện hiển thị và làm sạch HTML |
| Tối ưu di động | OQ-019 | Người dùng pilot dùng điện thoại |
| Co giãn ngang, hot standby, đa vùng | Ngoài mức MVP | MET-003 cho thấy dùng tăng, ARR-05, SAD §6 |
| Reranker, tách dịch vụ truy xuất | Chỉ khi eval cho thấy cần | MET-002 dưới ngưỡng sau tinh chỉnh |

---

## 14. Câu hỏi mở ảnh hưởng kế hoạch

Các OQ-001..027 từ BRD, PRD, User Stories, SAD và Blueprint vẫn áp dụng; những câu hỏi chặn lộ trình nêu ở **mục 2.2**. Thêm:

| ID | Câu hỏi | Chặn | Chủ sở hữu | Cần trước |
|---|---|---|---|---|
| **OQ-028** *(mới)* | Đội phát triển thực tế gồm ai, bao nhiêu FTE, từ ngày nào (T0)? | Toàn bộ mục 4, 6 | Quản lý | P0 |
| **OQ-029** *(mới)* | Có ràng buộc ngày pilot/ra mắt cứng (sự kiện, ngân sách theo quý)? | Lịch tuyệt đối, phạm vi cắt | Quản lý | P0 |
| **OQ-030** *(mới)* | Ai là chủ sở hữu bộ dữ liệu kiểm thử và chấm điểm MET-002 (người chấm, tần suất)? | IMP-005, 070, G2 | Product Owner | P0 |

---

## 15. Tự kiểm tra kế hoạch

| Kiểm tra | Kết quả |
|---|---|
| Mọi story (23) có việc triển khai | Đạt (mục 7) |
| Mọi cổng G1–G9 có việc đảm bảo | Đạt (mục 10) |
| Không có phụ thuộc quay ngược giai đoạn; không story P0 nào cần việc P5 | Đạt (kiểm tra tự động khi sinh tài liệu) |
| Lịch có xét phụ thuộc và năng lực từng vai trò | Đạt (mô phỏng, mục 4); kết quả nhạy với quy mô đội (4.1) |
| Mọi quyết định chặn có phương án tạm | Đạt (mục 2.2), trừ OQ-008 nếu bị từ chối (cần tính lại kế hoạch) |
| Ước lượng có căn cứ đo đạc | **Chưa** — cỡ áo `[Đề xuất]`, tính lại sau P0 |
| Đội và lịch được xác nhận | **Chưa** — chờ OQ-028, OQ-011, OQ-029 |
| Kế hoạch đã được đội phát triển review | **Chưa** |

## 16. Tuyên bố sẵn sàng

**Trạng thái: `Ready with conditions`** — đủ để review với đội phát triển, Product Owner và Bảo mật; **chưa đủ để cam kết lịch**.

Điều kiện: chốt OQ-008, OQ-011, OQ-014, OQ-016, OQ-028; đội phát triển review và ước lượng lại từng việc sau Giai đoạn 0; sponsor phê duyệt phương án tạm ở mục 2.2.

| Vai trò | Họ tên | Quyết định | Ngày |
|---|---|---|---|
| Executive sponsor | `[TBD: OQ-014]` | | |
| Product Owner | `[TBD: OQ-014]` | | |
| Trưởng nhóm kỹ thuật | `[TBD: OQ-014]` | | |
| QA | `[TBD: OQ-014]` | | |
| Bảo mật / Pháp chế | `[TBD: OQ-014]` | | |
