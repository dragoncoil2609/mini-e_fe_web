// src/api/cart.api.ts
import { http } from './http';
import type { ApiResponse, Cart, AddItemDto, UpdateItemDto } from './types';

/**
 * API cho giỏ hàng (Cart)
 * Tất cả endpoints đều yêu cầu authentication (AccessTokenGuard)
 */

/**
 * Lấy giỏ hàng của user hiện tại
 * GET /cart
 */
export async function getCart(): Promise<ApiResponse<Cart>> {
  const res = await http.get<ApiResponse<Cart>>('/cart');
  return res.data;
}

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /cart/items
 * - Nếu đã có sản phẩm (cùng productId và variantId) → tăng quantity
 * - Nếu chưa có → tạo dòng mới
 */
export async function addItem(dto: AddItemDto): Promise<ApiResponse<Cart>> {
  const res = await http.post<ApiResponse<Cart>>('/cart/items', dto);
  return res.data;
}

/**
 * Cập nhật số lượng của item trong giỏ hàng
 * PATCH /cart/items/:itemId
 * - quantity = 0 → xóa item
 */
export async function updateItem(
  itemId: number,
  dto: UpdateItemDto,
): Promise<ApiResponse<Cart>> {
  const res = await http.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, dto);
  return res.data;
}

/**
 * Xóa item khỏi giỏ hàng
 * DELETE /cart/items/:itemId
 */
export async function removeItem(itemId: number): Promise<ApiResponse<Cart>> {
  const res = await http.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
  return res.data;
}

/**
 * Xóa tất cả items trong giỏ hàng
 * DELETE /cart
 */
export async function clear(): Promise<ApiResponse<Cart>> {
  const res = await http.delete<ApiResponse<Cart>>('/cart');
  return res.data;
}

// Export object để dùng dễ hơn
export const CartApi = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clear,
};

