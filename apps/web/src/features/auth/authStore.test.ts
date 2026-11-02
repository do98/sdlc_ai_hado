import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api';
import * as api from '../../shared/api';
import { onSessionCleared } from '../../shared/lib/sessionEvents';
import { useAuthStore } from './authStore';

vi.mock('../../shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/api')>();
  return { ...actual, fetchMe: vi.fn(), login: vi.fn(), logout: vi.fn() };
});

const me = { id: 'u1', username: 'minh', role: 'MEMBER' as const };

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(api.fetchMe).mockReset();
    vi.mocked(api.login).mockReset();
    vi.mocked(api.logout).mockReset();
  });

  it('init: có phiên → authenticated; hỏi một lần duy nhất', async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    const s = useAuthStore();
    await s.init();
    await s.init();
    expect(s.status).toBe('authenticated');
    expect(s.user).toEqual(me);
    expect(api.fetchMe).toHaveBeenCalledTimes(1);
    expect(api.fetchMe).toHaveBeenCalledWith(false);
  });

  it('init: 401 hoặc lỗi mạng → anonymous', async () => {
    vi.mocked(api.fetchMe).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED'));
    const s = useAuthStore();
    await s.init();
    expect(s.status).toBe('anonymous');

    setActivePinia(createPinia());
    vi.mocked(api.fetchMe).mockRejectedValue(new ApiError(0, 'NETWORK_ERROR'));
    const s2 = useAuthStore();
    await s2.init();
    expect(s2.status).toBe('anonymous');
  });

  it('login: gọi API rồi nạp người dùng; lỗi được ném lại và không đổi trạng thái', async () => {
    const s = useAuthStore();
    vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS'));
    await expect(s.login('minh', 'sai')).rejects.toMatchObject({ status: 401 });
    expect(s.isAuthenticated).toBe(false);

    vi.mocked(api.login).mockResolvedValue();
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    await s.login('minh', 'dung');
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.username).toBe('minh');
  });

  it('logout: xóa người dùng, phát sự kiện dọn cache, kể cả khi máy chủ lỗi', async () => {
    vi.mocked(api.fetchMe).mockResolvedValue(me);
    const s = useAuthStore();
    await s.init();
    const cleared = vi.fn();
    const off = onSessionCleared(cleared);

    vi.mocked(api.logout).mockRejectedValue(new ApiError(0, 'NETWORK_ERROR'));
    await s.logout();
    expect(s.user).toBeNull();
    expect(s.status).toBe('anonymous');
    expect(cleared).toHaveBeenCalledTimes(1);
    off();
  });

  it('markExpired: chỉ khi đang đăng nhập; xóa người dùng và dọn cache', async () => {
    const s = useAuthStore();
    const cleared = vi.fn();
    const off = onSessionCleared(cleared);
    s.markExpired(); // chưa đăng nhập: không làm gì
    expect(cleared).not.toHaveBeenCalled();

    s.setUser(me);
    s.markExpired();
    expect(s.status).toBe('expired');
    expect(s.user).toBeNull();
    expect(cleared).toHaveBeenCalledTimes(1);
    off();
  });

  it('refresh: chỉ chạy khi đang đăng nhập; lỗi tạm thời giữ nguyên trạng thái', async () => {
    const s = useAuthStore();
    await s.refresh();
    expect(api.fetchMe).not.toHaveBeenCalled();

    s.setUser(me);
    vi.mocked(api.fetchMe).mockRejectedValue(new ApiError(0, 'NETWORK_ERROR'));
    await s.refresh();
    expect(s.status).toBe('authenticated');
  });
});
