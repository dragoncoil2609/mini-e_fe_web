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

// 3) Tìm kiếm / liệt kê shop
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
  status?: ShopStatus;
}

export async function updateShop(
  id: number,
  payload: UpdateShopPayload,
): Promise<ApiResponse<Shop>> {
  const res = await http.patch<ApiResponse<Shop>>(`/shops/${id}`, payload);
  return res.data;
}

// 6) Xóa shop
export async function deleteShop(id: number): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/shops/${id}`);
  return res.data;
}

// 7) Upload logo shop
export async function uploadShopLogo(file: File): Promise<ApiResponse<Shop>> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await http.patch<ApiResponse<Shop>>('/shops/me/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

// 8) Upload cover shop
export async function uploadShopCover(file: File): Promise<ApiResponse<Shop>> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await http.patch<ApiResponse<Shop>>('/shops/me/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

// 9) Lấy chi tiết shop public
export async function getShopDetail(id: number): Promise<ApiResponse<Shop>> {
  const res = await http.get<ApiResponse<Shop>>(`/shops/${id}`);
  return res.data;
}

// 10) Lấy danh sách đơn hàng của shop
export interface MyShopOrdersParams {
  page?: number;
  limit?: number;
}

export async function getMyShopOrders(
  params: MyShopOrdersParams = {},
): Promise<ApiResponse<PaginatedResult<any>>> {
  const res = await http.get<ApiResponse<PaginatedResult<any>>>(
    '/shops/me/orders',
    {
      params,
    },
  );

  return res.data;
}

// 11) Lấy chi tiết 1 đơn hàng của shop
export async function getMyShopOrderDetail(
  id: string,
): Promise<ApiResponse<any>> {
  const res = await http.get<ApiResponse<any>>(`/shops/me/orders/${id}`);
  return res.data;
}

// 12) Shop cập nhật trạng thái giao hàng
export async function updateMyShopOrderShippingStatus(
  id: string,
  shippingStatus: string,
): Promise<ApiResponse<any>> {
  const res = await http.patch<ApiResponse<any>>(
    `/shops/me/orders/${id}/shipping-status`,
    {
      shippingStatus,
    },
  );

  return res.data;
}