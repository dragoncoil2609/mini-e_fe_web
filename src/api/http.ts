// src/api/http.ts
import axios, {
  AxiosError,
  type AxiosInstance, type InternalAxiosRequestConfig,
} from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authToken';
import type { ApiResponse, RefreshResponse } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // để gửi cookie refresh_token
});

// ====== Decode JWT & check hết hạn ======
interface JwtPayload {
  exp?: number; // seconds since epoch
  [key: string]: any;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/'); // base64url -> base64
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// offsetSeconds: khoảng cách “sắp hết hạn” (vd: 60s)
function isTokenNearExpiry(token: string, offsetSeconds = 60): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= offsetSeconds;
}

// ====== Cơ chế refresh queue (tránh gọi /auth/refresh nhiều lần 1 lúc) ======
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

async function doRefreshAccessToken(): Promise<string> {
  const res = await axios.post<ApiResponse<RefreshResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );

  const newAccessToken = res.data.data.access_token;
  setAccessToken(newAccessToken);
  return newAccessToken;
}

async function queueRefreshToken(): Promise<void> {
  if (isRefreshing) {
    // Nếu đã có 1 thằng đang refresh, chờ nó xong
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

// ====== Request interceptor: gắn token + refresh trước khi hết hạn ======
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const currentToken = getAccessToken();

    if (currentToken) {
      // Nếu token sắp hết hạn → refresh trước khi gửi request
      if (isTokenNearExpiry(currentToken, 60)) {
        try {
          await queueRefreshToken();
        } catch (err) {
          // Refresh thất bại → xoá token, để request tiếp theo nhận 401
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
  (error) => Promise.reject(error)
);

// ====== Response interceptor: 401 -> refresh rồi retry ======
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

      // Không tự refresh cho các route auth đặc biệt
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/account/recover')
      ) {
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
        // Tuỳ bạn có muốn redirect luôn sang /login không:
        // window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
