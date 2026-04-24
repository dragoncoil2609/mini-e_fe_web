// src/api/categories.api.ts
import { http } from './http';
import type {
  ApiResponse,
  Category,
  CreateCategoryDto,
  DeleteCategoryResponse,
  SearchCategoriesParams,
  UpdateCategoryDto,
} from './types';

// GET /categories
export async function getPublicCategories(
  params?: SearchCategoriesParams,
): Promise<ApiResponse<Category[]>> {
  const clean: SearchCategoriesParams = {};

  if (params?.q?.trim()) {
    clean.q = params.q.trim();
  }

  if (typeof params?.parentId === 'number') {
    clean.parentId = params.parentId;
  }

  if (typeof params?.isActive === 'boolean') {
    clean.isActive = params.isActive;
  }

  const res = await http.get<ApiResponse<Category[]>>('/categories', {
    params: clean,
  });

  return res.data;
}

// GET /categories/tree
export async function getPublicCategoryTree(): Promise<ApiResponse<Category[]>> {
  const res = await http.get<ApiResponse<Category[]>>('/categories/tree');
  return res.data;
}

// GET /categories/:id
export async function getCategoryDetail(
  id: number,
): Promise<ApiResponse<Category>> {
  const res = await http.get<ApiResponse<Category>>(`/categories/${id}`);
  return res.data;
}

// POST /categories
export async function createCategory(
  body: CreateCategoryDto,
): Promise<ApiResponse<Category>> {
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

// DELETE /categories/:id
export async function deleteCategory(
  id: number,
): Promise<ApiResponse<DeleteCategoryResponse>> {
  const res = await http.delete<ApiResponse<DeleteCategoryResponse>>(
    `/categories/${id}`,
  );

  return res.data;
}