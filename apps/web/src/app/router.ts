import { createRouter, createWebHistory } from 'vue-router';
import type { RouterHistory } from 'vue-router';
import LoginPage from '../features/auth/LoginPage.vue';
import { useAuthStore } from '../features/auth/authStore';
import { safeRedirect } from '../shared/lib/safeRedirect';
import HomeView from './HomeView.vue';
import NotFoundView from './NotFoundView.vue';

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      // guestOnly: người đã đăng nhập vào đây thì được đưa về nơi cần đến
      { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
      // Trang thử bộ thành phần: chỉ có khi chạy dev, không cần đăng nhập
      ...(import.meta.env.DEV
        ? [
            {
              path: '/design-system',
              name: 'design-system',
              component: () => import('./DesignSystemView.vue'),
              meta: { public: true },
            },
          ]
        : []),
      { path: '/', name: 'home', component: HomeView },
      // Mọi đường dẫn khác cũng cần đăng nhập (không lộ cấu trúc ứng dụng cho người chưa đăng nhập)
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
    ],
  });

  router.beforeEach(async (to) => {
    const auth = useAuthStore();
    await auth.init();

    if (to.meta.public) return true;
    if (to.meta.guestOnly) {
      // Đã đăng nhập mà vào trang đăng nhập thì về nơi cần đến
      return auth.isAuthenticated ? safeRedirect(to.query.redirect) : true;
    }
    if (!auth.isAuthenticated) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
          ...(auth.status === 'expired' ? { reason: 'expired' } : {}),
        },
      };
    }
    return true;
  });

  return router;
}
