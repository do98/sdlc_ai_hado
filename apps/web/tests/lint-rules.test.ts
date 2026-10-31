// @vitest-environment node
// Chứng minh từng luật kiến trúc (R-1…R-6 + luật token) thực sự bắt vi phạm — T01 tiêu chí hoàn thành.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const configFile = resolve(__dirname, '..', 'eslint.config.js');
let root: string;
let eslint: ESLint;

const files: Record<string, string> = {
  'src/shared/ui/base.ts': 'export const base = 1;\n',
  'src/shared/api/client.ts': 'export const client = 1;\n',
  'src/features/a/index.ts': 'export const a = 1;\n',
  'src/features/a/inner.ts': 'export const inner = 1;\n',
  'src/features/b/index.ts': 'export const b = 1;\n',
  'src/app/index.ts': 'export const app = 1;\n',
};

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'docchat-lint-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  eslint = new ESLint({
    cwd: root,
    overrideConfigFile: configFile,
    // boundaries tính đường dẫn từ root-path (mặc định là cwd của tiến trình); trỏ vào thư mục tạm của bài test
    overrideConfig: [{ settings: { 'boundaries/root-path': root } }],
    ignore: false,
  });
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const [res] = await eslint.lintText(code, { filePath: join(root, filePath) });
  return res.messages.map((m) => m.ruleId ?? 'parse-error');
}

describe('luật ranh giới module', () => {
  it('R-1: shared không import features', async () => {
    expect(
      await ruleIds(
        'src/shared/ui/x.ts',
        "import { a } from '../../features/a/index';\nexport const x = a;\n",
      ),
    ).toContain('boundaries/element-types');
  });
  it('R-1: shared không import app', async () => {
    expect(
      await ruleIds(
        'src/shared/ui/x.ts',
        "import { app } from '../../app/index';\nexport const x = app;\n",
      ),
    ).toContain('boundaries/element-types');
  });
  it('R-2: feature không import feature khác', async () => {
    expect(
      await ruleIds(
        'src/features/a/x.ts',
        "import { b } from '../b/index';\nexport const x = b;\n",
      ),
    ).toContain('boundaries/element-types');
  });
  it('feature được import shared và chính nó', async () => {
    const ids = await ruleIds(
      'src/features/a/x.ts',
      "import { base } from '../../shared/ui/base';\nimport { inner } from './inner';\nexport const x = [base, inner];\n",
    );
    expect(ids).not.toContain('boundaries/element-types');
  });
  it('R-5: app được ghép các feature', async () => {
    const ids = await ruleIds(
      'src/app/x.ts',
      "import { a } from '../features/a/index';\nimport { b } from '../features/b/index';\nexport const x = [a, b];\n",
    );
    expect(ids).not.toContain('boundaries/element-types');
  });
});

describe('luật gọi mạng và HTML (R-3, R-4, R-6)', () => {
  it('R-3: fetch ngoài shared/api bị cấm', async () => {
    expect(
      await ruleIds('src/features/a/x.ts', "export const x = () => fetch('/api');\n"),
    ).toContain('no-restricted-globals');
  });
  it('R-3: XMLHttpRequest ngoài shared/api bị cấm', async () => {
    expect(await ruleIds('src/app/x.ts', 'export const x = new XMLHttpRequest();\n')).toContain(
      'no-restricted-globals',
    );
  });
  it('R-3: fetch trong shared/api được phép', async () => {
    expect(
      await ruleIds('src/shared/api/x.ts', "export const x = () => fetch('/api');\n"),
    ).not.toContain('no-restricted-globals');
  });
  it('R-4: innerHTML ngoài shared/lib/markdown bị cấm, trong markdown được phép', async () => {
    expect(
      await ruleIds(
        'src/features/a/x.ts',
        'export const x = (e: HTMLElement) => { e.innerHTML = "<b>"; };\n',
      ),
    ).toContain('no-restricted-properties');
    expect(
      await ruleIds(
        'src/shared/lib/markdown/x.ts',
        'export const x = (e: HTMLElement) => { e.innerHTML = "<b>"; };\n',
      ),
    ).not.toContain('no-restricted-properties');
  });
  it('R-4: v-html ngoài shared/lib/markdown bị cấm, trong markdown được phép', async () => {
    const vue =
      '<script setup lang="ts">\nconst h = "x";\n</script>\n<template>\n  <div v-html="h" />\n</template>\n';
    expect(await ruleIds('src/features/a/X.vue', vue)).toContain('vue/no-v-html');
    expect(await ruleIds('src/shared/lib/markdown/X.vue', vue)).not.toContain('vue/no-v-html');
  });
  it('R-6: thư viện HTTP ngoài shared/api bị cấm, trong shared/api được phép', async () => {
    expect(
      await ruleIds('src/features/a/x.ts', "import axios from 'axios';\nexport const x = axios;\n"),
    ).toContain('@typescript-eslint/no-restricted-imports');
    expect(
      await ruleIds('src/shared/api/x.ts', "import axios from 'axios';\nexport const x = axios;\n"),
    ).not.toContain('@typescript-eslint/no-restricted-imports');
  });
});

describe('luật token', () => {
  it('cấm localStorage và sessionStorage ở mọi nơi, kể cả shared/api', async () => {
    for (const p of [
      'src/features/a/x.ts',
      'src/shared/api/x.ts',
      'src/shared/lib/markdown/x.ts',
    ]) {
      expect(await ruleIds(p, "export const x = localStorage.getItem('t');\n")).toContain(
        'no-restricted-globals',
      );
      expect(await ruleIds(p, "export const y = sessionStorage.getItem('t');\n")).toContain(
        'no-restricted-globals',
      );
    }
  });
});
