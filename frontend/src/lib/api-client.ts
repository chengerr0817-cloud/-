import axios, { AxiosError } from 'axios';

/** 本地 JWT token 在 localStorage 中的 key。 */
export const TOKEN_KEY = 'moji_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

/**
 * 与本地后端通信的 Axios 实例。
 * 开发环境通过 Vite 代理把 /api 转发到 http://localhost:3000。
 */
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** 请求拦截器：附加本地 JWT。 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/** 响应拦截器：401 时清除本地登录态。 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
    }
    return Promise.reject(error);
  }
);

/** 从各类错误中提取可读信息。 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      '请求失败'
    );
  }
  if (error instanceof Error) return error.message;
  return '发生未知错误';
}

export default apiClient;
