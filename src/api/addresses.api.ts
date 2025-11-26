// src/api/addresses.api.ts
import { http } from './http';
import type { ApiResponse, Address, CreateAddressDto, UpdateAddressDto } from './types';

/**
 * API cho địa chỉ (Addresses)
 * Tất cả endpoints đều yêu cầu authentication (AccessTokenGuard)
 */

/**
 * Lấy danh sách địa chỉ của user hiện tại
 * GET /addresses
 * Sắp xếp: địa chỉ mặc định trước, sau đó theo id giảm dần
 */
export async function list(): Promise<ApiResponse<Address[]>> {
  const res = await http.get<ApiResponse<Address[]>>('/addresses');
  return res.data;
}

/**
 * Tạo địa chỉ mới
 * POST /addresses
 * - Nếu isDefault = true → tự động bỏ default của các địa chỉ khác
 */
export async function create(dto: CreateAddressDto): Promise<ApiResponse<Address>> {
  const res = await http.post<ApiResponse<Address>>('/addresses', dto);
  return res.data;
}

/**
 * Cập nhật địa chỉ
 * PATCH /addresses/:id
 */
export async function update(
  id: number,
  dto: UpdateAddressDto,
): Promise<ApiResponse<Address>> {
  const res = await http.patch<ApiResponse<Address>>(`/addresses/${id}`, dto);
  return res.data;
}

/**
 * Xóa địa chỉ
 * DELETE /addresses/:id
 */
export async function remove(id: number): Promise<ApiResponse<{ success: boolean }>> {
  const res = await http.delete<ApiResponse<{ success: boolean }>>(`/addresses/${id}`);
  return res.data;
}

/**
 * Đặt địa chỉ làm mặc định
 * PATCH /addresses/:id/set-default
 * - Tự động bỏ default của các địa chỉ khác
 */
export async function setDefault(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  const res = await http.patch<ApiResponse<{ success: boolean }>>(
    `/addresses/${id}/set-default`,
  );
  return res.data;
}

// Export object để dùng dễ hơn
export const AddressesApi = {
  list,
  create,
  update,
  remove,
  setDefault,
};

