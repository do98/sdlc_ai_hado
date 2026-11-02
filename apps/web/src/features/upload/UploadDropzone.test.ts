import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api';
import { LIMITS } from '../../shared/lib/limits';
import { messages } from '../../shared/lib/messages';
import UploadDropzone from './UploadDropzone.vue';
import type { UploadFn } from './uploadQueue';

const pdf = (name = 'a.pdf') => new File(['%PDF-1.4 x'], name);

function setFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
}

function mountIt(uploadFn: UploadFn, existingCount = 0) {
  return mount(UploadDropzone, { props: { existingCount, uploadFn }, attachTo: document.body });
}

async function pick(w: ReturnType<typeof mountIt>, files: File[]): Promise<void> {
  const input = w.get('[data-testid="file-input"]').element as HTMLInputElement;
  setFiles(input, files);
  await w.get('[data-testid="file-input"]').trigger('change');
  // Kiểm tra ALG-02 đọc tệp bằng FileReader (bất đồng bộ thật) nên chờ đến khi các dòng xuất hiện
  await vi.waitFor(() => expect(w.findAll('li').length).toBeGreaterThanOrEqual(files.length));
  await flushPromises();
}

function dragEvent(type: string, files = true): Event {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'dataTransfer', {
    value: { types: files ? ['Files'] : ['text/plain'], files: [], dropEffect: 'none' },
  });
  return e;
}

const never: UploadFn = () => new Promise(() => {});

describe('UploadDropzone (T10)', () => {
  it('US002_AC1: nút "Tải PDF lên" mở hộp chọn tệp và nhận nhiều tệp PDF', async () => {
    const w = mountIt(never);
    const input = w.get('[data-testid="file-input"]');
    expect(input.attributes('multiple')).toBeDefined();
    expect(input.attributes('accept')).toContain('pdf');
    const click = vi.spyOn(input.element as HTMLInputElement, 'click');
    const button = w.findAll('button').find((b) => b.text() === messages.upload.button);
    expect(button).toBeDefined();
    await button?.trigger('click');
    expect(click).toHaveBeenCalled();
    w.unmount();
  });

  it('US002_AC1: chọn tệp → mỗi tệp một dòng với thanh tiến trình (aria) và nút Hủy', async () => {
    const upload: UploadFn = (_f, { onProgress }) => {
      onProgress(30, 100);
      return new Promise(() => {});
    };
    const w = mountIt(upload);
    await pick(w, [pdf('a.pdf'), pdf('b.pdf')]);
    const bars = w.findAll('[role="progressbar"]');
    expect(bars).toHaveLength(2);
    expect(bars[0].attributes('aria-valuenow')).toBe('30');
    expect(bars[0].attributes('aria-label')).toBe(messages.upload.progressLabel('a.pdf'));
    expect(w.text()).toContain(messages.upload.action.cancel);
    w.unmount();
  });

  it('US006_AC2: tệp sai hiện lý do tiếng Việt, tệp đúng vẫn được tải', async () => {
    const upload = vi.fn<UploadFn>(() => new Promise(() => {}));
    const w = mountIt(upload);
    await pick(w, [new File(['PK'], 'a.docx'), pdf('b.pdf')]);
    expect(w.text()).toContain(messages.errors.notPdf);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(w.find('[data-state="REJECTED"]').exists()).toBe(true);
    w.unmount();
  });

  it('US002_AC3: tải xong → phát sự kiện accepted và thông báo cho trình đọc màn hình', async () => {
    const upload: UploadFn = async () => ({ id: 'd', status: 'PROCESSING' });
    const w = mountIt(upload);
    await pick(w, [pdf('a.pdf')]);
    await flushPromises();
    expect(w.emitted('accepted')).toHaveLength(1);
    const live = w.get('[data-testid="announcer"]');
    expect(live.attributes('role')).toBe('status');
    expect(live.attributes('aria-live')).toBe('polite');
    expect(live.text()).toBe(messages.upload.announce.accepted('a.pdf'));
    w.unmount();
  });

  it('US002_AC2: lỗi 5xx hết lượt tự thử → hiện nút "Thử lại"; lỗi 415 thì không có nút "Thử lại"', async () => {
    const w415 = mountIt(async () => {
      throw new ApiError(415, 'NOT_PDF');
    });
    await pick(w415, [pdf()]);
    await flushPromises();
    expect(w415.text()).toContain(messages.errors.notPdf);
    expect(w415.findAll('button').some((b) => b.text() === messages.upload.action.retry)).toBe(
      false,
    );
    w415.unmount();

    const w429 = mountIt(async () => {
      throw new ApiError(429, 'RATE_LIMITED');
    });
    await pick(w429, [pdf()]);
    await flushPromises();
    const retry = w429.findAll('button').find((b) => b.text() === messages.upload.action.retry);
    expect(retry).toBeDefined();
    w429.unmount();
  });

  it('US006_AC1: hủy một tệp gỡ dòng của tệp đó', async () => {
    const w = mountIt(never);
    await pick(w, [pdf('a.pdf')]);
    const cancel = w.findAll('button').find((b) => b.text() === messages.upload.action.cancel);
    await cancel?.trigger('click');
    expect(w.find('[data-state]').exists()).toBe(false);
    w.unmount();
  });

  it('US002_AC1: kéo tệp vào cửa sổ hiện lớp phủ; thả hoặc rời đi thì ẩn; kéo văn bản thì bỏ qua', async () => {
    const w = mountIt(never);
    window.dispatchEvent(dragEvent('dragenter', false));
    await w.vm.$nextTick();
    expect(w.find('[data-testid="drop-overlay"]').exists()).toBe(false);

    window.dispatchEvent(dragEvent('dragenter'));
    await w.vm.$nextTick();
    expect(w.find('[data-testid="drop-overlay"]').exists()).toBe(true);
    expect(w.text()).toContain(messages.upload.dropTitle);

    window.dispatchEvent(dragEvent('dragleave'));
    await w.vm.$nextTick();
    expect(w.find('[data-testid="drop-overlay"]').exists()).toBe(false);

    window.dispatchEvent(dragEvent('dragenter'));
    window.dispatchEvent(dragEvent('drop'));
    await w.vm.$nextTick();
    expect(w.find('[data-testid="drop-overlay"]').exists()).toBe(false);
    w.unmount();
  });

  it('US006_AC3: đủ 20 tài liệu → nút bị khóa và hiện bộ đếm', async () => {
    const w = mountIt(never, LIMITS.maxDocuments);
    const button = w.findAll('button').find((b) => b.text() === messages.upload.buttonFull);
    expect(button?.attributes('disabled')).toBeDefined();
    expect(w.get('[data-testid="slots"]').text()).toBe(
      messages.upload.counter(LIMITS.maxDocuments, LIMITS.maxDocuments),
    );
    w.unmount();
  });

  it('T11.b: hàng cục bộ dùng chung DocumentRow: "Chờ tải" khi xếp hàng, "Đang tải lên x%" khi đang tải', async () => {
    const upload: UploadFn = (_f, { onProgress }) => {
      onProgress(55, 100);
      return new Promise(() => {});
    };
    const w = mount(UploadDropzone, {
      props: { existingCount: 0, uploadFn: upload },
      attachTo: document.body,
    });
    await pick(w, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]); // đồng thời tối đa 2 → tệp thứ 3 chờ
    const statuses = w.findAll('[data-testid="doc-status"]').map((s) => s.text());
    expect(statuses).toEqual([
      messages.documents.status.uploading(55),
      messages.documents.status.uploading(55),
      messages.documents.status.queued,
    ]);
    w.unmount();
  });

  it('T11: tải xong → hàng "Đang xử lý" tới khi bản ghi thật (khớp id) xuất hiện trong danh sách thì hàng cục bộ được thay', async () => {
    const upload: UploadFn = async () => ({ id: 'srv-1', status: 'PROCESSING' });
    const w = mount(UploadDropzone, {
      props: { existingCount: 0, uploadFn: upload, serverIds: [] },
      attachTo: document.body,
    });
    await pick(w, [pdf('a.pdf')]);
    await flushPromises();
    expect(w.find('[data-state="ACCEPTED"]').exists()).toBe(true);
    expect(w.get('[data-testid="doc-status"]').text()).toBe(messages.documents.status.processing);
    expect(w.get('[data-testid="slots"]').text()).toBe(
      messages.upload.counter(1, LIMITS.maxDocuments),
    );

    await w.setProps({ serverIds: ['khac'] }); // id khác: giữ nguyên
    expect(w.find('[data-state="ACCEPTED"]').exists()).toBe(true);
    await w.setProps({ serverIds: ['srv-1'] });
    expect(w.find('[data-state]').exists()).toBe(false);
    w.unmount();
  });

  it('T11.h: hideButton ẩn nút "Tải PDF lên" nhưng pick() vẫn mở hộp chọn tệp', async () => {
    const w = mount(UploadDropzone, {
      props: { existingCount: 0, uploadFn: never, hideButton: true },
      attachTo: document.body,
    });
    expect(w.findAll('button').some((b) => b.text() === messages.upload.button)).toBe(false);
    const click = vi.spyOn(
      w.get('[data-testid="file-input"]').element as HTMLInputElement,
      'click',
    );
    (w.vm as unknown as { pick: () => void }).pick();
    expect(click).toHaveBeenCalled();
    w.unmount();
  });

  it('T11.d: đủ 20 tài liệu → bộ đếm được nhấn mạnh (chữ đậm + màu lỗi) ngoài việc khóa nút', () => {
    const w = mountIt(never, LIMITS.maxDocuments);
    const slots = w.get('[data-testid="slots"]');
    expect(slots.classes()).toContain('font-semibold');
    expect(slots.classes()).toContain('text-error');
    expect(mountIt(never, 3).get('[data-testid="slots"]').classes()).not.toContain('font-semibold');
    w.unmount();
  });

  it('gỡ component thì gỡ lắng nghe kéo-thả (không còn lớp phủ)', async () => {
    const w = mountIt(never);
    w.unmount();
    window.dispatchEvent(dragEvent('dragenter'));
    expect(document.querySelector('[data-testid="drop-overlay"]')).toBeNull();
  });
});
