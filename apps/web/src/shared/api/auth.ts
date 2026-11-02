import { apiRequest } from './http';
import type { Me } from './types';

export type { Me } from './types';

export function login(username: string, password: string): Promise<void> {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    handleUnauthorized: false,
  });
}

export function logout(): Promise<void> {
  return apiRequest('/api/auth/logout', { method: 'POST', handleUnauthorized: false });
}

/** @param handleUnauthorized false khi hỏi lúc khởi động: 401 ở đó chỉ nghĩa là "chưa đăng nhập". */
export function fetchMe(handleUnauthorized = true): Promise<Me> {
  return apiRequest<Me>('/api/me', { handleUnauthorized });
}
