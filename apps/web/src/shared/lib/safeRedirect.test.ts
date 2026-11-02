import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it('giữ đường dẫn nội bộ kèm query và hash', () => {
    expect(safeRedirect('/')).toBe('/');
    expect(safeRedirect('/documents')).toBe('/documents');
    expect(safeRedirect('/a/b?x=1&y=2#top')).toBe('/a/b?x=1&y=2#top');
  });

  it.each([
    'https://evil.example',
    'http://evil.example/x',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'evil.example',
    '',
    '/a\nb',
    '/a\\b',
  ])('từ chối %j và về /', (raw) => {
    expect(safeRedirect(raw)).toBe('/');
  });

  it('từ chối giá trị không phải chuỗi hoặc quá dài', () => {
    expect(safeRedirect(undefined)).toBe('/');
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(['/a'])).toBe('/');
    expect(safeRedirect('/' + 'a'.repeat(3000))).toBe('/');
  });

  it('không quay lại trang đăng nhập', () => {
    expect(safeRedirect('/login')).toBe('/');
    expect(safeRedirect('/login?redirect=/x')).toBe('/');
  });
});
