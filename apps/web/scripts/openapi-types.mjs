// Sinh kiểu TypeScript từ api/openapi.yaml (T05.d). Dùng cho `npm run gen:api` và cho test "kiểu đã cập nhật".
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const SPEC = new URL('../../../api/openapi.yaml', import.meta.url);
export const OUTPUT = fileURLToPath(new URL('../src/shared/api/schema.d.ts', import.meta.url));

const HEADER =
  '/* TỆP SINH TỰ ĐỘNG từ api/openapi.yaml — KHÔNG SỬA TAY. Chạy `npm run gen:api` sau khi đổi hợp đồng. */\n\n';

export async function generate() {
  const ast = await openapiTS(SPEC);
  return HEADER + astToString(ast).replace(/\r\n/g, '\n');
}

export function readCommitted() {
  return readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUTPUT, await generate());
  console.log('Đã sinh', OUTPUT);
}
