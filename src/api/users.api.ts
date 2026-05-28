import { http } from './http';
import { clearAccessToken } from './authToken';
import type { ApiResponse, PaginatedData, User, UserListQuery } from './types';

/**
 * Helper: convert object -> query string
 */
function toQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
      return;
    }

    searchParams.append(key, String(value));
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------------------------------------------
 * 1) USER HIỆN TẠI
 * ------------------------------------------------------------------ */

export async function getMe(): Promise<User> {
  const res = await http.get<ApiResponse<User>>('/users/me');
  return res.data.data;
}

export interface UpdateMePayload {
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;

  /**
   * Giữ tạm để UI cũ không lỗi TypeScript.
   * BE mới không cho đổi password qua /users/me nữa.
   * Hàm updateMe sẽ tự bỏ field này trước khi gửi.
   */
  password?: string;
}

export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const { password: _password, ...safePayload } = payload;

  const res = await http.patch<ApiResponse<User>>('/users/me', safePayload);
  return res.data.data;
}

/* ------------------------------------------------------------------
 * 1.1) ĐỔI MẬT KHẨU USER ĐANG ĐĂNG NHẬP
 * ------------------------------------------------------------------ */

export interface RequestChangePasswordOtpResult {
  sent: boolean;
  via?: 'email' | string;
  target?: string;
  expiresInMinutes?: number;
  message?: string;
}

export async function requestChangePasswordOtp(): Promise<RequestChangePasswordOtpResult> {
  const res = await http.post<ApiResponse<RequestChangePasswordOtpResult>>(
    '/users/me/change-password/request-otp',
  );

  return res.data.data;
}

export interface ChangeMyPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  otp: string;
}

export interface ChangeMyPasswordResult {
  changed: boolean;
  message?: string;
}

export async function changeMyPassword(
  payload: ChangeMyPasswordPayload,
): Promise<ChangeMyPasswordResult> {
  const res = await http.patch<ApiResponse<ChangeMyPasswordResult>>(
    '/users/me/change-password',
    payload,
  );

  return res.data.data;
}

export interface DeactivateUserResult {
  id: number;
  deactivated?: boolean;
  deleted?: boolean;
  message?: string;
}

/**
 * User tự vô hiệu hóa/xóa mềm tài khoản.
 */
export async function deactivateMe(): Promise<DeactivateUserResult> {
  const res = await http.delete<ApiResponse<DeactivateUserResult>>('/users/me');

  /**
   * Sau khi tài khoản bị vô hiệu hóa/xóa mềm, token cũ không nên giữ lại ở FE nữa.
   */
  clearAccessToken();

  return res.data.data;
}

/**
 * Alias tạm cho UI cũ.
 */
export async function deleteMe(): Promise<DeactivateUserResult> {
  return deactivateMe();
}

/* ------------------------------------------------------------------
 * 2) ADMIN QUẢN LÝ USER
 * ------------------------------------------------------------------ */

export interface CreateUserPayload {
  name: string;
  password: string;

  // BE yêu cầu có ít nhất 1 trong 2: email hoặc phone
  email?: string | null;
  phone?: string | null;

  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  isVerified?: boolean;
  role?: 'USER' | 'SELLER' | 'ADMIN';
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await http.post<ApiResponse<User>>('/users', payload);
  return res.data.data;
}

export type UserListResult = PaginatedData<User>;

export async function getUsers(
  query: UserListQuery = {},
): Promise<UserListResult> {
  const qs = toQueryString(query as Record<string, any>);

  const res = await http.get<ApiResponse<UserListResult>>(`/users${qs}`);
  return res.data.data;
}

export async function getUserById(id: number): Promise<User> {
  const res = await http.get<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string | null;
  password?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  isVerified?: boolean;
  role?: 'USER' | 'SELLER' | 'ADMIN';
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const res = await http.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return res.data.data;
}

/**
 * Admin vô hiệu hóa/xóa mềm user.
 */
export async function deactivateUser(id: number): Promise<DeactivateUserResult> {
  const res = await http.delete<ApiResponse<DeactivateUserResult>>(
    `/users/${id}`,
  );

  return res.data.data;
}

/**
 * Lấy danh sách user đã bị vô hiệu hóa.
 * Nếu BE của bạn đang dùng /users/deleted/all thì đổi lại endpoint bên dưới.
 */
export async function getDeactivatedUsers(
  query: UserListQuery = {},
): Promise<UserListResult> {
  const qs = toQueryString(query as Record<string, any>);

  const res = await http.get<ApiResponse<UserListResult>>(
    `/users/deactivated/all${qs}`,
  );

  return res.data.data;
}

/* ------------------------------------------------------------------
 * 3) ALIAS TẠM CHO GIAO DIỆN CŨ
 * ------------------------------------------------------------------ */

export const softDeleteUser = deactivateUser;
export const getDeletedUsers = getDeactivatedUsers;

export async function restoreUser(): Promise<never> {
  throw new Error('Chức năng khôi phục user đã bị bỏ. User chỉ được vô hiệu hóa.');
}

export async function hardDeleteUser(): Promise<never> {
  throw new Error('Chức năng xóa cứng user đã bị bỏ. User chỉ được vô hiệu hóa.');
}

export const UsersApi = {
  getMe,
  updateMe,

  requestChangePasswordOtp,
  changeMyPassword,

  deactivateMe,
  deleteMe,

  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getDeactivatedUsers,

  softDeleteUser,
  getDeletedUsers,
  restoreUser,
  hardDeleteUser,
};