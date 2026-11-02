/** Dựng một tệp PDF hợp lệ tối thiểu (mỗi trang một dòng chữ) cho IF-07 giả; đủ để pdf.js mở được. */
export function makePdf(pageCount: number): Uint8Array {
  const pages = Math.max(1, pageCount);
  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font, rồi mỗi trang 2 đối tượng (Page, Content)
  const kids: string[] = [];
  for (let i = 0; i < pages; i++) kids.push(`${4 + i * 2} 0 R`);
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (let i = 0; i < pages; i++) {
    const content = `BT /F1 24 Tf 72 700 Td (Trang ${i + 1}) Tj ET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) body += `${String(off).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
