import { http } from './http';
import type {
  ApiResponse,
  PaginatedResult,
  ProductListItem,
  ProductDetail,
  ProductVariant,
  GenerateVariantsPayload,
  CreateProductJsonDto,
  UpdateProductDto,
  UpdateVariantDto,
  ProductSort,
  ProductStatus,
} from './types';

function isNotFoundError(error: any) {
  return error?.response?.status === 404;
}

/**
 * 1) PUBLIC – LIST & DETAIL
 */

// GET /products?page=&limit=&q=&shopId=&categoryId=&status=&sort=
export async function getPublicProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  shopId?: number;
  categoryId?: number;
  status?: string;
  sort?: ProductSort;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products',
    { params },
  );

  return res.data;
}

// Trang category gọi API thường.
// BE đã xử lý category cha lấy cả category con/cháu.
export async function getProductsByCategory(
  categoryId: number | string,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sort?: ProductSort;
  },
): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products',
    {
      params: {
        ...params,
        categoryId,
      },
    },
  );

  return res.data;
}

// GET /products/:id
export async function getPublicProductDetail(
  id: number | string,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.get<ApiResponse<ProductDetail>>(`/products/${id}`);
  return res.data;
}

/**
 * 2) SELLER/ADMIN – PRODUCTS CRUD
 */

// POST /products – JSON
export async function createProductJson(
  body: CreateProductJsonDto,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.post<ApiResponse<ProductDetail>>('/products', body);
  return res.data;
}

// POST /products – multipart/form-data
export async function createProductMultipart(
  formData: FormData,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.post<ApiResponse<ProductDetail>>('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}

// Hàm tiện cho trang ProductCreatePage
export async function createProduct(payload: {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  categoryId?: number | null;
  images?: File[];
}): Promise<ApiResponse<ProductDetail>> {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('price', String(payload.price));

  if (payload.slug) {
    formData.append('slug', payload.slug);
  }

  if (payload.description) {
    formData.append('description', payload.description);
  }

  if (payload.categoryId) {
    formData.append('categoryId', String(payload.categoryId));
  }

  payload.images?.forEach((file) => {
    formData.append('images', file);
  });

  return createProductMultipart(formData);
}

// PATCH /products/:id
export async function updateProduct(
  id: number | string,
  body: UpdateProductDto,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.patch<ApiResponse<ProductDetail>>(
    `/products/${id}`,
    body,
  );

  return res.data;
}

// Admin chỉ đổi trạng thái sản phẩm.
export async function updateProductStatus(
  id: number | string,
  status: ProductStatus,
): Promise<ApiResponse<ProductDetail>> {
  return updateProduct(id, { status });
}

// DELETE /products/:id
// BE mới đã xử lý xóa thật product + xóa cart item.
export async function deleteProduct(
  id: number | string,
): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/products/${id}`);
  return res.data;
}

/**
 * 3) PRIVATE READ – seller/admin
 */

// GET /products/:id/manage
// Route này nên có ở BE để admin xem được cả product LOCKED.
// Nếu BE chưa có thì fallback public detail.
export async function getManageProductDetail(
  id: number | string,
): Promise<ApiResponse<ProductDetail>> {
  try {
    const res = await http.get<ApiResponse<ProductDetail>>(
      `/products/${id}/manage`,
    );

    return res.data;
  } catch (error) {
    if (isNotFoundError(error)) {
      return getPublicProductDetail(id);
    }

    throw error;
  }
}

export async function getProductDetail(
  id: number | string,
): Promise<ApiResponse<ProductDetail>> {
  return getManageProductDetail(id);
}

// GET /products/my-shop
export async function getMyProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  categoryId?: number;
  sort?: ProductSort;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  try {
    const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
      '/products/my-shop',
      { params },
    );

    return res.data;
  } catch (error) {
    if (isNotFoundError(error)) {
      const fallback = await http.get<
        ApiResponse<PaginatedResult<ProductListItem>>
      >('/products/me', { params });

      return fallback.data;
    }

    throw error;
  }
}

// ADMIN: GET /products/admin/all
export async function getAdminProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  categoryId?: number;
  shopId?: number;
  sort?: ProductSort;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products/admin/all',
    { params },
  );

  return res.data;
}

// ADMIN detail.
// Ưu tiên /products/:id/manage để xem cả LOCKED.
export async function getAdminProductDetail(
  id: number | string,
): Promise<ApiResponse<ProductDetail>> {
  return getManageProductDetail(id);
}

/**
 * 4) VARIANTS – SELLER/ADMIN
 */

// POST /products/:id/variants/generate
export async function generateProductVariants(
  productId: number | string,
  payload: GenerateVariantsPayload,
): Promise<ApiResponse<ProductVariant[]>> {
  const res = await http.post<ApiResponse<ProductVariant[]>>(
    `/products/${productId}/variants/generate`,
    payload,
  );

  return res.data;
}

// GET /products/:id/variants
export async function getProductVariants(
  productId: number | string,
): Promise<ApiResponse<ProductVariant[]>> {
  const res = await http.get<ApiResponse<ProductVariant[]>>(
    `/products/${productId}/variants`,
  );

  return res.data;
}

// PATCH /products/:pid/variants/:vid
export async function updateProductVariant(
  productId: number | string,
  variantId: number | string,
  body: UpdateVariantDto,
): Promise<ApiResponse<ProductVariant>> {
  const res = await http.patch<ApiResponse<ProductVariant>>(
    `/products/${productId}/variants/${variantId}`,
    body,
  );

  return res.data;
}

/**
 * 5) PUBLIC BY SHOP
 */

export async function getProductsByShop(
  shopId: number,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    categoryId?: number;
    sort?: ProductSort;
  },
): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    `/products/by-shop/${shopId}`,
    { params },
  );

  return res.data;
}