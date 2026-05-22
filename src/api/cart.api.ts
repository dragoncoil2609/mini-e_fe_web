import { http } from './http';
import type { ApiResponse, Cart, AddItemDto, UpdateItemDto } from './types';

/**
 * API cho giỏ hàng.
 * Tất cả endpoint đều yêu cầu đăng nhập.
 */

export async function getCart(): Promise<ApiResponse<Cart>> {
  const res = await http.get<ApiResponse<Cart>>('/cart');
  return res.data;
}

export async function addItem(dto: AddItemDto): Promise<ApiResponse<Cart>> {
  const res = await http.post<ApiResponse<Cart>>('/cart/items', dto);
  return res.data;
}

export async function updateItem(
  itemId: number,
  dto: UpdateItemDto,
): Promise<ApiResponse<Cart>> {
  const res = await http.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, dto);
  return res.data;
}

export async function removeItem(itemId: number): Promise<ApiResponse<Cart>> {
  const res = await http.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
  return res.data;
}

export async function clearCart(): Promise<ApiResponse<Cart>> {
  const res = await http.delete<ApiResponse<Cart>>('/cart');
  return res.data;
}

export const clear = clearCart;

export const CartApi = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clear: clearCart,
  clearCart,
};