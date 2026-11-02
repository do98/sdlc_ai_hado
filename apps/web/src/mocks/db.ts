import { LIMITS } from '../shared/lib/limits';
import type {
  Conversation,
  DocumentErrorCode,
  DocumentSummary,
  DocumentWarning,
} from '../shared/api/types';

/** Kịch bản trả lời của câu hỏi (chọn bằng từ khóa trong câu hỏi hoặc `db.config.defaultScenario`). */
export type AnswerScenario =
  'answered' | 'not_found' | 'partial' | 'interrupted' | 'timeout' | 'llm-error';

export interface MockConfig {
  /** Thời gian xử lý nền của một tài liệu (ms); 0 = xử lý ngay lập tức khi gọi flush. */
  processingMs: number;
  /** Độ trễ giữa hai sự kiện khi trả lời (ms). */
  tokenDelayMs: number;
  /** Chu kỳ heartbeat của luồng sự kiện workspace (ms). */
  heartbeatMs: number;
  defaultScenario: AnswerScenario;
  validUsername: string;
  validPassword: string;
}

export interface WorkspaceEvent {
  id: number;
  data: Pick<DocumentSummary, 'id' | 'status' | 'errorCode' | 'warning' | 'pageCount'>;
}

const USER_ID = '01a19b28-2831-7f07-8ca0-4669f25a315c';

let counter = 0;
function uuid(): string {
  // UUID giả có dạng hợp lệ, tăng dần (đủ cho dữ liệu giả)
  counter += 1;
  const hex = counter.toString(16).padStart(12, '0');
  return `01a19b28-0000-7000-8000-${hex}`;
}

/**
 * Trạng thái của "máy chủ giả": phiên, tài liệu, sự kiện workspace, hội thoại. Một instance cho mỗi môi trường
 * (trình duyệt dev hoặc từng test); `reset()` đưa về ban đầu.
 */
export class MockDb {
  config: MockConfig = {
    processingMs: 3000,
    tokenDelayMs: 40,
    heartbeatMs: 15000,
    defaultScenario: 'answered',
    validUsername: 'minh',
    validPassword: 'mat-khau-dung-123',
  };

  alive = false;
  failedLogins = 0;
  documents: DocumentSummary[] = [];
  conversations = new Map<string, Conversation>();
  events: WorkspaceEvent[] = [];
  private seq = 0;
  private abort = new AbortController();

  /** Bị hủy khi reset(): mọi luồng SSE đang mở của lần trước dừng lại (không rò sang test/phiên sau). */
  get signal(): AbortSignal {
    return this.abort.signal;
  }
  private listeners = new Set<(e: WorkspaceEvent) => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private pending = new Map<string, () => void>();

  reset(): void {
    this.abort.abort();
    this.abort = new AbortController();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.pending.clear();
    this.alive = false;
    this.failedLogins = 0;
    this.documents = [];
    this.conversations.clear();
    this.events = [];
    this.seq = 0;
  }

  // ---- phiên ----

  /** @returns 'ok' | 'invalid' | 'locked' — mô phỏng khóa tạm sau 5 lần sai như backend. */
  login(username: string, password: string): 'ok' | 'invalid' | 'locked' {
    if (this.failedLogins >= 5) return 'locked';
    if (
      username.trim().toLowerCase() === this.config.validUsername &&
      password === this.config.validPassword
    ) {
      this.alive = true;
      this.failedLogins = 0;
      return 'ok';
    }
    this.failedLogins += 1;
    return 'invalid';
  }

  get me() {
    return { id: USER_ID, username: this.config.validUsername, role: 'MEMBER' as const };
  }

  // ---- tài liệu ----

  get activeDocuments(): DocumentSummary[] {
    return this.documents;
  }

  get readyDocuments(): DocumentSummary[] {
    return this.documents.filter((d) => d.status === 'READY');
  }

  get isFull(): boolean {
    return this.documents.length >= LIMITS.maxDocuments;
  }

  addDocument(name: string, sizeBytes: number): DocumentSummary {
    const doc: DocumentSummary = {
      id: uuid(),
      name,
      sizeBytes,
      pageCount: null,
      status: 'PROCESSING',
      errorCode: null,
      warning: null,
      uploadedBy: USER_ID,
      uploadedAt: new Date().toISOString(),
    };
    this.documents = [doc, ...this.documents];
    this.schedule(doc);
    return doc;
  }

  /** Kết quả xử lý nền theo gợi ý trong tên tệp (giống các loại lỗi của T08). */
  private outcome(doc: DocumentSummary): {
    errorCode: DocumentErrorCode | null;
    warning: DocumentWarning | null;
    pageCount: number | null;
  } {
    const n = doc.name.toLowerCase();
    if (n.includes('password'))
      return { errorCode: 'PASSWORD_PROTECTED', warning: null, pageCount: null };
    if (n.includes('scan') && !n.includes('partial'))
      return { errorCode: 'SCANNED_NO_TEXT', warning: null, pageCount: 4 };
    if (n.includes('corrupt')) return { errorCode: 'CORRUPT', warning: null, pageCount: null };
    if (n.includes('toomany'))
      return { errorCode: 'TOO_MANY_PAGES', warning: null, pageCount: LIMITS.maxPages + 1 };
    const pageCount = Math.max(
      1,
      Math.min(LIMITS.maxPages, Math.round(doc.sizeBytes / 50_000) || 1),
    );
    if (n.includes('partial'))
      return {
        errorCode: null,
        warning: { code: 'UNREADABLE_PAGES', pages: [3, 7] },
        pageCount: Math.max(8, pageCount),
      };
    return { errorCode: null, warning: null, pageCount };
  }

  private schedule(doc: DocumentSummary): void {
    const finish = () => {
      this.pending.delete(doc.id);
      const o = this.outcome(doc);
      this.update(doc.id, { status: o.errorCode ? 'ERROR' : 'READY', ...o });
    };
    this.pending.set(doc.id, finish);
    if (this.config.processingMs > 0) {
      const t = setTimeout(() => {
        this.timers.delete(t);
        finish();
      }, this.config.processingMs);
      this.timers.add(t);
    }
  }

  /** Hoàn tất ngay mọi tài liệu đang xử lý (dùng trong test hoặc để "tua nhanh"). */
  flushProcessing(): void {
    [...this.pending.values()].forEach((finish) => finish());
  }

  private update(id: string, patch: Partial<DocumentSummary>): void {
    this.documents = this.documents.map((d) => (d.id === id ? { ...d, ...patch } : d));
    const d = this.documents.find((x) => x.id === id);
    if (!d) return;
    this.emit({
      id: d.id,
      status: d.status,
      errorCode: d.errorCode,
      warning: d.warning,
      pageCount: d.pageCount,
    });
  }

  // ---- sự kiện workspace (IF-06) ----

  private emit(data: WorkspaceEvent['data']): void {
    this.seq += 1;
    const event = { id: this.seq, data };
    this.events.push(event);
    this.listeners.forEach((l) => l(event));
  }

  subscribe(listener: (e: WorkspaceEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Sự kiện có id lớn hơn `lastId`; `null` nếu id vượt quá lịch sử đang có (cần resync). */
  eventsSince(lastId: number): WorkspaceEvent[] | null {
    if (lastId > this.seq) return null;
    return this.events.filter((e) => e.id > lastId);
  }

  // ---- hội thoại ----

  createConversation(): Conversation {
    const c: Conversation = { id: uuid(), createdAt: new Date().toISOString() };
    this.conversations.set(c.id, c);
    return c;
  }

  newId(): string {
    return uuid();
  }
}
