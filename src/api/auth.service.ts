import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Thêm response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ xử lý 401 cho các endpoint cần authentication
      const url = error.config?.url || '';
      const publicEndpoints = ['/auth/register', '/auth/login', '/auth/request-verify', '/auth/verify-account', '/auth/forgot-password', '/auth/reset-password'];
      
      if (!publicEndpoints.some(endpoint => url.includes(endpoint))) {
        // Token hết hạn, clear localStorage
        localStorage.removeItem('accessToken');
        // Chỉ redirect nếu không phải trang auth
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyAccountData {
  otp: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

function extractErrMessage(error: any): string {
  const data = error?.response?.data;
  const msg = data?.message ?? data?.error ?? error?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  return msg || 'Đã xảy ra lỗi, vui lòng thử lại';
}

export const authService = {
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi đăng ký');
    }
  },

  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await api.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi đăng nhập');
    }
  },

  async requestVerify(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth/request-verify');
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi gửi mã xác minh');
    }
  },

  async verifyAccount(data: VerifyAccountData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth/verify-account', data);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi xác minh tài khoản');
    }
  },

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi làm mới token');
    }
  },
// Đăng xuất người dùng

  async logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi đăng xuất');
    }
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi gửi email reset mật khẩu');
    }
  },

  async resetPassword(data: { email: string; otp: string; password: string; confirmPassword: string }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi reset mật khẩu');
    }
  },

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrMessage(error) || 'Lỗi thay đổi mật khẩu');
    }
  },
};
