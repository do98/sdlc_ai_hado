// @vitest-environment node
// T05 — hợp đồng API là nguồn sự thật: hợp lệ OpenAPI, kiểu TypeScript đã cập nhật, danh mục mã lỗi khớp frontend.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { API_ERRORS, CLIENT_ERRORS, isRetryable, messageForError } from '../src/shared/api/errors';

const specPath = resolve(__dirname, '../../../api/openapi.yaml');
const spec = parse(readFileSync(specPath, 'utf8')) as {
  paths: Record<string, Record<string, { operationId: string }>>;
  components: {
    schemas: {
      ErrorCode: {
        enum: string[];
        'x-catalog': Record<string, { status: number; retryable: boolean }>;
      };
    };
  };
};

describe('T05 — OpenAPI hợp lệ ("openapi-lint")', () => {
  it('qua kiểm tra cú pháp, $ref và schema OpenAPI 3', async () => {
    const api = (await SwaggerParser.validate(specPath)) as { openapi: string };
    expect(api.openapi).toMatch(/^3\./);
  });

  it('mọi thao tác có operationId duy nhất và có phản hồi', () => {
    const ids: string[] = [];
    for (const item of Object.values(spec.paths)) {
      for (const op of Object.values(item)) ids.push(op.operationId);
    }
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids).toEqual(
      expect.arrayContaining([
        'login',
        'logout',
        'getMe',
        'getHealth',
        'getReady',
        'listDocuments',
        'uploadDocument',
        'getDocumentFile',
        'streamEvents',
        'createConversation',
        'askQuestion',
      ]),
    );
  });
});

describe('T05.d — kiểu TypeScript sinh từ hợp đồng', () => {
  it('schema.d.ts đã được cập nhật (chạy `npm run gen:api` nếu test này đỏ)', async () => {
    const { generate, readCommitted } = await import('../scripts/openapi-types.mjs');
    expect(readCommitted()).toBe(await generate());
  }, 60_000);
});

describe('T05.f — danh mục mã lỗi một nguồn sự thật', () => {
  const codes = spec.components.schemas.ErrorCode.enum;
  const catalog = spec.components.schemas.ErrorCode['x-catalog'];

  it('frontend có thông điệp cho ĐÚNG tập mã của hợp đồng (không thiếu, không thừa)', () => {
    expect(Object.keys(API_ERRORS).sort()).toEqual([...codes].sort());
    expect(Object.keys(catalog).sort()).toEqual([...codes].sort());
  });

  it('cờ retryable khớp hợp đồng', () => {
    for (const code of codes) {
      expect(API_ERRORS[code as keyof typeof API_ERRORS].retryable, code).toBe(
        catalog[code].retryable,
      );
      expect(isRetryable(code, catalog[code].status), code).toBe(catalog[code].retryable);
    }
  });

  it('mọi mã có thông điệp tiếng Việt không rỗng, không lộ mã kỹ thuật', () => {
    for (const code of codes) {
      const msg = messageForError(code, catalog[code].status);
      expect(msg.trim().length, code).toBeGreaterThan(10);
      expect(msg, code).not.toMatch(/[A-Z_]{6,}/); // không chứa "INVALID_CREDENTIALS"…
      expect(msg, code).not.toMatch(/\b(HTTP|status|exception|stack)\b/i);
    }
  });

  it('mã chỉ có ở trình duyệt không trùng với mã của hợp đồng', () => {
    for (const code of Object.keys(CLIENT_ERRORS)) expect(codes).not.toContain(code);
  });
});
