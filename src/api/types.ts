// src/api/types.ts

// Response chuẩn của BE
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  error?: string; // ví dụ "Bad Request", "Unauthorized"
  data: T;
}

// Kiểu User cơ bản trong phần auth
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  isVerified: boolean;
  createdAt?: string;
  // có thể thêm lastLoginAt, updatedAt... sau nếu BE trả về
}

// Login / register / refresh response

export interface LoginResponse {
  access_token: string;     // JWT 15m
  refresh_token: string;    // JWT 7d (nhưng nằm trong cookie httpOnly)
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  user: AuthUser;
}

export interface ForgotPasswordResponse {
  email: string;
  otp?: string;        // dev mode có thể nhận OTP
  expiresAt?: string;
}

export interface RequestVerifyResponse {
  email: string;
  otp?: string;
  expiresAt?: string;
  isVerified?: boolean;
}

export interface ResetPasswordResponse {
  reset: boolean;
}

export interface LogoutResponse {
  loggedOut: boolean;
}
