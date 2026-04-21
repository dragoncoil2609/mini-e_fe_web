import { http } from './http';
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
 * 1) SELF ENDPOINTS
 * ------------------------------------------------------------------ */

export async function getMe(): Promise<User> {
  const res = await http.get<ApiResponse<User>>('/users/me');
  return res.data.data;
}

export interface UpdateMePayload {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  password?: string;
}

export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const res = await http.patch<ApiResponse<User>>('/users/me', payload);
  return res.data.data;
}

export interface DeleteMeResult {
  id: number;
  deleted: boolean;
}

export async function deleteMe(): Promise<DeleteMeResult> {
  const res = await http.delete<ApiResponse<DeleteMeResult>>('/users/me');
  return res.data.data;
}

/* ------------------------------------------------------------------
 * 2) ADMIN ENDPOINTS
 * ------------------------------------------------------------------ */

export interface CreateUserPayload {
  name: string;
  password: string;

  // theo hướng data mới: phải có ít nhất 1 trong 2
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

export async function getUsers(query: UserListQuery = {}): Promise<UserListResult> {
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

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const res = await http.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return res.data.data;
}

export interface SoftDeleteUserResult {
  id: number;
  deleted: boolean;
}

export async function softDeleteUser(id: number): Promise<SoftDeleteUserResult> {
  const res = await http.delete<ApiResponse<SoftDeleteUserResult>>(`/users/${id}`);
  return res.data.data;
}

export interface RestoreUserResult {
  id: number;
  restored: boolean;
}

export async function restoreUser(id: number): Promise<RestoreUserResult> {
  const res = await http.post<ApiResponse<RestoreUserResult>>(
    `/users/${id}/restore`,
    {},
  );
  return res.data.data;
}

export async function hardDeleteUser(id: number): Promise<void> {
  await http.delete<ApiResponse<null>>(`/users/${id}/hard`);
}

export async function getDeletedUsers(query: UserListQuery = {}): Promise<UserListResult> {
  const qs = toQueryString(query as Record<string, any>);
  const res = await http.get<ApiResponse<UserListResult>>(`/users/deleted/all${qs}`);
  return res.data.data;
}

export const UsersApi = {
  getMe,
  updateMe,
  deleteMe,

  createUser,
  getUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  restoreUser,
  hardDeleteUser,
  getDeletedUsers,
};