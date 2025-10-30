import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const publicEndpoints = [
        '/auth/register',
        '/auth/login',
        '/auth/request-verify',
        '/auth/verify-account',
        '/auth/forgot-password',
        '/auth/reset-password',
      ];
      if (!publicEndpoints.some((e) => url.includes(e))) {
        localStorage.removeItem('accessToken');
        if (window.location.pathname !== '/auth') window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


