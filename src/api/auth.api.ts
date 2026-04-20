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
  email?: string; // email OR phone
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
  email: string; // backend hiện dùng field này như identifier (email hoặc phone)
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

    if (data.access_token) {
      setAccessToken(data.access_token);
    }

    return data;
  },

  async refresh(): Promise<RefreshResponse> {
    const res = await http.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    const data = res.data.data;
    setAccessToken(data.access_token);
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
      { email }
    );
    return res.data.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const res = await http.post<ApiResponse<ResetPasswordResponse>>(
      '/auth/reset-password',
      payload
    );
    return res.data.data;
  },

  async requestVerify(via?: 'email' | 'phone'): Promise<RequestVerifyResponse> {
    const res = await http.post<ApiResponse<RequestVerifyResponse>>(
      '/auth/request-verify',
      via ? { via } : {}
    );
    return res.data.data;
  },

  async verifyAccount(otp: string): Promise<VerifyAccountResponse> {
    const res = await http.post<ApiResponse<VerifyAccountResponse>>(
      '/auth/verify-account',
      { otp }
    );
    return res.data.data;
  },

  async recoverRequest(email: string): Promise<void> {
    await http.post<ApiResponse<any>>('/auth/account/recover/request', { email });
  },

  async recoverConfirm(payload: RecoverConfirmPayload): Promise<void> {
    await http.post<ApiResponse<any>>('/auth/account/recover/confirm', payload);
  },
};