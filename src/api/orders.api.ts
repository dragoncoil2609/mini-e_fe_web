import { http } from './http';
import type {
  ApiResponse,
  PaginatedResult,
  Order,
  PreviewOrderDto,
  PreviewOrderResponse,
  CreateOrderDto,
  CreateOrderResponse,
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
} from './types';

export async function previewOrder(
  dto: PreviewOrderDto,
): Promise<ApiResponse<PreviewOrderResponse>> {
  const res = await http.post<ApiResponse<PreviewOrderResponse>>('/orders/preview', dto);
  return res.data;
}

export async function createOrder(
  dto: CreateOrderDto,
): Promise<ApiResponse<CreateOrderResponse>> {
  const res = await http.post<ApiResponse<CreateOrderResponse>>('/orders', dto);
  return res.data;
}

export async function getMyOrders(
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<PaginatedResult<Order>>> {
  const res = await http.get<ApiResponse<PaginatedResult<Order>>>(
    '/orders',
    params ? { params } : undefined,
  );
  return res.data;
}

export async function getOrderDetail(id: string): Promise<ApiResponse<Order>> {
  const res = await http.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data;
}

export async function updateOrderStatus(
  id: string,
  patch: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingStatus?: ShippingStatus;
  },
): Promise<ApiResponse<Order>> {
  const res = await http.post<ApiResponse<Order>>(`/orders/${id}/status`, patch);
  return res.data;
}

export async function getMyShopOrders(
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<PaginatedResult<Order>>> {
  const res = await http.get<ApiResponse<PaginatedResult<Order>>>(
    '/shops/me/orders',
    params ? { params } : undefined,
  );
  return res.data;
}

export async function getMyShopOrderDetail(id: string): Promise<ApiResponse<Order>> {
  const res = await http.get<ApiResponse<Order>>(`/shops/me/orders/${id}`);
  return res.data;
}

export async function updateMyShopOrderShippingStatus(
  id: string,
  shippingStatus: ShippingStatus,
): Promise<ApiResponse<Order>> {
  const res = await http.patch<ApiResponse<Order>>(
    `/shops/me/orders/${id}/shipping-status`,
    { shippingStatus },
  );
  return res.data;
}

export async function cancelOrder(id: string): Promise<ApiResponse<Order>> {
  const res = await http.post<ApiResponse<Order>>(`/orders/${id}/cancel`, {});
  return res.data;
}

export async function confirmReceived(id: string): Promise<ApiResponse<Order>> {
  const res = await http.post<ApiResponse<Order>>(`/orders/${id}/confirm-received`, {});
  return res.data;
}

export async function requestReturn(id: string): Promise<ApiResponse<Order>> {
  const res = await http.post<ApiResponse<Order>>(`/orders/${id}/request-return`, {});
  return res.data;
}

export const OrdersApi = {
  previewOrder,
  createOrder,
  getMyOrders,
  getOrderDetail,
  updateOrderStatus,
  getMyShopOrders,
  getMyShopOrderDetail,
  updateMyShopOrderShippingStatus,
  cancelOrder,
  confirmReceived,
  requestReturn,
};