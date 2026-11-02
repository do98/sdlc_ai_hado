// @vitest-environment node
// T02.a, T02.g — không có giá trị thiết kế cứng ngoài tokens; không có chuỗi người dùng trong template; tương phản đạt.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const src = join(root, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p: string) => relative(root, p).replace(/\\/g, '/');
const all = walk(src);
// Mã giao diện thật: loại tokens.css (nơi định nghĩa), test, API giả và tệp sinh tự động
const uiFiles = all.filter(
  (f) =>
    /\.(vue|ts|css)$/.test(f) &&
    !f.endsWith('tokens.css') &&
    !/\.test\.ts$/.test(f) &&
    !rel(f).startsWith('src/mocks/') &&
    !f.endsWith('schema.d.ts') &&
    !f.endsWith('env.d.ts'),
);
const vueFiles = uiFiles.filter((f) => f.endsWith('.vue'));
const read = (f: string) => readFileSync(f, 'utf8');

describe('T02.a — giá trị thiết kế chỉ lấy từ tokens', () => {
  it('không có màu hex/rgb/hsl cứng ngoài tokens.css', () => {
    const offenders: string[] = [];
    for (const f of uiFiles) {
      const code = read(f)
        .replace(/href="#[^"]*"/g, '') // neo trang
        .replace(/\bid="#?[^"]*"/g, '');
      const hex = code.match(/(?<![\w&])#[0-9a-fA-F]{3,8}\b(?![\w-])/g);
      const fn = code.match(/\b(rgba?|hsla?|oklch|lab)\s*\(/g);
      if (hex || fn) offenders.push(`${rel(f)}: ${[...(hex ?? []), ...(fn ?? [])].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('component không có khối <style> riêng (dùng Tailwind + tokens)', () => {
    const withStyle = vueFiles.filter((f) => /<style[\s>]/.test(read(f))).map(rel);
    expect(withStyle).toEqual([]);
  });

  it('không dùng giá trị tùy ý của Tailwind có đơn vị/màu (ví dụ w-[400px], text-[#fff])', () => {
    const offenders: string[] = [];
    for (const f of vueFiles) {
      const m = read(f).match(
        /class(?:=|:)[^>]*?\b[\w:-]+-\[[^\]]*(?:#|\d(?:px|rem|em|vh|vw))[^\]]*\]/g,
      );
      if (m) offenders.push(`${rel(f)}: ${m.join(' | ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('mọi biến CSS mà tailwind.config.js tham chiếu đều có trong tokens.css', () => {
    const tokens = readFileSync(join(src, 'shared/ui/tokens.css'), 'utf8');
    const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const config = readFileSync(join(root, 'tailwind.config.js'), 'utf8');
    const used = [...config.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(20);
    expect(used.filter((v) => !defined.has(v))).toEqual([]);
  });
});

describe('T02.g — chuỗi hiển thị tập trung ở messages', () => {
  const LETTER = /[A-Za-zÀ-ỹ]/;

  it('template không chứa văn bản tĩnh (mọi chuỗi qua messages)', () => {
    const offenders: string[] = [];
    for (const f of vueFiles) {
      const tpl = /<template>([\s\S]*)<\/template>/.exec(read(f))?.[1] ?? '';
      const noComments = tpl.replace(/<!--[\s\S]*?-->/g, '').replace(/\{\{[\s\S]*?\}\}/g, '');
      for (const m of noComments.matchAll(/>([^<>]+)</g)) {
        const text = m[1].trim();
        if (text && LETTER.test(text)) offenders.push(`${rel(f)}: "${text}"`);
      }
      for (const m of noComments.matchAll(
        /\s(aria-label|title|placeholder|alt|label)="([^"]*)"/g,
      )) {
        if (LETTER.test(m[2])) offenders.push(`${rel(f)}: ${m[1]}="${m[2]}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('không có chuỗi tiếng Việt (có dấu) trong mã .vue/.ts giao diện ngoài messages.ts', () => {
    const VN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const offenders: string[] = [];
    for (const f of uiFiles.filter((x) => !x.endsWith('messages.ts') && !x.endsWith('.css'))) {
      const code = read(f)
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // bỏ chú thích
      for (const m of code.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) {
        if (VN.test(m[2])) offenders.push(`${rel(f)}: ${m[2].slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('T02 — tương phản màu của tokens (WCAG 2.1 AA)', () => {
  const tokens = readFileSync(join(src, 'shared/ui/tokens.css'), 'utf8');
  const color = (name: string) => {
    const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens);
    if (!m) throw new Error(`không có token màu --${name}`);
    return m[1];
  };
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  // [chữ, nền, tỉ lệ ghi trong Blueprint §3.2.2]
  const pairs: [string, string, number][] = [
    ['color-text', 'color-bg', 14.68],
    ['color-text-muted', 'color-bg', 7.56],
    ['color-text-subtle', 'color-bg', 4.83],
    ['color-primary', 'color-bg', 6.7],
    ['color-on-primary', 'color-primary', 6.7],
    ['color-text', 'color-surface-user', 13.49],
    ['color-error', 'color-error-bg', 7.6],
    ['color-success', 'color-success-bg', 6.81],
    ['color-warning', 'color-warning-bg', 6.84],
  ];

  it.each(pairs)('%s trên %s đạt ≥ 4.5:1 và đúng tỉ lệ Blueprint (%s)', (fg, bg, expected) => {
    const r = ratio(color(fg), color(bg));
    expect(r).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(r - expected)).toBeLessThan(0.1);
  });

  it('các cặp bổ sung của dự án cũng đạt ≥ 4.5:1 (nút nguy hiểm, nút vô hiệu, chữ trên nền panel, viền ô nhập ≥ 3:1)', () => {
    expect(ratio(color('color-on-primary'), color('color-error'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(color('color-disabled-text'), color('color-disabled-bg'))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratio(color('color-text-muted'), color('color-surface-panel'))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratio(color('color-text'), color('color-surface-panel'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(color('color-border-strong'), color('color-bg'))).toBeGreaterThanOrEqual(3);
    expect(ratio(color('color-primary'), color('color-bg'))).toBeGreaterThanOrEqual(3); // viền focus
  });
});
