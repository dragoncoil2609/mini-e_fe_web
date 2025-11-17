// src/api/products.api.ts
import {http} from './http';
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

/**
 * 1) PUBLIC – LIST & DETAIL
 */

// GET /products?page=&limit=&q=&status=&shopId=
export async function getPublicProducts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  shopId?: number;
}): Promise<ApiResponse<PaginatedResult<ProductListItem>>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products',
    { params },
  );
  // res: AxiosResponse<ApiResponse<PaginatedResult<ProductListItem>>>
  return res.data; // trả về ApiResponse<PaginatedResult<ProductListItem>>
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

// POST /products – Cách B (JSON)
export async function createProductJson(
  body: CreateProductJsonDto,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.post<ApiResponse<ProductDetail>>('/products', body);
  return res.data;
}

// POST /products – Cách A (multipart/form-data)
export async function createProductMultipart(
  formData: FormData,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.post<ApiResponse<ProductDetail>>(
    '/products',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
}

// PATCH /products/:id
export async function updateProduct(
  id: number,
  body: UpdateProductDto,
): Promise<ApiResponse<ProductDetail>> {
  const res = await http.patch<ApiResponse<ProductDetail>>(
    `/products/${id}`,
    body,
  );
  return res.data;
}

// DELETE /products/:id
export async function deleteProduct(
  id: number,
): Promise<ApiResponse<null>> {
  const res = await http.delete<ApiResponse<null>>(`/products/${id}`);
  return res.data;
}

/**
 * 3) VARIANTS – SELLER/ADMIN
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
