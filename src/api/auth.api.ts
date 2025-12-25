import { http } from './http';
import type {
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RequestVerifyResponse,
  LogoutResponse,
} from './types';
import { setAccessToken, clearAccessToken } from './authToken';

// ====== PAYLOAD TYPES ======
export interface RegisterPayload {
  name: string;
  email?: string;  // ✅ optional
  phone?: string;  // ✅ optional
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email?: string;  // ✅ email OR phone
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
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// ====== API FUNCTIONS ======
export const AuthApi = {
  // 1) Đăng ký
  async register(payload: RegisterPayload) {
    const res = await http.post<ApiResponse<any>>('/auth/register', payload);
    return res.data.data;
  },

  // 2) Đăng nhập (email hoặc phone)
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/login', payload);

    const data = res.data.data;
    setAccessToken(data.access_token); // access_token lưu localStorage + RAM

    // refresh_token thường nằm cookie httpOnly
    return data;
  },

  // 3) Refresh access token
  async refresh(): Promise<RefreshResponse> {
    const res = await http.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    const data = res.data.data;
    setAccessToken(data.access_token);
    return data;
  },

  // 4) Logout
  async logout(): Promise<LogoutResponse> {
    const res = await http.post<ApiResponse<LogoutResponse>>('/auth/logout');
    clearAccessToken();
    return res.data.data;
  },

  // 5) Forgot password
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await http.post<ApiResponse<ForgotPasswordResponse>>(
      '/auth/forgot-password',
      { email }
    );
    return res.data.data;
  },

  // 6) Reset password
  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const res = await http.post<ApiResponse<ResetPasswordResponse>>(
      '/auth/reset-password',
      payload
    );
    return res.data.data;
  },

  // 7) Gửi OTP xác minh (yêu cầu đăng nhập)
  async requestVerify(): Promise<RequestVerifyResponse> {
    const res = await http.post<ApiResponse<RequestVerifyResponse>>('/auth/request-verify');
    return res.data.data;
  },

  // 8) Verify account (yêu cầu đăng nhập)
  async verifyAccount(otp: string): Promise<{ verified: boolean }> {
    const res = await http.post<ApiResponse<{ verified: boolean }>>(
      '/auth/verify-account',
      { otp }
    );
    return res.data.data;
  },

  // 9) Recover request (bị vô hiệu hoá)
  async recoverRequest(email: string): Promise<void> {
    await http.post<ApiResponse<any>>('/auth/account/recover/request', { email });
  },

  // 10) Recover confirm
  async recoverConfirm(payload: RecoverConfirmPayload): Promise<void> {
    await http.post<ApiResponse<any>>('/auth/account/recover/confirm', payload);
  },
};
