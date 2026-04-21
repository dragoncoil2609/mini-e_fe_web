import { http } from './http';
import type { Address, ApiResponse, CreateAddressDto, UpdateAddressDto } from './types';

/**
 * API cho địa chỉ
 * Backend hiện trả shape: { success: true, data: ... }
 * FE unwrap luôn data cho đồng bộ với users.api.ts
 */

export async function list(): Promise<Address[]> {
  const res = await http.get<ApiResponse<Address[]>>('/addresses');
  return res.data.data;
}

export async function create(dto: CreateAddressDto): Promise<Address> {
  const res = await http.post<ApiResponse<Address>>('/addresses', dto);
  return res.data.data;
}

export async function update(id: number, dto: UpdateAddressDto): Promise<Address> {
  const res = await http.patch<ApiResponse<Address>>(`/addresses/${id}`, dto);
  return res.data.data;
}

export interface RemoveAddressResult {
  success: boolean;
}

export async function remove(id: number): Promise<RemoveAddressResult> {
  const res = await http.delete<ApiResponse<RemoveAddressResult>>(`/addresses/${id}`);
  return res.data.data;
}

export interface SetDefaultAddressResult {
  success: boolean;
}

export async function setDefault(id: number): Promise<SetDefaultAddressResult> {
  const res = await http.patch<ApiResponse<SetDefaultAddressResult>>(
    `/addresses/${id}/set-default`,
  );
  return res.data.data;
}

export const AddressesApi = {
  list,
  create,
  update,
  remove,
  setDefault,
};