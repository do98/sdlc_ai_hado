import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import type { RouterHistory } from 'vue-router';
import { useAuthStore } from '../features/auth/authStore';
import { setUnauthorizedHandler } from '../shared/api';
import { onSessionCleared } from '../shared/lib/sessionEvents';
import App from './App.vue';
import { createAppRouter } from './router';

/** Dựng ứng dụng: router, pinia, cache truy vấn và các móc xử lý phiên. Tách khỏi main.ts để kiểm thử được. */
export function setupApp(history?: RouterHistory) {
  const app = createApp(App);
  const pinia = createPinia();
  const queryClient = new QueryClient();
  const router = createAppRouter(history);

  app.use(pinia).use(router).use(VueQueryPlugin, { queryClient });

  // Đăng xuất hoặc hết hạn: xóa cache để người sau không thấy dữ liệu của người trước
  onSessionCleared(() => queryClient.clear());

  const auth = useAuthStore(pinia);
  // Mọi API trả 401 khi đang đăng nhập = phiên hết hạn → về trang đăng nhập, nhớ trang đang xem
  setUnauthorizedHandler(() => {
    if (!auth.isAuthenticated) return;
    auth.markExpired();
    void router.replace({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath, reason: 'expired' },
    });
  });

  return { app, router, pinia, queryClient };
}
