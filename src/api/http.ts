import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authToken';
import type { ApiResponse, RefreshResponse } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Tạo instance chung
export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // để gửi / nhận cookie refreshToken
});

// ✅ Gắn access_token cho mọi request (nếu có)
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔁 Biến dùng cho refresh token queue
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

// Hàm gọi /auth/refresh trực tiếp (dùng axios gốc để tránh loop interceptor)
async function refreshAccessToken() {
  const res = await axios.post<ApiResponse<RefreshResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    {
      withCredentials: true, // gửi cookie refreshToken
    }
  );

  const newAccessToken = res.data.data.access_token;
  setAccessToken(newAccessToken);
  return newAccessToken;
}

// ⚠️ Thêm thuộc tính _retry cho request (tránh lặp vô hạn)
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// ✅ Interceptor response: bắt 401 → refresh → retry
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Không xử lý refresh cho các route auth đặc biệt để tránh vòng lặp linh tinh
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Nếu đang refresh rồi → chờ xong
        await new Promise<void>((resolve) => {
          pendingRequests.push(resolve);
        });
        // Sau khi refresh xong, retry request
        return http(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        isRefreshing = false;
        pendingRequests.forEach((fn) => fn());
        pendingRequests = [];

        // Gắn token mới vào header và retry
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return http(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        pendingRequests = [];
        clearAccessToken();
        // Có thể redirect sang /login nếu muốn:
        // window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
