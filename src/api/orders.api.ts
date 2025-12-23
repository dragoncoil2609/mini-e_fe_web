// src/api/orders.api.ts
import { http } from './http';
import type {
  ApiResponse,
  PaginatedResult,
  Order,
  PreviewOrderDto,
  PreviewOrderResponse,
  CreateOrderDto,
  CreateOrderResponse,
} from './types';

export async function previewOrder(dto: PreviewOrderDto): Promise<ApiResponse<PreviewOrderResponse>> {
  const res = await http.post<ApiResponse<PreviewOrderResponse>>('/orders/preview', dto);
  return res.data;
}

export async function createOrder(dto: CreateOrderDto): Promise<ApiResponse<CreateOrderResponse>> {
  const res = await http.post<ApiResponse<CreateOrderResponse>>('/orders', dto);
  return res.data;
}

export async function getMyOrders(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResult<Order>>> {
  const res = await http.get<ApiResponse<PaginatedResult<Order>>>('/orders', { params });
  return res.data;
}

export async function getOrderDetail(id: string): Promise<ApiResponse<Order>> {
  const res = await http.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data;
}

export const OrdersApi = {
  previewOrder,
  createOrder,
  getMyOrders,
  getOrderDetail,
};
