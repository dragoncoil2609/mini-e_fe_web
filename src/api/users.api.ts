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

/* =========================================================
 * ME
 * =======================================================*/

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
  password?: string;
}

export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const { password: _password, ...safePayload } = payload;

  const res = await http.patch<ApiResponse<User>>(
    '/users/me',
    safePayload,
  );

  return res.data.data;
}

/* =========================================================
 * CHANGE PASSWORD
 * =======================================================*/

export interface RequestChangePasswordOtpResult {
  sent: boolean;
  via?: string;
  target?: string;
  expiresInMinutes?: number;
  message?: string;
}

export async function requestChangePasswordOtp() {
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

export async function changeMyPassword(
  payload: ChangeMyPasswordPayload,
) {
  const res = await http.patch<
    ApiResponse<{
      changed: boolean;
      message?: string;
    }>
  >('/users/me/change-password', payload);

  return res.data.data;
}

/* =========================================================
 * DELETE ME
 * =======================================================*/

export async function deactivateMe() {
  const res = await http.delete<ApiResponse<any>>('/users/me');

  clearAccessToken();

  return res.data.data;
}

export const deleteMe = deactivateMe;

/* =========================================================
 * ADMIN USERS
 * =======================================================*/

export interface CreateUserPayload {
  name: string;
  password: string;

  email?: string | null;
  phone?: string | null;

  avatarUrl?: string | null;
  birthday?: string | null;

  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;

  isVerified?: boolean;

  role?: 'USER' | 'SELLER' | 'ADMIN';
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<User> {
  const res = await http.post<ApiResponse<User>>(
    '/users',
    payload,
  );

  return res.data.data;
}

export type UserListResult = PaginatedData<User>;

export async function getUsers(
  query: UserListQuery = {},
) {
  const qs = toQueryString(query);

  const res = await http.get<ApiResponse<UserListResult>>(
    `/users${qs}`,
  );

  return res.data.data;
}

export async function getUserById(
  id: number,
): Promise<User> {
  const res = await http.get<ApiResponse<User>>(
    `/users/${id}`,
  );

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
) {
  const res = await http.patch<ApiResponse<User>>(
    `/users/${id}`,
    payload,
  );

  return res.data.data;
}

/* =========================================================
 * SOFT DELETE
 * =======================================================*/

export async function softDeleteUser(id: number) {
  const res = await http.delete<ApiResponse<any>>(
    `/users/${id}`,
  );

  return res.data.data;
}

export const deactivateUser = softDeleteUser;

/* =========================================================
 * DELETED USERS
 * =======================================================*/

export async function getDeletedUsers(
  query: UserListQuery = {},
) {
  const qs = toQueryString(query);

  // Controller của BE:
  // @Get('deleted/all')
  const res = await http.get<ApiResponse<UserListResult>>(
    `/users/deleted/all${qs}`,
  );

  return res.data.data;
}

export const getDeactivatedUsers = getDeletedUsers;

/* =========================================================
 * RESTORE
 * =======================================================*/

export async function restoreUser(id: number) {
  const res = await http.patch<ApiResponse<any>>(
    `/users/${id}/restore`,
  );

  return res.data.data;
}

/* =========================================================
 * HARD DELETE
 * =======================================================*/

export async function hardDeleteUser(id: number) {
  const res = await http.delete<ApiResponse<any>>(
    `/users/${id}/hard`,
  );

  return res.data.data;
}

/* =========================================================
 * EXPORT
 * =======================================================*/

export default {
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
  softDeleteUser,

  getDeletedUsers,
  getDeactivatedUsers,

  restoreUser,
  hardDeleteUser,
};