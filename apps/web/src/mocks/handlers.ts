import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import { LIMITS } from '../shared/lib/limits';
import type {
  AskRequest,
  DocumentList,
  ErrorBody,
  ErrorCodeName,
  Me,
  Readiness,
  UploadAccepted,
} from '../shared/api/types';
import type { MockDb } from './db';
import { makePdf } from './pdf';
import { pickScenario, runAnswer } from './scenarios';
import { SSE_HEARTBEAT, sleep, sseEvent, sseHeaders, sseStream } from './sse';

/** Khớp `ErrorCode.x-catalog` của api/openapi.yaml; kiểu Record bắt buộc đủ mọi mã nên thêm mã mới vào hợp đồng sẽ không biên dịch. */
const STATUS: Record<ErrorCodeName, number> = {
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_LOCKED: 423,
  CSRF_REJECTED: 403,
  INVALID_REQUEST: 400,
  NOT_PDF: 415,
  FILE_TOO_LARGE: 413,
  WORKSPACE_FULL: 409,
  EMPTY_QUESTION: 422,
  QUESTION_TOO_LONG: 422,
  NO_READY_DOCUMENTS: 409,
  RATE_LIMITED: 429,
  LLM_UNAVAILABLE: 503,
  TIMEOUT: 504,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNSUPPORTED_MEDIA_TYPE: 415,
  NOT_READY: 503,
  INTERNAL: 500,
};

let traceCounter = 0;

export function errorResponse(code: ErrorCodeName, init: { retryAfter?: number } = {}): Response {
  traceCounter += 1;
  const body: ErrorBody = { code, message: 'Mock error.', traceId: `mock-${traceCounter}` };
  return HttpResponse.json(body, {
    status: STATUS[code],
    headers: init.retryAfter ? { 'Retry-After': String(init.retryAfter) } : undefined,
  });
}

/** `*` ở đầu để khớp cả khi chạy trong trình duyệt (cùng origin) lẫn trong Node (test). */
const path = (p: string) => `*${p}`;

function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | 'invalid' | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  let start: number;
  let end: number;
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  return start > end || start >= size ? 'invalid' : { start, end };
}

/**
 * Bộ handler MSW cho toàn bộ hợp đồng api/openapi.yaml (T05.c). Dùng ở:
 *  - trình duyệt dev: `VITE_API_MOCK=true npm run dev` → chạy giao diện không cần backend;
 *  - test (msw/node): kiểm thử luồng chính và từng kịch bản lỗi.
 */
export function createHandlers(db: MockDb): HttpHandler[] {
  const needSession = (): Response | null => (db.alive ? null : errorResponse('UNAUTHENTICATED'));

  return [
    // ---- auth ----
    http.post(path('/api/auth/login'), async ({ request }) => {
      const body = (await request.json().catch(() => null)) as {
        username?: unknown;
        password?: unknown;
      } | null;
      if (
        !body ||
        typeof body.username !== 'string' ||
        typeof body.password !== 'string' ||
        body.username.trim() === '' ||
        body.password === ''
      ) {
        return errorResponse('INVALID_REQUEST');
      }
      switch (db.login(body.username, body.password)) {
        case 'ok':
          return new HttpResponse(null, { status: 204 });
        case 'locked':
          return errorResponse('ACCOUNT_LOCKED', { retryAfter: 900 });
        default:
          return errorResponse('INVALID_CREDENTIALS');
      }
    }),
    http.post(path('/api/auth/logout'), () => {
      db.alive = false;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(path('/api/me'), () => {
      const denied = needSession();
      if (denied) return denied;
      const me: Me = db.me;
      return HttpResponse.json(me);
    }),

    // ---- hệ thống ----
    http.get(path('/api/health'), () => HttpResponse.json({ status: 'UP' as const })),
    http.get(path('/api/ready'), () => {
      const r: Readiness = { status: 'UP', checks: { database: 'UP', storage: 'UP' } };
      return HttpResponse.json(r);
    }),

    // ---- tài liệu ----
    http.get(path('/api/documents'), () => {
      const denied = needSession();
      if (denied) return denied;
      const body: DocumentList = {
        items: db.documents,
        count: db.documents.length,
        limit: LIMITS.maxDocuments,
      };
      return HttpResponse.json(body);
    }),
    http.post(path('/api/documents'), async ({ request }) => {
      const denied = needSession();
      if (denied) return denied;
      const form = await request.formData().catch(() => null);
      const file = form?.get('file');
      if (!(file instanceof File)) return errorResponse('INVALID_REQUEST');

      // Thứ tự kiểm tra giống backend (T07): loại tệp → dung lượng → chỗ trống
      const head = new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer());
      if (!head.includes('%PDF-')) return errorResponse('NOT_PDF');
      if (file.size > LIMITS.maxFileMb * 1024 * 1024) return errorResponse('FILE_TOO_LARGE');
      if (db.isFull) return errorResponse('WORKSPACE_FULL');

      const doc = db.addDocument(file.name, file.size);
      const body: UploadAccepted = { id: doc.id, status: 'PROCESSING' };
      return HttpResponse.json(body, { status: 202 });
    }),
    http.get(path('/api/documents/:id/file'), ({ params, request }) => {
      const denied = needSession();
      if (denied) return denied;
      const doc = db.documents.find((d) => d.id === params.id);
      if (!doc || doc.status === 'ERROR') return errorResponse('NOT_FOUND'); // không lộ tồn tại
      const bytes = makePdf(doc.pageCount ?? 1);
      const headers: Record<string, string> = {
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      };
      const range = parseRange(request.headers.get('range'), bytes.length);
      if (range === 'invalid') {
        return HttpResponse.json(
          {
            code: 'INVALID_REQUEST',
            message: 'Range not satisfiable.',
            traceId: null,
          } satisfies ErrorBody,
          { status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } },
        );
      }
      if (range) {
        const slice = bytes.slice(range.start, range.end + 1);
        return new HttpResponse(slice, {
          status: 206,
          headers: {
            ...headers,
            'Content-Range': `bytes ${range.start}-${range.end}/${bytes.length}`,
            'Content-Length': String(slice.length),
          },
        });
      }
      return new HttpResponse(bytes, {
        status: 200,
        headers: { ...headers, 'Content-Length': String(bytes.length) },
      });
    }),

    // ---- luồng sự kiện workspace (IF-06) ----
    http.get(path('/api/events'), ({ request }) => {
      const denied = needSession();
      if (denied) return denied;
      const last = request.headers.get('last-event-id');
      const stream = sseStream(async (sink, requestSignal) => {
        const signal = AbortSignal.any([requestSignal, db.signal]);
        const live: string[] = [];
        let wake: (() => void) | null = null;
        const off = db.subscribe((e) => {
          live.push(sseEvent('document.updated', e.data, e.id));
          wake?.();
        });
        try {
          if (last !== null) {
            const missed = db.eventsSince(Number(last));
            if (missed === null || Number.isNaN(Number(last))) {
              sink.send(sseEvent('resync', {}));
            } else {
              missed.forEach((e) => sink.send(sseEvent('document.updated', e.data, e.id)));
            }
          }
          let lastBeat = Date.now();
          while (!signal.aborted && !sink.closed) {
            while (live.length > 0) sink.send(live.shift() as string);
            if (Date.now() - lastBeat >= db.config.heartbeatMs) {
              sink.send(SSE_HEARTBEAT);
              lastBeat = Date.now();
            }
            await Promise.race([
              new Promise<void>((resolve) => (wake = resolve)),
              sleep(Math.min(db.config.heartbeatMs, 1000), signal),
            ]);
          }
        } finally {
          off();
        }
      });
      return new HttpResponse(stream, { headers: sseHeaders });
    }),

    // ---- hội thoại (IF-05) ----
    http.post(path('/api/conversations'), () => {
      const denied = needSession();
      if (denied) return denied;
      return HttpResponse.json(db.createConversation(), { status: 201 });
    }),
    http.post(path('/api/conversations/:id/messages'), async ({ params, request }) => {
      const denied = needSession();
      if (denied) return denied;
      if (!db.conversations.has(String(params.id))) return errorResponse('NOT_FOUND');
      const body = (await request.json().catch(() => null)) as Partial<AskRequest> | null;
      if (!body || typeof body.text !== 'string') return errorResponse('INVALID_REQUEST');
      if (body.text.trim() === '') return errorResponse('EMPTY_QUESTION');
      if (Array.from(body.text).length > LIMITS.maxQuestionChars)
        return errorResponse('QUESTION_TOO_LONG');
      if (db.readyDocuments.length === 0) return errorResponse('NO_READY_DOCUMENTS');

      const scenario = pickScenario(body.text, db.config.defaultScenario);
      const messageId = db.newId();
      const conversationId = String(params.id);
      const doc = db.readyDocuments[0];
      const stream = sseStream((sink, requestSignal) =>
        runAnswer(scenario, {
          sink,
          signal: AbortSignal.any([requestSignal, db.signal]),
          delay: db.config.tokenDelayMs,
          messageId,
          conversationId,
          doc,
        }),
      );
      return new HttpResponse(stream, { headers: sseHeaders });
    }),
  ];
}
