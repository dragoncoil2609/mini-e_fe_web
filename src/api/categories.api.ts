// src/api/categories.api.ts
import { http } from './http';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  statusCode?: number;
};

export type PaginatedData<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type SellerCategoryOption = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  imageUrl?: string | null;
  sortOrder: number;
  fullName: string;
};

export type CategorySuggestionLevel = 'strong' | 'medium' | 'weak';

export type CategorySuggestionItem = {
  categoryId: number;
  parentId: number | null;
  parentName: string | null;
  categoryName: string;
  score: number;
  confidence: number;
  level: CategorySuggestionLevel;
  matchedKeywords: string[];
  matchedStrongKeywords: string[];
};

export type CategoryParentFallback = {
  parentId: number;
  parentName: string;
  score: number;
  confidence: number;
  matchedKeywords: string[];
  children: Array<{
    categoryId: number;
    categoryName: string;
  }>;
};

export type CategorySuggestionPayload = {
  title?: string;
  description?: string;
  optionText?: string;
  optionSchema?: unknown;
  variantText?: string;
  variants?: unknown;
  limit?: number;
};

export type CategorySuggestionData = {
  success: boolean;
  inputText: string;
  normalizedText: string;
  items: CategorySuggestionItem[];
  parentFallbacks: CategoryParentFallback[];
  message: string;
};

export type SearchCategoriesParams = {
  q?: string;
  parentId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'slug' | 'sortOrder' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
};

export type CategoryFormPayload = {
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
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

  if (typeof params?.page === 'number') {
    clean.page = params.page;
  }

  if (typeof params?.limit === 'number') {
    clean.limit = params.limit;
  }

  if (params?.sortBy) {
    clean.sortBy = params.sortBy;
  }

  if (params?.sortOrder) {
    clean.sortOrder = params.sortOrder;
  }

  return clean;
}

function appendFormValue(
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined,
) {
  if (value === undefined) return;

  if (value === null) {
    formData.append(key, '');
    return;
  }

  formData.append(key, String(value));
}

function buildCategoryFormData(payload: Partial<CategoryFormPayload>) {
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

// Trang home / MainLayout: chỉ category cha active
export async function getHomeCategories(): Promise<ApiResponse<Category[]>> {
  const res = await http.get<ApiResponse<Category[]>>('/categories/home');
  return res.data;
}

// Alias nếu code cũ đang dùng getPublicCategories
export async function getPublicCategories(): Promise<ApiResponse<Category[]>> {
  return getHomeCategories();
}

// Public tree nếu sau này cần menu dạng cây
export async function getPublicCategoryTree(): Promise<ApiResponse<Category[]>> {
  const res = await http.get<ApiResponse<Category[]>>('/categories/tree');
  return res.data;
}

// Seller/Admin thêm hoặc sửa sản phẩm: lấy tất cả category active
export async function getSellerCategoryOptions(): Promise<
  ApiResponse<SellerCategoryOption[]>
> {
  const res = await http.get<ApiResponse<SellerCategoryOption[]>>(
    '/categories/seller-options',
  );

  return res.data;
}

// Seller/Admin: gợi ý category theo tên/mô tả sản phẩm
export async function suggestProductCategories(
  payload: CategorySuggestionPayload,
): Promise<ApiResponse<CategorySuggestionData>> {
  const res = await http.post<ApiResponse<CategorySuggestionData>>(
    '/categories/suggestions',
    payload,
  );

  return res.data;
}

// Admin quản lý category: lấy cả active/inactive, có phân trang/search/lọc
export async function getAdminCategories(
  params: SearchCategoriesParams = {},
): Promise<ApiResponse<PaginatedData<Category>>> {
  const res = await http.get<ApiResponse<PaginatedData<Category>>>(
    '/categories/admin',
    {
      params: cleanSearchParams(params),
    },
  );

  return res.data;
}

export async function getCategoryDetail(
  id: number,
): Promise<ApiResponse<Category>> {
  const res = await http.get<ApiResponse<Category>>(`/categories/${id}`);
  return res.data;
}

export async function createCategory(
  payload: CategoryFormPayload,
): Promise<ApiResponse<Category>> {
  const formData = buildCategoryFormData(payload);

  const res = await http.post<ApiResponse<Category>>('/categories', formData);

  return res.data;
}

export async function updateCategory(
  id: number,
  payload: Partial<CategoryFormPayload>,
): Promise<ApiResponse<Category>> {
  const formData = buildCategoryFormData(payload);

  const res = await http.patch<ApiResponse<Category>>(
    `/categories/${id}`,
    formData,
  );

  return res.data;
}

export async function deleteCategory(
  id: number,
): Promise<ApiResponse<DeleteCategoryResponse>> {
  const res = await http.delete<ApiResponse<DeleteCategoryResponse>>(
    `/categories/${id}`,
  );

  return res.data;
}