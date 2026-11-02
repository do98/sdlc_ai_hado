// Ghi test_reports/<ID>/report.md theo mẫu trong tệp ca kiểm thử, từ kết quả từng bước đã ghi nhận.
//
//   const { Recorder } = require('./docs/testing/test_cases/tools/report.cjs');
//   const rec = new Recorder(session, { title: '…', conclusion: undefined /* tự suy ra */ });
//   await rec.step({ action, expected, run: async () => ({ actual, pass, shot }) });
//   rec.skip({ action, expected, reason });          // bước không chạy được (ghi rõ lý do)
//   rec.write({ conclusion, notes, defects });
const fs = require('fs');
const path = require('path');

class Recorder {
  constructor(session, meta = {}) {
    this.s = session;
    this.meta = meta;
    this.steps = [];
    this.started = new Date();
  }

  /** Chạy một bước; ngoại lệ được ghi thành "Không đạt" chứ không làm dừng cả ca. */
  async step({ action, expected, run }) {
    const n = this.steps.length + 1;
    let r;
    try {
      r = await run();
    } catch (e) {
      let shot;
      try {
        shot = await this.s.shot(`loi-buoc-${n}`);
      } catch {
        /* trang có thể đã đóng */
      }
      r = { actual: `Lỗi khi thực hiện: ${String(e.message).split('\n')[0]}`, pass: false, shot };
    }
    this.steps.push({ n, action, expected, actual: r.actual, pass: r.pass, shot: r.shot, status: r.pass ? 'pass' : 'fail' });
    return r;
  }

  skip({ action, expected, reason }) {
    this.steps.push({ n: this.steps.length + 1, action, expected, actual: reason, pass: null, shot: undefined, status: 'skip' });
  }

  write({ conclusion, notes = [], defects = [], env = {} }) {
    const id = this.s.id;
    const failed = this.steps.filter((x) => x.status === 'fail').length;
    const concl = conclusion || (failed ? 'Không đạt' : 'Đạt');
    const mark = (x) => (x.status === 'pass' ? '✔' : x.status === 'fail' ? '✘' : '—');
    const esc = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const lines = [];
    lines.push(`# Báo cáo kiểm thử — ${id}`);
    lines.push('');
    lines.push(`- **Kết luận: ${concl}**`);
    if (this.meta.title) lines.push(`- Ca kiểm thử: ${this.meta.title} (tệp: \`docs/testing/test_cases/${id}.md\`)`);
    lines.push(`- Ngày giờ chạy: ${this.started.toISOString()} → ${new Date().toISOString()}`);
    lines.push(`- Người chạy: agent Claude (Playwright, chạy tự động)`);
    lines.push(`- Trình duyệt: ${env.browser || 'Microsoft Edge (Playwright, channel msedge)'}; cửa sổ mới, chưa có cookie (tương đương ẩn danh)`);
    lines.push(`- URL kiểm thử: ${this.s.baseUrl}`);
    if (env.build) lines.push(`- Bản dựng: ${env.build}`);
    lines.push(`- Video: [./video/${id}.webm](./video/${id}.webm)`);
    lines.push(`- Nhật ký console/mạng: [./data/console-va-mang.log](./data/console-va-mang.log)`);
    lines.push('');
    if (this.meta.preconditions?.length) {
      lines.push('## Điều kiện tiên quyết đã chuẩn bị');
      lines.push('');
      for (const p of this.meta.preconditions) lines.push(`- ${p}`);
      lines.push('');
    }
    lines.push('## Bảng thực hiện');
    lines.push('');
    lines.push('| Bước | Hành động đã làm | Kết quả mong đợi | Kết quả thực tế | Đạt? | Ảnh |');
    lines.push('|---|---|---|---|---|---|');
    for (const x of this.steps) {
      const img = x.shot ? `![${x.shot}](./screenshots/${x.shot})` : '—';
      lines.push(`| ${x.n} | ${esc(x.action)} | ${esc(x.expected)} | ${esc(x.actual)} | ${mark(x)} | ${img} |`);
    }
    lines.push('');
    lines.push('Chú giải: ✔ đạt · ✘ không đạt · — không chạy được (xem cột "Kết quả thực tế" để biết lý do).');
    lines.push('');
    lines.push('## Lỗi phát hiện');
    lines.push('');
    if (defects.length) {
      lines.push('| Mô tả | Mức độ | Bằng chứng |');
      lines.push('|---|---|---|');
      for (const d of defects) lines.push(`| ${esc(d.desc)} | ${esc(d.severity)} | ${esc(d.evidence)} |`);
    } else {
      lines.push('Không phát hiện lỗi mới trong phạm vi ca này.');
    }
    lines.push('');
    lines.push('## Ghi chú, hạn chế, đề xuất');
    lines.push('');
    for (const n of notes) lines.push(`- ${n}`);
    lines.push('');
    fs.writeFileSync(path.join(this.s.dir, 'report.md'), lines.join('\n'), 'utf8');
    fs.writeFileSync(
      path.join(this.s.dir, 'data', 'ket-qua-tung-buoc.json'),
      JSON.stringify({ id, conclusion: concl, steps: this.steps }, null, 2),
      'utf8',
    );
    return concl;
  }
}

module.exports = { Recorder };
