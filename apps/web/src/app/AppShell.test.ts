import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../shared/lib/messages';
import AppShell from './AppShell.vue';

/** Giả lập độ rộng cửa sổ cho matchMedia (min-width). */
function setWidth(width: number): void {
  vi.stubGlobal('matchMedia', (query: string) => {
    const m = /min-width:\s*(\d+)px/.exec(query);
    return {
      matches: m ? width >= Number(m[1]) : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });
}

const slots = {
  documents: '<p id="docs-content">DOCS</p>',
  conversation: '<p id="chat-content">CHAT</p>',
  source: '<p id="source-content">SRC</p>',
};

const visible = (w: ReturnType<typeof mount>, sel: string) => {
  const el = w.find(sel).element as HTMLElement | undefined;
  return !!el && el.closest('[style*="display: none"]') === null;
};

afterEach(() => vi.unstubAllGlobals());

describe('AppShell — bố cục 3 cột responsive (T02.e)', () => {
  it('desktop (≥ 1280 px): hiển thị đồng thời cả ba cột, không có nút mở ngăn', () => {
    setWidth(1440);
    const w = mount(AppShell, { slots });
    expect(w.attributes('data-breakpoint')).toBe('desktop');
    for (const s of ['#docs-content', '#chat-content', '#source-content'])
      expect(visible(w, s), s).toBe(true);
    expect(w.find('button[aria-controls="panel-documents"]').exists()).toBe(false);
    expect(w.find('button[aria-controls="panel-source"]').exists()).toBe(false);
    expect(w.find('nav').exists()).toBe(false);
  });

  it('tablet (768–1279 px): hội thoại chiếm rộng; ngăn tài liệu và ngăn nguồn là ngăn trượt mở bằng nút', async () => {
    setWidth(1024);
    const w = mount(AppShell, { slots });
    expect(w.attributes('data-breakpoint')).toBe('tablet');
    expect(visible(w, '#chat-content')).toBe(true);
    expect(visible(w, '#docs-content')).toBe(false);
    expect(visible(w, '#source-content')).toBe(false);

    const openDocs = w.get('button[aria-controls="panel-documents"]');
    expect(openDocs.attributes('aria-expanded')).toBe('false');
    await openDocs.trigger('click');
    expect(visible(w, '#docs-content')).toBe(true);
    expect(w.get('button[aria-controls="panel-documents"]').attributes('aria-expanded')).toBe(
      'true',
    );

    await w.get('button[aria-controls="panel-source"]').trigger('click');
    expect(visible(w, '#source-content')).toBe(true);
  });

  it('tablet: Esc đóng các ngăn trượt', async () => {
    setWidth(1024);
    const w = mount(AppShell, { slots });
    await w.get('button[aria-controls="panel-documents"]').trigger('click');
    await w.get('button[aria-controls="panel-source"]').trigger('click');
    await w.get('[data-testid="app-shell"]').trigger('keydown', { key: 'Escape' });
    expect(visible(w, '#docs-content')).toBe(false);
    expect(visible(w, '#source-content')).toBe(false);
  });

  it('tablet: nút đóng trong ngăn (có aria-label) đóng ngăn đó', async () => {
    setWidth(1024);
    const w = mount(AppShell, { slots });
    await w.get('button[aria-controls="panel-source"]').trigger('click');
    const close = w.get('#panel-source button[aria-label="' + messages.layout.closePanel + '"]');
    await close.trigger('click');
    expect(visible(w, '#source-content')).toBe(false);
  });

  it('mobile (< 768 px): một khu vực mỗi lần, chuyển bằng thanh tab; ngăn nguồn toàn màn hình', async () => {
    setWidth(400);
    const w = mount(AppShell, { slots });
    expect(w.attributes('data-breakpoint')).toBe('mobile');
    expect(visible(w, '#chat-content')).toBe(true);
    expect(visible(w, '#docs-content')).toBe(false);

    const tabs = w.get('nav').findAll('button');
    expect(tabs).toHaveLength(2);
    expect(tabs[1].attributes('aria-current')).toBe('page');
    await tabs[0].trigger('click');
    expect(visible(w, '#docs-content')).toBe(true);
    expect(visible(w, '#chat-content')).toBe(false);
    expect(tabs[0].attributes('aria-current')).toBe('page');

    await w.get('button[aria-controls="panel-source"]').trigger('click');
    expect(visible(w, '#source-content')).toBe(true);
    expect(w.get('#panel-source').classes()).toContain('inset-0');
  });

  it('mọi ngăn có nhãn truy cập và có liên kết "bỏ qua tới nội dung chính"; nút đăng xuất phát sự kiện', async () => {
    setWidth(1440);
    const w = mount(AppShell, { props: { username: 'minh' }, slots });
    expect(w.get('#panel-documents').attributes('aria-label')).toBe(messages.layout.documents);
    expect(w.get('#panel-source').attributes('aria-label')).toBe(messages.layout.source);
    expect(w.get('a[href="#main-content"]').text()).toBe(messages.layout.skipToContent);
    expect(w.text()).toContain('Xin chào, minh');
    const logout = w.findAll('button').find((b) => b.text() === messages.auth.logout);
    await logout?.trigger('click');
    expect(w.emitted('logout')).toHaveLength(1);
  });

  it('khi không truyền nội dung: hiển thị trạng thái trống có hướng dẫn', () => {
    setWidth(1440);
    const w = mount(AppShell);
    expect(w.text()).toContain(messages.layout.documentsEmpty);
    expect(w.text()).toContain(messages.layout.conversationEmpty);
    expect(w.text()).toContain(messages.layout.sourceEmpty);
  });
});
