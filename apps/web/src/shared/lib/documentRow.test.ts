import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { DocumentErrorCode, DocumentSummary } from '../api/types';
import DocumentRow from '../ui/DocumentRow.vue';
import { messageForDocumentError, statusIcon, viewOfDocument } from './documentRow';
import type { RowView } from './documentRow';
import { messages } from './messages';

const doc = (patch: Partial<DocumentSummary> = {}): DocumentSummary => ({
  id: 'd1',
  name: 'hop-dong.pdf',
  sizeBytes: 2048,
  pageCount: 12,
  status: 'READY',
  errorCode: null,
  warning: null,
  uploadedBy: 'u',
  uploadedAt: '2026-11-02T00:00:00Z',
  ...patch,
});

describe('T11.b/c — ánh xạ tài liệu → hàng hiển thị', () => {
  it('PROCESSING → Đang xử lý; READY → Sẵn sàng kèm số trang', () => {
    expect(viewOfDocument(doc({ status: 'PROCESSING', pageCount: null }))).toMatchObject({
      status: 'processing',
      detail: null,
    });
    expect(viewOfDocument(doc())).toMatchObject({ status: 'ready', detail: '12 trang' });
  });

  it('AC-012.8: READY + UNREADABLE_PAGES → "Sẵn sàng có cảnh báo" nêu đúng các trang', () => {
    const v = viewOfDocument(doc({ warning: { code: 'UNREADABLE_PAGES', pages: [3, 7] } }));
    expect(v.status).toBe('readyWarning');
    expect(v.detail).toContain('Một số trang không đọc được: 3, 7');
  });

  it('AC-012.1–012.7: mỗi mã lỗi xử lý nền có thông điệp riêng, không lộ mã kỹ thuật', () => {
    const codes: DocumentErrorCode[] = [
      'PASSWORD_PROTECTED',
      'SCANNED_NO_TEXT',
      'CORRUPT',
      'TOO_MANY_PAGES',
      'PROCESSING_FAILED',
    ];
    const seen = new Set<string>();
    for (const code of codes) {
      const v = viewOfDocument(doc({ status: 'ERROR', errorCode: code, pageCount: null }));
      expect(v.status).toBe('error');
      expect(v.detail).toBe(messages.documents.errorByCode[code]);
      expect(v.detail).not.toContain(code);
      seen.add(v.detail ?? '');
    }
    expect(seen.size).toBe(codes.length); // không hai mã nào dùng chung thông điệp
    expect(messageForDocumentError('MA_LA')).toBe(messages.documents.errorUnknown);
    expect(messageForDocumentError(null)).toBe(messages.documents.errorUnknown);
  });

  it('sáu trạng thái có sáu biểu tượng khác nhau (không chỉ dựa vào màu)', () => {
    const icons = (
      ['queued', 'uploading', 'processing', 'ready', 'readyWarning', 'error'] as const
    ).map(statusIcon);
    expect(new Set(icons).size).toBe(6);
  });
});

function view(patch: Partial<RowView>): RowView {
  return {
    key: 'k',
    name: 'a.pdf',
    sizeBytes: 1024,
    status: 'queued',
    progress: null,
    detail: null,
    dataState: 'QUEUED',
    ...patch,
  };
}

describe('DocumentRow — sáu trạng thái, mỗi trạng thái có icon + chữ', () => {
  const cases: [RowView['status'], Partial<RowView>, string][] = [
    ['queued', {}, messages.documents.status.queued],
    ['uploading', { progress: 42 }, messages.documents.status.uploading(42)],
    ['processing', {}, messages.documents.status.processing],
    ['ready', {}, messages.documents.status.ready],
    ['readyWarning', { detail: 'x' }, messages.documents.status.readyWarning],
    ['error', { detail: 'x' }, messages.documents.status.error],
  ];
  for (const [status, patch, label] of cases) {
    it(`${status}: chữ "${label}" và biểu tượng`, () => {
      const w = mount(DocumentRow, { props: { view: view({ status, ...patch }) } });
      expect(w.get('[data-testid="doc-status"]').text()).toBe(label);
      expect(w.text()).toContain(statusIcon(status));
      expect(w.get('li').attributes('data-status')).toBe(status);
    });
  }

  it('đang tải lên có thanh tiến trình với aria-valuenow; trạng thái khác thì không có', () => {
    const up = mount(DocumentRow, { props: { view: view({ status: 'uploading', progress: 30 }) } });
    const bar = up.get('[role="progressbar"]');
    expect(bar.attributes('aria-valuenow')).toBe('30');
    expect(bar.attributes('aria-label')).toBe(messages.upload.progressLabel('a.pdf'));
    expect(
      mount(DocumentRow, { props: { view: view({ status: 'ready' }) } })
        .find('[role="progressbar"]')
        .exists(),
    ).toBe(false);
  });

  it('T11.j: tên tệp chứa HTML được hiển thị như văn bản thuần, tên dài có title đầy đủ và bị cắt dòng', () => {
    const name = '<img src=x onerror=alert(1)>' + 'x'.repeat(300) + '.pdf';
    const w = mount(DocumentRow, { props: { view: view({ name }) } });
    expect(w.find('img').exists()).toBe(false);
    const el = w.get('[data-testid="doc-name"]');
    expect(el.text()).toBe(name);
    expect(el.attributes('title')).toBe(name);
    expect(el.classes()).toContain('line-clamp-2');
  });

  it('khe actions hiển thị nút thao tác', () => {
    const w = mount(DocumentRow, {
      props: { view: view({}) },
      slots: { actions: '<button>Hủy</button>' },
    });
    expect(w.find('button').text()).toBe('Hủy');
  });
});
