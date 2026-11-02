import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { useAuthStore } from '../features/auth/authStore';
import { apiRequest, setUnauthorizedHandler } from '../shared/api';
import { setupApp } from './bootstrap';

const fetchMock = vi.fn();

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Giả lập máy chủ: cookie phiên "còn" hay "hết" do biến alive quyết định. */
function server(state: { alive: boolean }) {
  fetchMock.mockImplementation((path: string) => {
    if (path === '/api/me') {
      return Promise.resolve(
        state.alive
          ? json(200, { id: 'u1', username: 'minh', role: 'MEMBER' })
          : json(401, { code: 'UNAUTHENTICATED' }),
      );
    }
    if (path === '/api/auth/logout') {
      state.alive = false;
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(state.alive ? json(200, {}) : json(401, { code: 'UNAUTHENTICATED' }));
  });
}

describe('setupApp / định tuyến có bảo vệ', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });

  it('chưa đăng nhập vào / → /login?redirect=/ và không hiển thị dữ liệu', async () => {
    server({ alive: false });
    const { router } = setupApp(createMemoryHistory());
    await router.push('/');
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/');
  });

  it('đường dẫn lạ khi chưa đăng nhập cũng bị chuyển về đăng nhập, nhớ đích', async () => {
    server({ alive: false });
    const { router } = setupApp(createMemoryHistory());
    await router.push('/khong-co?x=1');
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/khong-co?x=1');
  });

  it('còn phiên: vào thẳng /; vào /login thì bị đưa về nơi cần đến', async () => {
    server({ alive: true });
    const { router } = setupApp(createMemoryHistory());
    await router.push('/');
    expect(router.currentRoute.value.name).toBe('home');
    await router.push('/login?redirect=%2Fabc');
    expect(router.currentRoute.value.fullPath).toBe('/abc');
  });

  it('API trả 401 giữa chừng → phiên hết hạn, về /login nhớ trang đang xem, dọn cache', async () => {
    const state = { alive: true };
    server(state);
    const { router, queryClient } = setupApp(createMemoryHistory());
    await router.push('/trang-dang-xem');
    expect(router.currentRoute.value.name).toBe('not-found'); // đã đăng nhập, route "bắt mọi đường dẫn"
    queryClient.setQueryData(['documents'], [{ id: 'd1' }]);

    state.alive = false; // phiên hết hạn phía máy chủ
    await expect(apiRequest('/api/documents')).rejects.toMatchObject({ status: 401 });
    await flushPromises();

    const auth = useAuthStore();
    expect(auth.status).toBe('expired');
    expect(auth.user).toBeNull();
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.reason).toBe('expired');
    expect(router.currentRoute.value.query.redirect).toBe('/trang-dang-xem');
    expect(queryClient.getQueryData(['documents'])).toBeUndefined(); // cache đã bị xóa
  });

  it('đăng xuất: dọn cache và guard chặn quay lại trang cũ', async () => {
    server({ alive: true });
    const { router, queryClient } = setupApp(createMemoryHistory());
    await router.push('/');
    queryClient.setQueryData(['documents'], [{ id: 'd1' }]);

    await useAuthStore().logout();
    await router.replace({ name: 'login' });
    expect(queryClient.getQueryData(['documents'])).toBeUndefined();

    await router.push('/');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('401 khi chưa đăng nhập (ví dụ đăng nhập sai) không bị coi là hết hạn', async () => {
    server({ alive: false });
    const { router } = setupApp(createMemoryHistory());
    await router.push('/');
    await expect(apiRequest('/api/auth/login', { handleUnauthorized: false })).rejects.toBeTruthy();
    await expect(apiRequest('/api/me')).rejects.toBeTruthy();
    await flushPromises();
    expect(useAuthStore().status).toBe('anonymous'); // không phải 'expired'
    expect(router.currentRoute.value.query.reason).toBeUndefined();
  });
});
