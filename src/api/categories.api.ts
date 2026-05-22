// src/api/categories.api.ts
import { http } from './http';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  statusCode?: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  children?: Category[];
};

export type SearchCategoriesParams = {
  q?: string;
  parentId?: number;
  isActive?: boolean;
};

export type CategoryFormPayload = {
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;

  // FE dùng imageFile để truyền ảnh category.
  // Controller BE đang nhận field file tên là: image
  imageFile?: File | null;
};

export type DeleteCategoryResponse = {
  id: number;
  deleted: boolean;
};

function cleanSearchParams(params?: SearchCategoriesParams): SearchCategoriesParams {
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

  return clean;
}

function appendFormValue(
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined,
) {
  if (value === undefined) {
    return;
  }

  // BE update-category.dto đã xử lý chuỗi rỗng thành null.
  if (value === null) {
    formData.append(key, '');
    return;
  }

  formData.append(key, String(value));
}

function buildCategoryFormData(payload: CategoryFormPayload) {
  const formData = new FormData();

  appendFormValue(formData, 'name', payload.name);
  appendFormValue(formData, 'slug', payload.slug);
  appendFormValue(formData, 'description', payload.description);
  appendFormValue(formData, 'imageUrl', payload.imageUrl);
  appendFormValue(formData, 'parentId', payload.parentId);
  appendFormValue(formData, 'sortOrder', payload.sortOrder);
  appendFormValue(formData, 'isActive', payload.isActive);

  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }

  return formData;
}

// GET /categories
export async function getPublicCategories(
  params?: SearchCategoriesParams,
): Promise<ApiResponse<Category[]>> {
  const res = await http.get<ApiResponse<Category[]>>('/categories', {
    params: cleanSearchParams(params),
  });

  return res.data;
}

// Admin cần thấy cả category active và inactive.
// Vì BE hiện tại GET /categories mặc định chỉ trả active nếu không truyền isActive,
// nên FE gọi 2 lần rồi merge lại.
export async function getAdminCategories(): Promise<ApiResponse<Category[]>> {
  const [activeRes, inactiveRes] = await Promise.all([
    getPublicCategories({ isActive: true }),
    getPublicCategories({ isActive: false }),
  ]);

  const map = new Map<number, Category>();

  for (const item of activeRes.data ?? []) {
    map.set(item.id, item);
  }

  for (const item of inactiveRes.data ?? []) {
    map.set(item.id, item);
  }

  const data = Array.from(map.values()).sort((a, b) => {
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }

    return a.name.localeCompare(b.name, 'vi');
  });

  return {
    success: true,
    data,
  };
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
// Gửi multipart/form-data để upload ảnh lên Cloudinary bên BE.
export async function createCategory(
  payload: CategoryFormPayload,
): Promise<ApiResponse<Category>> {
  const formData = buildCategoryFormData(payload);

  const res = await http.post<ApiResponse<Category>>('/categories', formData);

  return res.data;
}

// PATCH /categories/:id
// Gửi multipart/form-data để update text + ảnh.
export async function updateCategory(
  id: number,
  payload: Partial<CategoryFormPayload>,
): Promise<ApiResponse<Category>> {
  const formData = buildCategoryFormData(payload as CategoryFormPayload);

  const res = await http.patch<ApiResponse<Category>>(
    `/categories/${id}`,
    formData,
  );

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