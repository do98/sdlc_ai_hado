// Chạy ca E2E-002 — Lần đầu: tải PDF → chờ sẵn sàng → hỏi → xem nguồn.
// Các bước 1–8 chạy được; bước 9–11 phụ thuộc tính năng chưa hiện thực (xử lý nền T08, hỏi đáp) nên được ghi "không chạy được".
// Chạy lại: node test_reports/E2E-002/data/run.cjs
const fs = require('fs');
const path = require('path');
const T = path.resolve(__dirname, '../../../docs/testing/test_cases/tools');
const { startSession } = require(path.join(T, 'tc-session.cjs'));
const { Recorder } = require(path.join(T, 'report.cjs'));

const PDF = path.join(__dirname, 'hop-dong-mau.pdf');

async function makePdf() {
  const { chromium } = require(path.resolve(__dirname, '../../../apps/web/node_modules/@playwright/test'));
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage();
  const sec = (n, t) => `<section style="page-break-after:always;font:16pt serif"><h1>Hợp đồng mẫu — trang ${n}</h1>${t}</section>`;
  await p.setContent(
    `<meta charset=utf-8><body>${sec(1, '<p>Điều 1. Các bên tham gia hợp đồng thống nhất những nội dung dưới đây.</p>')}` +
      `${sec(2, '<p>Điều 2. Bảo hành.</p><p>Thời hạn bảo hành là 24 tháng.</p>')}` +
      `${sec(3, '<p>Điều 3. Điều khoản chung và hiệu lực của hợp đồng.</p>')}</body>`,
  );
  await p.pdf({ path: PDF, format: 'A4' });
  await b.close();
}

(async () => {
  await makePdf();
  const size = fs.statSync(PDF).size;
  const head = fs.readFileSync(PDF).subarray(0, 5).toString('latin1');

  const s = await startSession('E2E-002');
  const { page } = s;
  const net = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/')) net.push({ method: r.request().method(), path: new URL(r.url()).pathname, status: r.status() });
  });
  const rec = new Recorder(s, {
    title: 'Lần đầu: tải PDF → chờ sẵn sàng → hỏi → xem nguồn',
    preconditions: [
      'Backend (cổng 8080) và giao diện chạy; `GET /api/ready` trả 200 trước khi bắt đầu.',
      `Tạo \`data/hop-dong-mau.pdf\` bằng Edge (page.pdf): 3 trang có chữ thật, trang 2 có câu "Thời hạn bảo hành là 24 tháng."; kích thước ${size} byte (< 10 MB), 5 byte đầu = "${head}".`,
      'Kho tài liệu dev còn chỗ (dưới 20 tài liệu). Câu hỏi dùng ở bước 9: "Thời hạn bảo hành là bao lâu?"; đáp án kỳ vọng "24 tháng" ở trang 2.',
    ],
  });
  const body = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const used = async () => {
    const m = (await body()).match(/Đã dùng (\d+)\/20 tài liệu/);
    return m ? Number(m[1]) : null;
  };

  await rec.step({
    action: 'Mở http://localhost:5173/login (cửa sổ mới, chưa có cookie)',
    expected: 'Thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu", nút "Đăng nhập"',
    run: async () => {
      await page.goto(s.baseUrl + 'login');
      await page.getByRole('button', { name: 'Đăng nhập' }).waitFor();
      const shot = await s.shot('trang-dang-nhap');
      const ok = (await page.getByRole('heading', { name: 'Đăng nhập' }).count()) > 0 && (await page.getByLabel('Tên đăng nhập').count()) > 0 && (await page.getByLabel('Mật khẩu').count()) > 0;
      return { actual: `Có đủ tiêu đề, 2 ô nhập và nút: ${ok}`, pass: ok, shot };
    },
  });
  await rec.step({
    action: 'Nhập `admin` vào ô "Tên đăng nhập"',
    expected: 'Ô hiển thị `admin`',
    run: async () => {
      await page.getByLabel('Tên đăng nhập').fill('admin');
      const shot = await s.shot('nhap-ten');
      const v = await page.getByLabel('Tên đăng nhập').inputValue();
      return { actual: `Giá trị ô = "${v}"`, pass: v === 'admin', shot };
    },
  });
  await rec.step({
    action: 'Nhập mật khẩu dev vào ô "Mật khẩu"',
    expected: 'Ký tự hiển thị dạng chấm (type=password)',
    run: async () => {
      await page.getByLabel('Mật khẩu').fill(process.env.TC_PASS || 'Docchat-Dev-2026!');
      const shot = await s.shot('nhap-mat-khau');
      const type = await page.getByLabel('Mật khẩu').getAttribute('type');
      return { actual: `type của ô = "${type}"`, pass: type === 'password', shot };
    },
  });
  let before = null;
  await rec.step({
    action: 'Bấm nút "Đăng nhập"',
    expected: 'Chuyển về `/`; thấy "Xin chào, admin" và nút "Đăng xuất"; POST /api/auth/login trả 204',
    run: async () => {
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 });
      await page.getByText('Xin chào, admin').waitFor();
      await page.waitForLoadState('networkidle');
      before = await used();
      const shot = await s.shot('da-dang-nhap');
      const login = net.find((x) => x.method === 'POST' && x.path === '/api/auth/login');
      const t = await body();
      return { actual: `URL = ${page.url()}; login = ${login?.status}; "Xin chào, admin": ${t.includes('Xin chào, admin')}; "Đăng xuất": ${t.includes('Đăng xuất')}; đã dùng trước khi tải: ${before}/20`, pass: login?.status === 204 && t.includes('Xin chào, admin') && t.includes('Đăng xuất'), shot };
    },
  });

  let chooser;
  await rec.step({
    action: 'Bấm nút "Tải PDF lên" (Playwright chặn hộp thoại chọn tệp bằng sự kiện filechooser)',
    expected: 'Hộp thoại chọn tệp mở ra (sự kiện filechooser phát sinh), cho phép chọn nhiều tệp',
    run: async () => {
      const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.getByRole('button', { name: 'Tải PDF lên' }).first().click()]);
      chooser = fc;
      const shot = await s.shot('mo-hop-thoai-chon-tep');
      return { actual: `Sự kiện filechooser phát sinh; cho chọn nhiều tệp: ${fc.isMultiple()}`, pass: !!fc && fc.isMultiple(), shot };
    },
  });
  await rec.step({
    action: 'Chọn tệp `data/hop-dong-mau.pdf` trong hộp thoại',
    expected: 'Xuất hiện hàng `hop-dong-mau.pdf` với trạng thái "Đã tải lên, đang xử lý" rồi "Đang xử lý"; bộ đếm "Đã dùng n/20" tăng 1; POST /api/documents trả 202',
    run: async () => {
      await chooser.setFiles(PDF);
      await page.getByText('hop-dong-mau.pdf').first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(1500);
      const after = await used();
      const shot = await s.shot('da-tai-len');
      const up = net.filter((x) => x.method === 'POST' && x.path === '/api/documents').pop();
      const t = await body();
      const hasRow = t.includes('hop-dong-mau.pdf');
      const processing = t.includes('Đang xử lý');
      return { actual: `POST /api/documents = ${up?.status}; có hàng hop-dong-mau.pdf: ${hasRow}; "Đang xử lý": ${processing}; bộ đếm ${before} → ${after}`, pass: up?.status === 202 && hasRow && processing && after === before + 1, shot };
    },
  });

  let ready = false;
  await rec.step({
    action: 'Chờ tối đa 60 giây, quan sát trạng thái hàng `hop-dong-mau.pdf` (kiểm tra mỗi 2 giây)',
    expected: 'Theo thiết kế: nhãn chuyển thành "Sẵn sàng" không cần tải lại trang',
    run: async () => {
      const row = page.locator('li, article, div').filter({ hasText: 'hop-dong-mau.pdf' }).last();
      const t0 = Date.now();
      while (Date.now() - t0 < 60000) {
        const txt = (await page.locator('body').innerText());
        // "Sẵn sàng" trong hàng của tài liệu vừa tải (không tính dòng giải thích của ô hỏi: "Chưa có tài liệu sẵn sàng")
        const rowText = await row.innerText().catch(() => '');
        if (/Sẵn sàng/.test(rowText) && !/Chưa có tài liệu sẵn sàng/.test(rowText)) {
          ready = true;
          break;
        }
        void txt;
        await page.waitForTimeout(2000);
      }
      const shot = await s.shot('cho-san-sang');
      const rowText = await row.innerText().catch(() => '');
      return { actual: `Sau ${Math.round((Date.now() - t0) / 1000)} giây trạng thái hàng: "${rowText.replace(/\s+/g, ' ').slice(0, 80)}" — ${ready ? 'đã "Sẵn sàng"' : 'vẫn "Đang xử lý", KHÔNG chuyển "Sẵn sàng" (T08 chưa hiện thực) → điểm bị chặn'}`, pass: ready, shot };
    },
  });

  await rec.step({
    action: 'Quan sát ô "Câu hỏi về tài liệu"',
    expected: 'Hiện nay: ô bị khóa kèm "Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi."',
    run: async () => {
      const ta = page.getByLabel('Câu hỏi về tài liệu');
      const disabled = await ta.isDisabled();
      const t = await body();
      const msg = t.includes('Chưa có tài liệu sẵn sàng. Hãy tải PDF lên và chờ xử lý xong để đặt câu hỏi.');
      const shot = await s.shot('o-nhap-khoa');
      return { actual: `Ô nhập bị khóa: ${disabled}; có dòng giải thích đúng nguyên văn: ${msg}`, pass: disabled && msg, shot };
    },
  });

  const blocked = 'KHÔNG CHẠY ĐƯỢC — tính năng chưa hiện thực (không có xử lý nền T08 để tài liệu thành "Sẵn sàng" và chưa có hỏi đáp/trích dẫn); không thể quan sát kết quả nên không ghi Đạt.';
  rec.skip({ action: 'Nhập "Thời hạn bảo hành là bao lâu?" vào ô "Câu hỏi về tài liệu" rồi gửi', expected: 'Câu trả lời hiện dần, chứa "24 tháng" và trích dẫn dạng [1]', reason: blocked });
  rec.skip({ action: 'Bấm trích dẫn [1] trong câu trả lời', expected: 'Ngăn "Nguồn" mở, đúng tên `hop-dong-mau.pdf`, đúng trang 2, đoạn nguồn được làm nổi', reason: blocked });
  rec.skip({ action: 'Đối chiếu việc người dùng mới hoàn thành chuỗi mà không cần trợ giúp ngoài', expected: 'Mọi bước đều có chỉ dẫn trên màn hình', reason: blocked });

  fs.writeFileSync(path.join(__dirname, 'nhat-ky-mang.json'), JSON.stringify(net, null, 2));
  const concl = rec.write({
    conclusion: 'Bị chặn',
    notes: [
      'Ca kết luận **Bị chặn**: chuỗi "tải → chờ Sẵn sàng → hỏi → xem nguồn" không thể hoàn tất vì tài liệu không bao giờ rời trạng thái "Đang xử lý" (T08 chưa làm) và chưa có hỏi đáp/trích dẫn (T14–T16). Bước 1–6 và 8 cho thấy phần đã làm hoạt động đúng; bước 7 không đạt là hệ quả của việc chưa hiện thực, không phải lỗi mới.',
      'Hộp thoại chọn tệp của hệ điều hành không chụp được; Playwright chặn bằng sự kiện filechooser và ảnh chụp là trang web ngay sau đó.',
      'Tệp thử `hop-dong-mau.pdf` đã được tải thật vào kho dev nên đang chiếm 1 trong 20 chỗ (chưa có chức năng xóa tài liệu). Muốn làm sạch kho: xóa `apps/api/target/dev-postgres` rồi khởi động lại backend dev.',
      'Nhãn nút gửi câu hỏi chưa có trong giao diện (ô nhập luôn bị khóa), nên bước 9 chưa thể chỉ rõ nút.',
    ],
    defects: [],
    env: { browser: `Microsoft Edge ${s.browser.version()} (Playwright, channel msedge)` },
  });
  const out = await s.finish();
  console.log(JSON.stringify({ conclusion: concl, ...out }));
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
