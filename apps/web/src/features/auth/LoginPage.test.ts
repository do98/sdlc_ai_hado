import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiError } from '../../shared/api';
import * as api from '../../shared/api';
import { messages } from '../../shared/lib/messages';
import LoginPage from './LoginPage.vue';

vi.mock('../../shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api')>();
  return { ...actual, fetchMe: vi.fn(), login: vi.fn(), logout: vi.fn() };
});

const me = { id: 'u1', username: 'minh', role: 'MEMBER' as const };

async function mountAt(url: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginPage },
      { path: '/', name: 'home', component: { template: '<p>home</p>' } },
      { path: '/docs', name: 'docs', component: { template: '<p>docs</p>' } },
    ],
  });
  await router.push(url);
  await router.isReady();
  const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
  return { wrapper, router };
}

async function fill(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'], u: string, p: string) {
  await wrapper.get('#username').setValue(u);
  await wrapper.get('#password').setValue(p);
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(api.fetchMe).mockReset();
    vi.mocked(api.login).mockReset();
  });

  it('có nhãn gắn với ô nhập, thuộc tính autocomplete và nút bị khóa khi chưa nhập', async () => {
    const { wrapper } = await mountAt('/login');
    expect(wrapper.get('label[for="username"]').text()).toBe(messages.auth.username);
    expect(wrapper.get('label[for="password"]').text()).toBe(messages.auth.password);
    expect(wrapper.get('#username').attributes('autocomplete')).toBe('username');
    expect(wrapper.get('#password').attributes('autocomplete')).toBe('current-password');
    expect(wrapper.get('#password').attributes('type')).toBe('password');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
    await fill(wrapper, 'minh', 'x');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
  });

  it('đăng nhập đúng → về trang đích đã nhớ (redirect)', async () => {
    vi.mocked(api.login).mockResolvedValue();
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    const { wrapper, router } = await mountAt('/login?redirect=%2Fdocs');
    await fill(wrapper, ' minh ', 'mat-khau');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(api.login).toHaveBeenCalledWith('minh', 'mat-khau'); // tên đã được cắt khoảng trắng
    expect(router.currentRoute.value.fullPath).toBe('/docs');
  });

  it('redirect độc hại bị bỏ qua, về /', async () => {
    vi.mocked(api.login).mockResolvedValue();
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    const { wrapper, router } = await mountAt('/login?redirect=https%3A%2F%2Fevil.example');
    await fill(wrapper, 'minh', 'x');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('401 và 423 hiển thị CÙNG một thông điệp chung, không nêu lý do', async () => {
    const texts: string[] = [];
    for (const status of [401, 423]) {
      vi.mocked(api.login).mockRejectedValue(
        new ApiError(status, status === 401 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_LOCKED'),
      );
      const { wrapper, router } = await mountAt('/login');
      await fill(wrapper, 'minh', 'sai');
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      const alert = wrapper.get('[role="alert"]');
      texts.push(alert.text());
      expect(alert.text()).toContain(messages.auth.failed);
      expect(alert.text().toLowerCase()).not.toContain('khóa');
      expect(router.currentRoute.value.path).toBe('/login');
      expect((wrapper.get('#password').element as HTMLInputElement).value).toBe(''); // xóa mật khẩu đã nhập
    }
    expect(new Set(texts).size).toBe(1); // hai trường hợp cho đúng cùng một văn bản
  });

  it('429, mất mạng và lỗi khác có thông điệp riêng', async () => {
    const cases: [ApiError, string][] = [
      [new ApiError(429, 'RATE_LIMITED'), messages.auth.rateLimited],
      [new ApiError(0, 'NETWORK_ERROR'), messages.auth.network],
      [new ApiError(500, 'INTERNAL'), messages.errors.internal],
    ];
    for (const [err, text] of cases) {
      vi.mocked(api.login).mockRejectedValue(err);
      const { wrapper } = await mountAt('/login');
      await fill(wrapper, 'minh', 'x');
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain(text);
    }
  });

  it('khóa nút khi đang gửi để không gửi trùng', async () => {
    let finish: () => void = () => {};
    vi.mocked(api.login).mockReturnValue(new Promise<void>((r) => (finish = r)));
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    const { wrapper } = await mountAt('/login');
    await fill(wrapper, 'minh', 'x');
    await wrapper.get('form').trigger('submit');
    await wrapper.get('form').trigger('submit');
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
    finish();
    await flushPromises();
  });

  it('hiện thông báo hết hạn khi tới từ phiên hết hạn', async () => {
    const { wrapper } = await mountAt('/login?reason=expired&redirect=%2Fdocs');
    expect(wrapper.get('[role="status"]').text()).toContain(messages.auth.expired);
  });
});
