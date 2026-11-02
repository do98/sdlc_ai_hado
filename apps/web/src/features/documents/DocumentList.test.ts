import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { DocumentSummary } from '../../shared/api';
import { messages } from '../../shared/lib/messages';
import DocumentList from './DocumentList.vue';

const doc = (id: string, patch: Partial<DocumentSummary> = {}): DocumentSummary => ({
  id,
  name: `${id}.pdf`,
  sizeBytes: 1000,
  pageCount: 5,
  status: 'READY',
  errorCode: null,
  warning: null,
  uploadedBy: 'u',
  uploadedAt: '2026-11-02T00:00:00Z',
  ...patch,
});

const props = {
  items: [] as DocumentSummary[],
  loading: false,
  failed: false,
  connection: 'connected' as const,
  announcement: '',
  hasLocalRows: false,
};

describe('DocumentList (T11)', () => {
  it('giữ nguyên thứ tự máy chủ trả (mới nhất trước) và hiển thị từng trạng thái', () => {
    const w = mount(DocumentList, {
      props: {
        ...props,
        items: [
          doc('moi', { status: 'PROCESSING', pageCount: null }),
          doc('canh-bao', { warning: { code: 'UNREADABLE_PAGES', pages: [3, 7] } }),
          doc('loi', { status: 'ERROR', errorCode: 'CORRUPT' }),
          doc('cu'),
        ],
      },
    });
    const rows = w.findAll('li');
    expect(rows.map((r) => r.get('[data-testid="doc-name"]').text())).toEqual([
      'moi.pdf',
      'canh-bao.pdf',
      'loi.pdf',
      'cu.pdf',
    ]);
    expect(rows.map((r) => r.attributes('data-status'))).toEqual([
      'processing',
      'readyWarning',
      'error',
      'ready',
    ]);
    expect(w.text()).toContain('Một số trang không đọc được: 3, 7');
    expect(w.text()).toContain(messages.documents.errorByCode.CORRUPT);
  });

  it('ST: trạng thái trống có minh họa, lời giải thích và nút "Tải PDF lên" phát sự kiện upload', async () => {
    const w = mount(DocumentList, { props });
    const empty = w.get('[data-testid="empty-state"]');
    expect(empty.text()).toContain(messages.documents.empty.title);
    await empty.get('button').trigger('click');
    expect(empty.get('button').text()).toBe(messages.upload.button);
    expect(w.emitted('upload')).toHaveLength(1);
  });

  it('không hiện trạng thái trống khi đang tải, khi lỗi, hoặc khi có hàng tải lên cục bộ', () => {
    expect(
      mount(DocumentList, { props: { ...props, loading: true } })
        .find('[data-testid="empty-state"]')
        .exists(),
    ).toBe(false);
    expect(
      mount(DocumentList, { props: { ...props, failed: true } })
        .find('[data-testid="empty-state"]')
        .exists(),
    ).toBe(false);
    expect(
      mount(DocumentList, { props: { ...props, hasLocalRows: true } })
        .find('[data-testid="empty-state"]')
        .exists(),
    ).toBe(false);
  });

  it('đang tải: khung chờ có nhãn; lỗi: thông báo + nút tải lại phát sự kiện reload', async () => {
    const loading = mount(DocumentList, { props: { ...props, loading: true } });
    expect(loading.text()).toContain(messages.documents.loading);
    const failed = mount(DocumentList, { props: { ...props, failed: true } });
    expect(failed.get('[role="alert"]').text()).toContain(messages.documents.loadError);
    await failed
      .findAll('button')
      .find((b) => b.text() === messages.documents.reload)
      ?.trigger('click');
    expect(failed.emitted('reload')).toHaveLength(1);
  });

  it('T11.g: mất kết nối thời gian thực hiện chỉ báo nhưng danh sách vẫn thao tác được', () => {
    const w = mount(DocumentList, {
      props: { ...props, items: [doc('a')], connection: 'reconnecting' },
    });
    expect(w.get('[data-testid="conn-lost"]').text()).toContain(messages.documents.connectionLost);
    expect(w.findAll('li')).toHaveLength(1);
    expect(
      mount(DocumentList, { props: { ...props, items: [doc('a')] } })
        .find('[data-testid="conn-lost"]')
        .exists(),
    ).toBe(false);
  });

  it('T11.i: vùng aria-live="polite" luôn có mặt và đọc thông báo tài liệu sẵn sàng', async () => {
    const w = mount(DocumentList, { props: { ...props, items: [doc('a')] } });
    const live = w.get('[data-testid="doc-announcer"]');
    expect(live.attributes('aria-live')).toBe('polite');
    expect(live.attributes('role')).toBe('status');
    await w.setProps({ announcement: messages.documents.announce.ready('a.pdf') });
    expect(live.text()).toBe('«a.pdf» đã sẵn sàng.');
  });
});
