import { defineStore } from 'pinia';
import { fetchMe, login as apiLogin, logout as apiLogout } from '../../shared/api';
import type { Me } from '../../shared/api';
import { emitSessionCleared } from '../../shared/lib/sessionEvents';

/**
 * unknown: chưa hỏi máy chủ · authenticated · anonymous: chưa đăng nhập hoặc đã đăng xuất ·
 * expired: phiên đã hết hạn giữa chừng (hiện thông báo ở trang đăng nhập).
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous' | 'expired';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'unknown' as AuthStatus,
    user: null as Me | null,
  }),
  getters: {
    isAuthenticated: (s) => s.status === 'authenticated',
  },
  actions: {
    /** Gọi một lần lúc khởi động: nếu cookie phiên còn hiệu lực thì khôi phục người dùng. */
    async init(): Promise<void> {
      if (this.status !== 'unknown') return;
      try {
        this.setUser(await fetchMe(false));
      } catch {
        // 401 = chưa đăng nhập. Mất mạng/lỗi máy chủ lúc khởi động cũng coi là chưa đăng nhập:
        // người dùng sẽ thấy trang đăng nhập và thử lại ở đó.
        this.status = 'anonymous';
      }
    },

    /** Ném lại ApiError để trang đăng nhập hiển thị thông điệp phù hợp. */
    async login(username: string, password: string): Promise<void> {
      await apiLogin(username, password);
      this.setUser(await fetchMe(false));
    },

    /** Kiểm tra lại phiên (ví dụ khi tab hiện lại); 401 sẽ kích hoạt bộ xử lý hết hạn toàn cục. */
    async refresh(): Promise<void> {
      if (this.status !== 'authenticated') return;
      try {
        this.setUser(await fetchMe(true));
      } catch {
        // 401 đã được bộ xử lý toàn cục xử lý; lỗi mạng tạm thời thì giữ nguyên trạng thái
      }
    },

    async logout(): Promise<void> {
      try {
        await apiLogout();
      } catch {
        // Dù máy chủ không phản hồi, vẫn xóa trạng thái cục bộ
      }
      this.clear('anonymous');
    },

    markExpired(): void {
      if (this.status === 'authenticated') this.clear('expired');
    },

    setUser(user: Me): void {
      this.user = user;
      this.status = 'authenticated';
    },

    clear(next: 'anonymous' | 'expired'): void {
      this.user = null;
      this.status = next;
      emitSessionCleared(); // dọn cache dữ liệu theo người dùng
    },
  },
});
