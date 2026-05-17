// src/api/http.ts
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authToken';
import type { ApiResponse, RefreshResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // gửi cookie refreshToken
});

// ====== Auth routes không nên tự refresh ======
function shouldSkipAutoRefresh(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/request-verify') ||
    url.includes('/auth/verify-account') ||
    url.includes('/auth/account/recover')
  );
}

// ====== Decode JWT & check gần hết hạn ======
interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenNearExpiry(token: string, offsetSeconds = 60): boolean {
  const payload = decodeJwt(token);

  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= offsetSeconds;
}

// ====== Refresh queue: tránh gọi /auth/refresh nhiều lần cùng lúc ======
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

async function doRefreshAccessToken(): Promise<string> {
  const res = await axios.post<ApiResponse<RefreshResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );

  const newAccessToken = res.data.data.access_token;
  setAccessToken(newAccessToken);

  return newAccessToken;
}

async function queueRefreshToken(): Promise<void> {
  if (isRefreshing) {
    await new Promise<void>((resolve) => {
      pendingRequests.push(resolve);
    });
    return;
  }

  isRefreshing = true;

  try {
    await doRefreshAccessToken();
  } finally {
    isRefreshing = false;
    pendingRequests.forEach((fn) => fn());
    pendingRequests = [];
  }
}

// ====== Request interceptor: gắn token + refresh trước khi token gần hết hạn ======
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const currentToken = getAccessToken();
    const url = config.url || '';

    if (currentToken) {
      if (!shouldSkipAutoRefresh(url) && isTokenNearExpiry(currentToken, 60)) {
        try {
          await queueRefreshToken();
        } catch {
          clearAccessToken();
        }
      }

      const latestToken = getAccessToken();

      if (latestToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${latestToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ====== Response interceptor: gặp 401 thì refresh rồi retry request cũ ======
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';

      if (shouldSkipAutoRefresh(url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await queueRefreshToken();

        const newToken = getAccessToken();

        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return http(originalRequest);
      } catch (refreshErr) {
        clearAccessToken();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);