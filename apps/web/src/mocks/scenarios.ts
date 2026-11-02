import type { DocumentSummary } from '../shared/api/types';
import type { AnswerScenario } from './db';
import { sseEvent, sleep } from './sse';
import type { SseSink } from './sse';

/** Chọn kịch bản theo từ khóa trong câu hỏi (tiện thử bằng tay trên giao diện), nếu không có thì dùng mặc định. */
export function pickScenario(text: string, fallback: AnswerScenario): AnswerScenario {
  const keywords: [string, AnswerScenario][] = [
    ['#not_found', 'not_found'],
    ['#partial', 'partial'],
    ['#interrupted', 'interrupted'],
    ['#timeout', 'timeout'],
    ['#llm-error', 'llm-error'],
    ['#answered', 'answered'],
  ];
  const lower = text.toLowerCase();
  return keywords.find(([k]) => lower.includes(k))?.[1] ?? fallback;
}

export const NOT_FOUND_TEXT = 'Tôi không tìm thấy thông tin này trong các tài liệu.';

interface Ctx {
  sink: SseSink;
  signal: AbortSignal;
  delay: number;
  messageId: string;
  conversationId: string;
  doc: DocumentSummary | undefined;
}

async function emit(c: Ctx, event: string, data: unknown): Promise<boolean> {
  if (c.signal.aborted || c.sink.closed) return false;
  c.sink.send(sseEvent(event, data));
  await sleep(c.delay, c.signal);
  return !c.signal.aborted;
}

/** Phát chuỗi sự kiện của IF-05 theo kịch bản. Thứ tự hợp lệ được mô tả ở api/sse-events.md. */
export async function runAnswer(scenario: AnswerScenario, c: Ctx): Promise<void> {
  const ok = async (event: string, data: unknown) => emit(c, event, data);
  if (!(await ok('meta', { messageId: c.messageId, conversationId: c.conversationId }))) return;
  if (scenario === 'llm-error') {
    await ok('error', { code: 'LLM_UNAVAILABLE', retryable: true });
    return;
  }
  if (!(await ok('status', { phase: 'retrieving' }))) return;
  if (!(await ok('status', { phase: 'generating' }))) return;

  const doc = c.doc;
  const cite = (index: number) => ({
    index,
    documentId: doc?.id ?? '',
    documentName: doc?.name ?? '',
    page: 12,
    charStart: 340,
    charEnd: 520,
  });

  switch (scenario) {
    case 'not_found':
      await ok('delta', { text: NOT_FOUND_TEXT });
      await ok('done', { result: 'not_found', usage: { promptTokens: 900, completionTokens: 12 } });
      return;
    case 'timeout':
      await ok('delta', { text: 'Đang tổng hợp thông tin từ tài liệu' });
      await ok('error', { code: 'TIMEOUT', retryable: true });
      return;
    case 'interrupted':
      await ok('delta', { text: 'Thời hạn bảo hành là 24 tháng ' });
      // Đóng luồng mà không có done/error → phía nhận coi là gián đoạn
      return;
    case 'partial':
      for (const t of [
        'Theo tài liệu, thời hạn bảo hành là 24 tháng [1]. ',
        'Phần về chi phí vận chuyển chưa có trong tài liệu.',
      ]) {
        if (!(await ok('delta', { text: t }))) return;
      }
      if (!(await ok('citation', cite(1)))) return;
      await ok('done', { result: 'partial', usage: { promptTokens: 1500, completionTokens: 48 } });
      return;
    default:
      for (const t of ['Thời hạn bảo hành là 24 tháng', ' kể từ ngày nghiệm thu [1].']) {
        if (!(await ok('delta', { text: t }))) return;
      }
      if (!(await ok('citation', cite(1)))) return;
      await ok('done', { result: 'answered', usage: { promptTokens: 1840, completionTokens: 96 } });
  }
}
