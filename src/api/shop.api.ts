import { http } from './http';
import type { ApiResponse, PaginatedResult, Shop, ShopStatus } from './types';

// 1) Đăng ký shop
export interface RegisterShopPayload {
  name: string;
  email?: string;
  description?: string;
  shopAddress?: string;
  shopLat?: number;
  shopLng?: number;
  shopPlaceId?: string;
  shopPhone?: string;
}

export async function registerShop(
  payload: RegisterShopPayload,
): Promise<ApiResponse<Shop>> {
  const res = await http.post<ApiResponse<Shop>>('/shops/register', payload);
  return res.data;
}

// 2) Kiểm tra tên shop trùng
export interface CheckNameResult {
  exists: boolean;
}

export async function checkShopName(
  name: string,
): Promise<ApiResponse<CheckNameResult>> {
  const res = await http.get<ApiResponse<CheckNameResult>>(
    '/shops/check-name',
    {
      params: { name },
    },
  );
  return res.data;
}

// 3) Tìm kiếm / liệt kê shop (search + phân trang)
export interface SearchShopsParams {
  q?: string;
  status?: ShopStatus;
  page?: number;
  limit?: number;
}

export async function searchShops(
  params: SearchShopsParams = {},
): Promise<ApiResponse<PaginatedResult<Shop>>> {
  const res = await http.get<ApiResponse<PaginatedResult<Shop>>>('/shops', {
    params,
  });
  return res.data;
}

// 4) Lấy shop của tài khoản hiện tại
export async function getMyShop(): Promise<ApiResponse<Shop>> {
  const res = await http.get<ApiResponse<Shop>>('/shops/me');
  return res.data;
}

// 5) Cập nhật shop
export interface UpdateShopPayload {
  name?: string;
  email?: string;
  description?: string;
  shopAddress?: string;
  shopLat?: number;
  shopLng?: number;
  shopPlaceId?: string;
  shopPhone?: string;
  status?: ShopStatus; // chỉ ADMIN được đổi, BE tự check quyền
}

export async function updateShop(
  id: number,
  payload: UpdateShopPayload,
): Promise<ApiResponse<Shop>> {
  const res = await http.patch<ApiResponse<Shop>>(`/shops/${id}`, payload);
  return res.data;
}

// 6) Xoá shop
export async function deleteShop(id: number): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/shops/${id}`);
  return res.data;
}