import { http } from './http';
import type { ApiResponse, User, UserListQuery } from './types';

/**
 * Helper: convert object -> query string
 */
function toQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    // Boolean -> string 'true' | 'false'
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
 * 1) SELF ENDPOINTS (user đang đăng nhập)
 *    GET /users/me
 *    PATCH /users/me
 *    DELETE /users/me
 * ------------------------------------------------------------------ */

/**
 * Lấy hồ sơ của chính mình
 * GET /users/me
 */
export async function getMe(): Promise<User> {
  const res = await http.get<ApiResponse<User>>('/users/me');
  return res.data.data;
}

/**
 * Body cho PATCH /users/me
 * Chỉ cho phép: name, phone, avatarUrl, birthday, gender, password
 */
export interface UpdateMePayload {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null; // 'YYYY-MM-DD'
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  password?: string;
}

/**
 * Cập nhật hồ sơ của chính mình
 * PATCH /users/me
 */
export async function updateMe(payload: UpdateMePayload): Promise<User> {
  const res = await http.patch<ApiResponse<User>>('/users/me', payload);
  return res.data.data;
}

/**
 * Xóa mềm chính mình
 * DELETE /users/me
 * Trả về: { id, deleted: true }
 */
export interface DeleteMeResult {
  id: number;
  deleted: boolean;
}

export async function deleteMe(): Promise<DeleteMeResult> {
  const res = await http.delete<ApiResponse<DeleteMeResult>>('/users/me');
  return res.data.data;
}

/* ------------------------------------------------------------------
 * 2) ADMIN ENDPOINTS (nhưng FE cứ gọi bình thường, token ADMIN là được)
 *
 *  - POST   /users
 *  - GET    /users
 *  - GET    /users/:id
 *  - PATCH  /users/:id
 *  - DELETE /users/:id          (soft delete)
 *  - POST   /users/:id/restore  (restore soft delete)
 *  - DELETE /users/:id/hard     (hard delete)
 *  - GET    /users/deleted/all  (list đã xóa mềm)
 * ------------------------------------------------------------------ */

/**
 * Payload tạo user mới
 * POST /users
 */
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  birthday?: string; // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  isVerified?: boolean;
  role?: 'USER' | 'SELLER' | 'ADMIN';
}

/**
 * Tạo user mới
 * POST /users
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await http.post<ApiResponse<User>>('/users', payload);
  return res.data.data;
}

/**
 * Kết quả danh sách user
 */
export interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Lấy danh sách user (phân trang + search + filter + sort)
 * GET /users
 */
export async function getUsers(query: UserListQuery = {}): Promise<UserListResult> {
  const qs = toQueryString(query as Record<string, any>);
  const res = await http.get<ApiResponse<UserListResult>>(`/users${qs}`);
  return res.data.data;
}

/**
 * Lấy chi tiết user theo id
 * GET /users/:id
 */
export async function getUserById(id: number): Promise<User> {
  const res = await http.get<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}

/**
 * Payload cập nhật user theo id (admin)
 * PATCH /users/:id
 * Gửi gì thì BE update cái đó (kể cả password, role, isVerified,...)
 */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  isVerified?: boolean;
  role?: 'USER' | 'SELLER' | 'ADMIN';
}

/**
 * Cập nhật user theo id (admin)
 * PATCH /users/:id
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const res = await http.patch<ApiResponse<User>>(`/users/${id}`, payload);
  return res.data.data;
}

/**
 * Soft delete user theo id
 * DELETE /users/:id
 * Trả về: { id, deleted: true }
 */
export interface SoftDeleteUserResult {
  id: number;
  deleted: boolean;
}

export async function softDeleteUser(id: number): Promise<SoftDeleteUserResult> {
  const res = await http.delete<ApiResponse<SoftDeleteUserResult>>(`/users/${id}`);
  return res.data.data;
}

/**
 * Khôi phục user đã xoá mềm
 * POST /users/:id/restore
 * Trả về: { id, restored: true }
 */
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

/**
 * Hard delete user (xoá vĩnh viễn)
 * DELETE /users/:id/hard
 * Thường trả về success = true, có thể không cần data
 */
export async function hardDeleteUser(id: number): Promise<void> {
  await http.delete<ApiResponse<null>>(`/users/${id}/hard`);
}

/**
 * Danh sách user đã xoá mềm
 * GET /users/deleted/all
 * Query giống /users (search, role, gender, isVerified, sortBy, sortOrder, page, limit)
 * Mặc định sort deletedAt DESC (trên BE).
 */
export async function getDeletedUsers(query: UserListQuery = {}): Promise<UserListResult> {
  const qs = toQueryString(query as Record<string, any>);
  const res = await http.get<ApiResponse<UserListResult>>(`/users/deleted/all${qs}`);
  return res.data.data;
}

