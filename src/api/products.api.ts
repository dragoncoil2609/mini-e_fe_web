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
} from './types';

function isNotFoundError(error: any) {
  return error?.response?.status === 404;
}

/**
 * 1) PUBLIC – LIST & DETAIL
 */

// GET /products?page=&limit=&q=&shopId=&categoryId=
export async function getPublicProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  shopId?: number;
  categoryId?: number;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>('/products', {
    params,
  });
  return res.data;
}

// GET /products/:id
export async function getPublicProductDetail(
  id: number,
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
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// PATCH /products/:id
export async function updateProduct(
  id: number,
  body: UpdateProductDto,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.patch<ApiResponse<ProductDetail>>(`/products/${id}`, body);
  return res.data;
}

// DELETE /products/:id
export async function deleteProduct(id: number): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/products/${id}`);
  return res.data;
}

/**
 * 3) PRIVATE READ – seller/admin
 * Ưu tiên route private mới, fallback về route cũ để FE không gãy ngay.
 */

// GET /products/:id/manage
export async function getManageProductDetail(
  id: number,
): Promise<ApiResponse<ProductDetail>> {
  try {
    const res = await http.get<ApiResponse<ProductDetail>>(`/products/${id}/manage`);
    return res.data;
  } catch (error) {
    if (isNotFoundError(error)) {
      return getPublicProductDetail(id);
    }
    throw error;
  }
}

// GET /products/me
export async function getMyProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  categoryId?: number;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>('/products/me', {
    params,
  });
  return res.data;
}

// GET /admin/products
export async function getAdminProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  categoryId?: number;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  try {
    const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
      '/admin/products',
      { params },
    );
    return res.data;
  } catch (error) {
    if (isNotFoundError(error)) {
      const fallback = await getPublicProducts({
        page: params?.page,
        limit: params?.limit,
        q: params?.q,
        categoryId: params?.categoryId,
      });
      return fallback;
    }
    throw error;
  }
}

/**
 * 4) VARIANTS – SELLER/ADMIN
 */

// POST /products/:id/variants/generate
export async function generateProductVariants(
  productId: number,
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
  productId: number,
): Promise<ApiResponse<ProductVariant[]>> {
  const res = await http.get<ApiResponse<ProductVariant[]>>(
    `/products/${productId}/variants`,
  );
  return res.data;
}

// PATCH /products/:pid/variants/:vid
export async function updateProductVariant(
  productId: number,
  variantId: number,
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
  },
): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    `/products/by-shop/${shopId}`,
    { params },
  );
  return res.data;
}