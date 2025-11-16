import { http } from './http';
import type {
  ApiResponse,
  AuthUser,
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
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
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
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await http.post<ApiResponse<AuthUser>>(
      '/auth/register',
      payload
    );
    // 201 created; data là user
    return res.data.data;
  },

  // 2) Đăng nhập
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await http.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      payload
    );

    const data = res.data.data;
    // Lưu access_token in-memory
    setAccessToken(data.access_token);

    // refresh_token thì BE giữ trong cookie httpOnly
    return data;
  },

  // 3) Refresh access token (nếu muốn tự gọi tay, còn interceptor đã lo phần lớn)
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

  // 5) Quên mật khẩu – yêu cầu OTP
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await http.post<ApiResponse<ForgotPasswordResponse>>(
      '/auth/forgot-password',
      { email }
    );
    return res.data.data;
  },

  // 6) Đặt lại mật khẩu (nhập OTP)
  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const res = await http.post<ApiResponse<ResetPasswordResponse>>(
      '/auth/reset-password',
      payload
    );
    return res.data.data;
  },

  // 7) Gửi OTP xác minh tài khoản (yêu cầu đăng nhập)
  async requestVerify(): Promise<RequestVerifyResponse> {
    const res = await http.post<ApiResponse<RequestVerifyResponse>>(
      '/auth/request-verify'
    );
    return res.data.data;
  },

  // 8) Xác minh tài khoản (nhập OTP, yêu cầu đăng nhập)
  async verifyAccount(otp: string): Promise<{ verified: boolean }> {
    const res = await http.post<ApiResponse<{ verified: boolean }>>(
      '/auth/verify-account',
      { otp }
    );
    return res.data.data;
  },

    // 9) Yêu cầu khôi phục tài khoản (bị vô hiệu hoá)
  async recoverRequest(email: string): Promise<void> {
    await http.post<ApiResponse<any>>('/auth/account/recover/request', {
      email,
    });
  },

    // 10) Xác nhận khôi phục tài khoản (OTP + mật khẩu mới)
  async recoverConfirm(payload: RecoverConfirmPayload): Promise<void> {
    await http.post<ApiResponse<any>>(
      '/auth/account/recover/confirm',
      payload
    );
  },
};