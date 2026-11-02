// Chạy ca E2E-001 — Đăng nhập → vào màn hình chính.
// Chạy lại: node test_reports/E2E-001/data/run.cjs   (cần ứng dụng ở http://localhost:5173/)
const path = require('path');
const T = path.resolve(__dirname, '../../../docs/testing/test_cases/tools');
const { startSession } = require(path.join(T, 'tc-session.cjs'));
const { Recorder } = require(path.join(T, 'report.cjs'));

(async () => {
  const s = await startSession('E2E-001');
  const { page } = s;
  const net = []; // thứ tự yêu cầu /api
  page.on('response', (r) => {
    if (r.url().includes('/api/')) net.push({ method: r.request().method(), path: new URL(r.url()).pathname, status: r.status() });
  });
  const rec = new Recorder(s, {
    title: 'Đăng nhập → vào màn hình chính',
    preconditions: [
      'Backend (cổng 8080) và giao diện chạy; `GET /api/ready` trả 200 trước khi bắt đầu.',
      'Cửa sổ trình duyệt mới hoàn toàn (không có cookie `DOCCHAT_SESSION`), tương đương InPrivate.',
      'Tài khoản dev `admin` (mật khẩu không ghi vào báo cáo).',
    ],
  });
  const body = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

  await rec.step({
    action: 'Gắn bộ ghi yêu cầu mạng /api (thay cho DevTools > Network > Preserve log, vì Playwright không chụp được DevTools)',
    expected: 'Bộ ghi sẵn sàng, chưa có yêu cầu nào',
    run: async () => ({ actual: `Bộ ghi mạng đã gắn; số yêu cầu hiện có: ${net.length}`, pass: net.length === 0 }),
  });

  await rec.step({
    action: 'Mở http://localhost:5173/ khi chưa đăng nhập',
    expected: 'Tự chuyển sang /login (URL chứa /login); thấy tiêu đề "Đăng nhập", ô "Tên đăng nhập", ô "Mật khẩu", nút "Đăng nhập"',
    run: async () => {
      await page.goto(s.baseUrl);
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await page.getByRole('button', { name: 'Đăng nhập' }).waitFor();
      const shot = await s.shot('chuyen-ve-dang-nhap');
      const h = await page.getByRole('heading', { name: 'Đăng nhập' }).count();
      const u = await page.getByLabel('Tên đăng nhập').count();
      const p = await page.getByLabel('Mật khẩu').count();
      const b = await page.getByRole('button', { name: 'Đăng nhập' }).count();
      return { actual: `URL = ${page.url()}; tiêu đề=${h}, ô tên=${u}, ô mật khẩu=${p}, nút=${b}`, pass: /\/login/.test(page.url()) && h > 0 && u > 0 && p > 0 && b > 0, shot };
    },
  });

  await rec.step({
    action: 'Quan sát nội dung trang và các yêu cầu mạng trước khi đăng nhập',
    expected: 'Không có "Xin chào"/tên tài liệu; có GET /api/me trả 401; KHÔNG có GET /api/documents nào trả 200',
    run: async () => {
      const t = await body();
      const me401 = net.some((x) => x.method === 'GET' && x.path === '/api/me' && x.status === 401);
      const docs200 = net.some((x) => x.method === 'GET' && x.path === '/api/documents' && x.status === 200);
      const shot = await s.shot('chua-co-du-lieu');
      const leak = /Xin chào|\.pdf/i.test(t);
      return { actual: `GET /api/me 401: ${me401 ? 'có' : 'không'}; GET /api/documents 200: ${docs200 ? 'CÓ' : 'không'}; có "Xin chào"/tên tệp trên trang: ${leak ? 'CÓ' : 'không'}`, pass: me401 && !docs200 && !leak, shot };
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
    expected: 'Ký tự hiển thị dạng chấm (type=password), không lộ chữ rõ',
    run: async () => {
      await page.getByLabel('Mật khẩu').fill(process.env.TC_PASS || 'Docchat-Dev-2026!');
      const shot = await s.shot('nhap-mat-khau');
      const type = await page.getByLabel('Mật khẩu').getAttribute('type');
      return { actual: `Thuộc tính type của ô = "${type}"`, pass: type === 'password', shot };
    },
  });

  await rec.step({
    action: 'Bấm nút "Đăng nhập"',
    expected: 'Chuyển về `/`; POST /api/auth/login trả 204',
    run: async () => {
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      const shot = await s.shot('sau-dang-nhap');
      const login = net.find((x) => x.method === 'POST' && x.path === '/api/auth/login');
      return { actual: `URL = ${page.url()}; POST /api/auth/login = ${login ? login.status : 'không thấy'}`, pass: !!login && login.status === 204 && new URL(page.url()).pathname === '/', shot };
    },
  });

  await rec.step({
    action: 'Quan sát màn hình chính sau đăng nhập',
    expected: 'Thấy "Xin chào, admin", nút "Đăng xuất", vùng "Tài liệu" (nút "Tải PDF lên" hoặc "Chưa có tài liệu nào"), vùng "Hội thoại" với "Câu hỏi về tài liệu"',
    run: async () => {
      const t = await body();
      const shot = await s.shot('khong-gian-lam-viec');
      const checks = {
        'Xin chào, admin': t.includes('Xin chào, admin'),
        'Đăng xuất': t.includes('Đăng xuất'),
        'Tài liệu': t.includes('Tài liệu'),
        'Tải PDF lên hoặc Chưa có tài liệu nào': t.includes('Tải PDF lên') || t.includes('Chưa có tài liệu nào'),
        'Hội thoại': t.includes('Hội thoại'),
        'Câu hỏi về tài liệu': t.includes('Câu hỏi về tài liệu'),
      };
      return { actual: Object.entries(checks).map(([k, v]) => `${k}: ${v ? 'có' : 'THIẾU'}`).join('; '), pass: Object.values(checks).every(Boolean), shot };
    },
  });

  await rec.step({
    action: 'Đối chiếu thứ tự yêu cầu mạng: GET /api/documents chỉ xuất hiện (200) sau POST /api/auth/login (204)',
    expected: 'Không có GET /api/documents 200 trước đăng nhập; có sau đăng nhập',
    run: async () => {
      const iLogin = net.findIndex((x) => x.method === 'POST' && x.path === '/api/auth/login' && x.status === 204);
      const iDocs = net.findIndex((x) => x.method === 'GET' && x.path === '/api/documents' && x.status === 200);
      const rows = net.map((x, i) => `<tr><td>${i + 1}</td><td>${x.method}</td><td>${x.path}</td><td>${x.status}</td></tr>`).join('');
      await page.setContent(`<meta charset=utf-8><body style="font:16px system-ui;padding:24px"><h2>Nhật ký yêu cầu /api do Playwright ghi (theo thứ tự)</h2><table border=1 cellpadding=6 style="border-collapse:collapse"><tr><th>#</th><th>Phương thức</th><th>Đường dẫn</th><th>Mã</th></tr>${rows}</table>`);
      const shot = await s.shot('thu-tu-yeu-cau');
      return { actual: `Vị trí POST login 204 = #${iLogin + 1}; GET /api/documents 200 đầu tiên = ${iDocs < 0 ? 'không có' : '#' + (iDocs + 1)}`, pass: iLogin >= 0 && iDocs > iLogin, shot };
    },
  });

  require('fs').writeFileSync(path.join(__dirname, 'nhat-ky-mang.json'), JSON.stringify(net, null, 2));
  const concl = rec.write({
    notes: [
      'Bước 1 và 8 dùng bộ ghi mạng của Playwright thay cho tab Network của DevTools (Playwright không chụp được DevTools); nhật ký đầy đủ ở `data/nhat-ky-mang.json`.',
      'Mật khẩu không xuất hiện trong ảnh (ô mật khẩu hiển thị dạng chấm) và không ghi vào báo cáo.',
      'Nội dung bước 7 chỉ kiểm sự hiện diện của các thành phần; không kiểm bố cục/thị giác (thuộc ca TC-UI-VISUAL).',
    ],
    env: { browser: `Microsoft Edge ${s.browser.version()} (Playwright, channel msedge)` },
  });
  const out = await s.finish();
  console.log(JSON.stringify({ conclusion: concl, ...out }));
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
