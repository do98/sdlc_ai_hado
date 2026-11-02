import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/lib/limits';
import { checkFiles } from './validate';

const MB = 1024 * 1024;

/** Tạo tệp có đúng `size` byte, bắt đầu bằng `head`. */
function file(name: string, head = '%PDF-', size = 1000): File {
  return new File([head, new Uint8Array(Math.max(0, size - head.length))], name);
}

const pdfs = (n: number, prefix = 'f') =>
  Array.from({ length: n }, (_, i) => file(`${prefix}${i}.pdf`));
const summary = (r: Awaited<ReturnType<typeof checkFiles>>) => r.map((x) => x.reason ?? 'ok');

describe('ALG-02 — kiểm tra tệp phía trình duyệt', () => {
  it('US003_AC1: PDF hợp lệ được nhận', async () => {
    expect(summary(await checkFiles([file('a.pdf')], 0))).toEqual(['ok']);
  });

  it('US003_AC1: .docx/.xlsx/.jpg bị loại vì sai loại', async () => {
    const r = await checkFiles(
      [file('a.docx', 'PK\u0003\u0004'), file('b.xlsx', 'PK\u0003\u0004'), file('c.jpg', 'ÿØÿ')],
      0,
    );
    expect(summary(r)).toEqual(['NOT_PDF', 'NOT_PDF', 'NOT_PDF']);
  });

  it('US003_AC2: tệp đổi đuôi .pdf nhưng không có %PDF- bị loại (kiểm tra nội dung, không chỉ đuôi)', async () => {
    expect(summary(await checkFiles([file('anh.pdf', 'ÿØÿà')], 0))).toEqual(['NOT_PDF']);
  });

  it('đuôi .PDF viết hoa vẫn được nhận (không phân biệt hoa thường)', async () => {
    expect(summary(await checkFiles([file('A.PDF'), file('b.Pdf')], 0))).toEqual(['ok', 'ok']);
  });

  it('đúng nội dung PDF nhưng thiếu đuôi .pdf hoặc đuôi kép bị loại', async () => {
    expect(
      summary(await checkFiles([file('baocao'), file('baocao.pdf.exe'), file('pdf')], 0)),
    ).toEqual(['NOT_PDF', 'NOT_PDF', 'NOT_PDF']);
  });

  it('tệp 0 byte bị loại vì sai loại', async () => {
    expect(summary(await checkFiles([new File([], 'rong.pdf')], 0))).toEqual(['NOT_PDF']);
  });

  it('US003_AC3: đúng giới hạn dung lượng được nhận, vượt 1 byte bị loại', async () => {
    const limit = LIMITS.maxFileMb * MB;
    const r = await checkFiles(
      [file('vua.pdf', '%PDF-', limit), file('lon.pdf', '%PDF-', limit + 1)],
      0,
    );
    expect(summary(r)).toEqual(['ok', 'FILE_TOO_LARGE']);
  });

  it('US006_AC3: chọn 25 tệp hợp lệ khi kho trống → nhận 20 tệp đầu theo thứ tự chọn, 5 tệp sau hết chỗ', async () => {
    const r = await checkFiles(pdfs(25), 0);
    expect(summary(r)).toEqual([...Array(20).fill('ok'), ...Array(5).fill('WORKSPACE_FULL')]);
    expect(r.slice(0, 20).map((x) => x.file.name)).toEqual(pdfs(20).map((f) => f.name)); // đúng thứ tự
  });

  it('US006_AC3: đã có 18 tài liệu, chọn 5 → nhận 2, 3 tệp sau hết chỗ', async () => {
    expect(summary(await checkFiles(pdfs(5), 18))).toEqual([
      'ok',
      'ok',
      'WORKSPACE_FULL',
      'WORKSPACE_FULL',
      'WORKSPACE_FULL',
    ]);
  });

  it('đã đủ 20 thì mọi tệp hợp lệ đều bị loại vì hết chỗ', async () => {
    expect(summary(await checkFiles(pdfs(2), 20))).toEqual(['WORKSPACE_FULL', 'WORKSPACE_FULL']);
  });

  it('US006_AC2: tệp sai không chặn tệp đúng và KHÔNG chiếm chỗ', async () => {
    const r = await checkFiles(
      [
        file('a.docx', 'PK'),
        file('b.pdf'),
        file('c.pdf', '%PDF-', LIMITS.maxFileMb * MB + 1),
        file('d.pdf'),
      ],
      18,
    );
    expect(summary(r)).toEqual(['NOT_PDF', 'ok', 'FILE_TOO_LARGE', 'ok']);
  });

  it('hai tệp trùng tên đều được nhận (MVP không chặn trùng)', async () => {
    expect(summary(await checkFiles([file('trung.pdf'), file('trung.pdf')], 0))).toEqual([
      'ok',
      'ok',
    ]);
  });

  it('thứ tự kiểm tra: sai loại ưu tiên hơn quá lớn và hết chỗ', async () => {
    const r = await checkFiles([file('x.docx', 'PK', LIMITS.maxFileMb * MB + 1)], 20);
    expect(summary(r)).toEqual(['NOT_PDF']);
  });

  it('chỉ đọc 5 byte đầu: tệp lớn không bị nạp vào bộ nhớ (kết quả vẫn đúng với tệp 10 MB)', async () => {
    const r = await checkFiles([file('lon.pdf', '%PDF-', LIMITS.maxFileMb * MB)], 0);
    expect(summary(r)).toEqual(['ok']);
  });
});
