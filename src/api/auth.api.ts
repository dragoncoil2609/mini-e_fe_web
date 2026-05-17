// src/api/auth.api.ts
import { http } from './http';
import type {
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RequestVerifyResponse,
  LogoutResponse,
  VerifyAccountResponse,
} from './types';
import { setAccessToken, clearAccessToken } from './authToken';

// ====== PAYLOAD TYPES ======
export interface RegisterPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export interface RecoverConfirmPayload {
  // BE hiện đang dùng field email như identifier: có thể là email hoặc số điện thoại
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// ====== API FUNCTIONS ======
export const AuthApi = {
  async register(payload: RegisterPayload) {
    const res = await http.post<ApiResponse<any>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    const data = res.data.data;

    // Nếu login thành công hoặc login nhưng chưa verify,
    // BE vẫn có thể trả access_token tạm để gọi /request-verify và /verify-account.
    if (data.access_token) {
      setAccessToken(data.access_token);
    }

    return data;
  },

  async refresh(): Promise<RefreshResponse> {
    const res = await http.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    const data = res.data.data;

    if (data.access_token) {
      setAccessToken(data.access_token);
    }

    return data;
  },

  async logout(): Promise<LogoutResponse> {
    const res = await http.post<ApiResponse<LogoutResponse>>('/auth/logout');
    clearAccessToken();
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await http.post<ApiResponse<ForgotPasswordResponse>>(
      '/auth/forgot-password',
      { email },
    );

    return res.data.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const res = await http.post<ApiResponse<ResetPasswordResponse>>(
      '/auth/reset-password',
      payload,
    );

    return res.data.data;
  },

  async requestVerify(via?: 'email' | 'phone'): Promise<RequestVerifyResponse> {
    const res = await http.post<ApiResponse<RequestVerifyResponse>>(
      '/auth/request-verify',
      via ? { via } : {},
    );

    return res.data.data;
  },

  async verifyAccount(otp: string): Promise<VerifyAccountResponse> {
    const res = await http.post<ApiResponse<VerifyAccountResponse>>(
      '/auth/verify-account',
      { otp },
    );

    const data = res.data.data;

    // Sau khi verify thành công, BE trả access_token mới có isVerified=true.
    if (data.access_token) {
      setAccessToken(data.access_token);
    }

    return data;
  },

  async recoverRequest(identifier: string): Promise<any> {
    const payload = identifier.includes('@')
      ? { email: identifier }
      : { phone: identifier };

    const res = await http.post<ApiResponse<any>>(
      '/auth/account/recover/request',
      payload,
    );

    return res.data.data;
  },

  async recoverConfirm(payload: RecoverConfirmPayload): Promise<any> {
    const res = await http.post<ApiResponse<any>>(
      '/auth/account/recover/confirm',
      payload,
    );

    return res.data.data;
  },
};