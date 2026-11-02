import './shared/ui/base.css';
import { setupApp } from './app/bootstrap';

async function start(): Promise<void> {
  // Dev với API giả (MSW): VITE_API_MOCK=true npm run dev — chạy được toàn bộ giao diện không cần backend
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK === 'true') {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      await startMockWorker();
    } catch (e) {
      // Service worker bị chặn (ví dụ test chặn nó): vẫn chạy ứng dụng, các request đi tiếp ra mạng
      console.warn('Cannot start the mock API (MSW):', e);
    }
  }
  setupApp().app.mount('#app');
}

void start();
