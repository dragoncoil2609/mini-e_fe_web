// src/api/categories.api.ts
import { http } from './http';
import type { ApiResponse, Category, CreateCategoryDto, UpdateCategoryDto } from './types';

// GET /categories
export async function getPublicCategories(params?: {
  q?: string;
  parentId?: number;
  isActive?: boolean;
}): Promise<ApiResponse<Category[]>> {
  const clean: any = {};
  if (params?.q) clean.q = params.q;
  if (typeof params?.parentId === 'number') clean.parentId = params.parentId;
  if (params?.isActive !== undefined) clean.isActive = params.isActive ? 1 : 0; // ✅

  const res = await http.get<ApiResponse<Category[]>>(
    '/categories',
    Object.keys(clean).length ? { params: clean } : undefined,
  );
  return res.data;
}


// GET /categories/tree
export async function getPublicCategoryTree(): Promise<ApiResponse<Category[]>> {
  const res = await http.get<ApiResponse<Category[]>>('/categories/tree');
  return res.data;
}

// GET /categories/:id
export async function getCategoryDetail(id: number): Promise<ApiResponse<Category>> {
  const res = await http.get<ApiResponse<Category>>(`/categories/${id}`);
  return res.data;
}

// POST /categories
export async function createCategory(body: CreateCategoryDto): Promise<ApiResponse<Category>> {
  const res = await http.post<ApiResponse<Category>>('/categories', body);
  return res.data;
}

// PATCH /categories/:id
export async function updateCategory(
  id: number,
  body: UpdateCategoryDto,
): Promise<ApiResponse<Category>> {
  const res = await http.patch<ApiResponse<Category>>(`/categories/${id}`, body);
  return res.data;
}

// DELETE /categories/:id (soft)
export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/categories/${id}`);
  return res.data;
}

// POST /categories/:id/restore
export async function restoreCategory(id: number): Promise<ApiResponse<Category>> {
  const res = await http.post<ApiResponse<Category>>(`/categories/${id}/restore`, {});
  return res.data;
}

// DELETE /categories/:id/hard
export async function hardDeleteCategory(id: number): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/categories/${id}/hard`);
  return res.data;
}
