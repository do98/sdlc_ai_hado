import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { messages } from '../lib/messages';
import Button from './Button.vue';
import Dialog from './Dialog.vue';
import ErrorBoundary from './ErrorBoundary.vue';
import InlineAlert from './InlineAlert.vue';
import Input from './Input.vue';
import Skeleton from './Skeleton.vue';
import Toaster from './Toaster.vue';
import Tooltip from './Tooltip.vue';
import { useToast } from './toast';

afterEach(() => {
  document.body.replaceChildren();
});

describe('Button', () => {
  it('có 3 biến thể và mặc định type="button" để không vô tình gửi form', () => {
    const primary = mount(Button, { slots: { default: 'A' } });
    expect(primary.attributes('type')).toBe('button');
    expect(primary.classes()).toContain('bg-primary');
    expect(
      mount(Button, { props: { variant: 'secondary' }, slots: { default: 'B' } }).classes(),
    ).toContain('border-primary');
    expect(
      mount(Button, { props: { variant: 'danger' }, slots: { default: 'C' } }).classes(),
    ).toContain('bg-error');
  });

  it('disabled: không phát sự kiện click', async () => {
    const onClick = vi.fn();
    const w = mount(Button, { props: { disabled: true, onClick }, slots: { default: 'A' } });
    expect(w.attributes('disabled')).toBeDefined();
    await w.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading: vô hiệu hóa, aria-busy, có thông báo cho trình đọc màn hình, không gửi trùng', async () => {
    const onClick = vi.fn();
    const w = mount(Button, { props: { loading: true, onClick }, slots: { default: 'Lưu' } });
    expect(w.attributes('disabled')).toBeDefined();
    expect(w.attributes('aria-busy')).toBe('true');
    expect(w.find('.sr-only').text()).toBe(messages.ui.loading);
    expect(w.find('svg').attributes('aria-hidden')).toBe('true');
    await w.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('bình thường: bấm được và nhận focus bàn phím; có chiều cao chạm tối thiểu', async () => {
    const onClick = vi.fn();
    const w = mount(Button, { props: { onClick }, slots: { default: 'Gửi' } });
    await w.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(w.classes()).toContain('min-h-target');
    expect(w.attributes('aria-busy')).toBeUndefined();
  });
});

describe('Input', () => {
  it('nhãn gắn với ô nhập, v-model cập nhật, không có aria-invalid khi không lỗi', async () => {
    const w = mount(Input, { props: { modelValue: '', label: 'Tên', id: 'ten' } });
    expect(w.get('label').attributes('for')).toBe('ten');
    expect(w.get('input').attributes('id')).toBe('ten');
    expect(w.get('input').attributes('aria-invalid')).toBeUndefined();
    await w.get('input').setValue('abc');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['abc']);
  });

  it('tự sinh id duy nhất khi không truyền (trong cùng một ứng dụng)', () => {
    const Two = defineComponent({
      render: () =>
        h('div', [
          h(Input, { modelValue: '', label: 'A' }),
          h(Input, { modelValue: '', label: 'B' }),
        ]),
    });
    const w = mount(Two);
    const ids = w.findAll('input').map((i) => i.attributes('id'));
    expect(ids[0]).not.toBe(ids[1]);
    expect(w.findAll('label').map((l) => l.attributes('for'))).toEqual(ids);
  });
  it('lỗi: aria-invalid + aria-describedby trỏ tới vùng thông báo có aria-live; gợi ý khi không lỗi', () => {
    const err = mount(Input, {
      props: { modelValue: '', label: 'Tên', id: 'ten', error: 'Bắt buộc nhập' },
    });
    expect(err.get('input').attributes('aria-invalid')).toBe('true');
    const msg = err.get('#ten-message');
    expect(err.get('input').attributes('aria-describedby')).toBe('ten-message');
    expect(msg.text()).toBe('Bắt buộc nhập');
    expect(msg.attributes('aria-live')).toBe('polite');
    expect(msg.classes()).toContain('text-error');

    const hint = mount(Input, {
      props: { modelValue: '', label: 'Tên', id: 'ten', hint: 'Gợi ý' },
    });
    expect(hint.get('#ten-message').text()).toBe('Gợi ý');
    expect(hint.get('input').attributes('aria-invalid')).toBeUndefined();
  });

  it('bộ đếm theo điểm mã Unicode: ký tự nhiều byte/emoji đếm là 1; đổi trạng thái gần/quá giới hạn', async () => {
    const w = mount(Input, {
      props: { modelValue: 'ạ😀', label: 'Q', counter: true, maxlength: 10 },
    });
    expect(w.get('[data-testid="counter"]').text()).toBe('2/10');
    expect(w.get('[data-testid="counter"]').classes()).toContain('text-muted');

    await w.setProps({ modelValue: 'a'.repeat(9) });
    expect(w.get('[data-testid="counter"]').text()).toBe('9/10');
    expect(w.get('[data-testid="counter"]').classes()).toContain('text-warning');

    await w.setProps({ modelValue: 'a'.repeat(11) });
    expect(w.get('[data-testid="counter"]').classes()).toContain('text-error');
    expect(w.get('input').attributes('maxlength')).toBe('10');
  });

  it('không hiện bộ đếm khi không bật; vô hiệu hóa chuyển sang kiểu disabled', () => {
    const w = mount(Input, {
      props: { modelValue: 'x', label: 'Q', maxlength: 5, disabled: true },
    });
    expect(w.find('[data-testid="counter"]').exists()).toBe(false);
    expect(w.get('input').attributes('disabled')).toBeDefined();
  });
});

describe('InlineAlert', () => {
  it('lỗi dùng role="alert"; loại khác dùng role="status"; luôn có biểu tượng chữ (không chỉ màu)', () => {
    const e = mount(InlineAlert, { props: { variant: 'error' }, slots: { default: 'Lỗi' } });
    expect(e.attributes('role')).toBe('alert');
    expect(e.get('[aria-hidden="true"]').text()).not.toBe('');
    for (const variant of ['info', 'success', 'warning'] as const) {
      const w = mount(InlineAlert, { props: { variant }, slots: { default: 'x' } });
      expect(w.attributes('role')).toBe('status');
      expect(w.get('[aria-hidden="true"]').text()).not.toBe('');
    }
  });
});

describe('Skeleton', () => {
  it('chỉ trang trí (aria-hidden) khi không có nhãn', () => {
    const w = mount(Skeleton, { attrs: { class: 'h-4 w-full' } });
    expect(w.attributes('aria-hidden')).toBe('true');
    expect(w.classes()).toEqual(
      expect.arrayContaining(['h-4', 'w-full', 'animate-pulse', 'motion-reduce:animate-none']),
    );
  });

  it('có nhãn: thông báo trạng thái đang tải cho trình đọc màn hình', () => {
    const w = mount(Skeleton, { props: { label: 'Đang tải' }, attrs: { class: 'h-4' } });
    expect(w.attributes('role')).toBe('status');
    expect(w.get('.sr-only').text()).toBe('Đang tải');
    expect(w.get('[aria-hidden="true"]').classes()).toContain('h-4');
  });
});

describe('Dialog', () => {
  const Host = defineComponent({
    setup() {
      const open = ref(false);
      return () =>
        h('div', [
          h('button', { id: 'opener', onClick: () => (open.value = true) }, 'Mở'),
          h(
            Dialog,
            {
              open: open.value,
              'onUpdate:open': (v: boolean) => (open.value = v),
              title: 'Xác nhận',
              description: 'Mô tả',
            },
            () => h('input', { id: 'inside' }),
          ),
        ]);
    },
  });

  it('có role="dialog", aria-modal, tiêu đề và mô tả; hiện nội dung và nút đóng', async () => {
    const w = mount(Host, { attachTo: document.body });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await w.get('#opener').trigger('click');
    await flushPromises();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(dialog.textContent).toContain('Xác nhận');
    expect(dialog.textContent).toContain('Mô tả');
    expect(dialog.textContent).toContain(messages.ui.close);
    w.unmount();
  });

  it('bàn phím: Esc đóng hộp thoại', async () => {
    const w = mount(Host, { attachTo: document.body });
    await w.get('#opener').trigger('click');
    await flushPromises();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    w.unmount();
  });

  it('nút Đóng trong hộp thoại đóng được, focus được chuyển vào bên trong khi mở', async () => {
    const w = mount(Host, { attachTo: document.body });
    (w.get('#opener').element as HTMLElement).focus();
    await w.get('#opener').trigger('click');
    await flushPromises();
    await nextTick();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.contains(document.activeElement)).toBe(true); // bẫy focus bắt đầu bên trong
    const close = [...dialog.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(messages.ui.close),
    );
    close?.click();
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    w.unmount();
  });
});

describe('Toaster và useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToast().clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    useToast().clear();
  });

  it('thành công: hiện thông báo, tự ẩn sau 5 giây', async () => {
    const w = mount(Toaster, { attachTo: document.body });
    useToast().success('Đã lưu');
    await nextTick();
    await flushPromises();
    expect(document.body.textContent).toContain('Đã lưu');

    await vi.advanceTimersByTimeAsync(5100);
    await flushPromises();
    expect(document.body.textContent).not.toContain('Đã lưu');
    w.unmount();
  });

  it('lỗi: ở lại cho tới khi người dùng đóng; nút đóng có nhãn', async () => {
    const w = mount(Toaster, { attachTo: document.body });
    useToast().error('Không lưu được');
    await nextTick();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(60_000);
    await flushPromises();
    expect(document.body.textContent).toContain('Không lưu được');

    const close = document.querySelector(
      `[aria-label="${messages.ui.dismissNotification}"]`,
    ) as HTMLElement;
    expect(close).not.toBeNull();
    close.click();
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();
    expect(document.body.textContent).not.toContain('Không lưu được');
    w.unmount();
  });

  it('có vùng thông báo (region) có nhãn và lỗi được đọc ngay (assertive), thành công đọc lịch sự (polite)', async () => {
    const w = mount(Toaster, { attachTo: document.body });
    useToast().error('Lỗi A');
    useToast().success('Thành công B');
    await nextTick();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
    expect(
      document.querySelector(`[role="region"][aria-label^="${messages.ui.notifications}"]`),
    ).not.toBeNull();
    const live = [...document.querySelectorAll('[aria-live]')].map((e) =>
      e.getAttribute('aria-live'),
    );
    expect(live).toContain('assertive');
    expect(live).toContain('polite');
    w.unmount();
  });
});

describe('Tooltip', () => {
  it('hiện khi focus bàn phím vào phần tử kích hoạt', async () => {
    const w = mount(Tooltip, {
      props: { text: 'Gợi ý hữu ích' },
      slots: { default: '<button type="button">Nút</button>' },
      attachTo: document.body,
    });
    expect(document.body.textContent).not.toContain('Gợi ý hữu ích');
    await w.get('button').trigger('focus');
    await flushPromises();
    expect(document.body.textContent).toContain('Gợi ý hữu ích');
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    w.unmount();
  });
});

describe('ErrorBoundary', () => {
  it('lỗi ở cây con không làm trắng trang: hiện thông báo và cho thử lại', async () => {
    let shouldThrow = true;
    const Bad = defineComponent({
      setup() {
        if (shouldThrow) throw new Error('hỏng khi render');
        return () => h('p', { id: 'ok' }, 'Nội dung bình thường');
      },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(ErrorBoundary, { slots: { default: () => h(Bad) } });
    await flushPromises();
    expect(w.get('[role="alert"]').text()).toContain(messages.errorBoundary.title);
    expect(w.text()).toContain(messages.errorBoundary.description);
    expect(w.emitted('error')).toHaveLength(1);
    expect(w.find('#ok').exists()).toBe(false);

    shouldThrow = false;
    await w.findAll('button')[0].trigger('click'); // Thử lại
    await flushPromises();
    expect(w.find('#ok').exists()).toBe(true);
    expect(w.find('[role="alert"]').exists()).toBe(false);
    spy.mockRestore();
  });

  it('không lỗi thì hiển thị nguyên nội dung', () => {
    const w = mount(ErrorBoundary, { slots: { default: '<p id="x">ổn</p>' } });
    expect(w.find('#x').exists()).toBe(true);
  });
});
