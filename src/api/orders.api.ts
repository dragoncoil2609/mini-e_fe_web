// src/api/orders.api.ts
import { http } from './http';
import type {
  ApiResponse,
  Order,
  OrderStatus,
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaginatedResult,
} from './types';

/**
 * API cho đơn hàng (Orders)
 * Tất cả endpoints đều yêu cầu authentication (AccessTokenGuard)
 */

/**
 * Lấy danh sách đơn hàng của user hiện tại
 * GET /orders?page=&limit=&status=
 */
export async function getMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}): Promise<ApiResponse<PaginatedResult<Order>>> {
  const res = await http.get<ApiResponse<PaginatedResult<Order>>>('/orders', { params });
  return res.data;
}

/**
 * Lấy chi tiết đơn hàng
 * GET /orders/:id
 */
export async function getOrderDetail(id: number): Promise<ApiResponse<Order>> {
  const res = await http.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data;
}

/**
 * Tạo đơn hàng từ giỏ hàng
 * POST /orders
 * - Tạo đơn hàng từ các items trong giỏ hàng hiện tại
 * - Sau khi tạo thành công, giỏ hàng sẽ được xóa
 */
export async function createOrder(dto: CreateOrderDto): Promise<ApiResponse<Order>> {
  const res = await http.post<ApiResponse<Order>>('/orders', dto);
  return res.data;
}

/**
 * Cập nhật trạng thái đơn hàng
 * PATCH /orders/:id/status
 * - Chỉ seller/admin mới có thể cập nhật status
 */
export async function updateOrderStatus(
  id: number,
  dto: UpdateOrderStatusDto,
): Promise<ApiResponse<Order>> {
  const res = await http.patch<ApiResponse<Order>>(`/orders/${id}/status`, dto);
  return res.data;
}

/**
 * Hủy đơn hàng
 * PATCH /orders/:id/cancel
 * - Chỉ buyer mới có thể hủy đơn hàng (khi status = PENDING)
 */
export async function cancelOrder(id: number): Promise<ApiResponse<Order>> {
  const res = await http.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
  return res.data;
}

// Export object để dùng dễ hơn
export const OrdersApi = {
  getMyOrders,
  getOrderDetail,
  createOrder,
  updateOrderStatus,
  cancelOrder,
};

