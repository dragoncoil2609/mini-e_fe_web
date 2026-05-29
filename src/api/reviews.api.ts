// src/api/reviews.api.ts
import { http } from './http';
import type {
  ApiResponse,
  CreateProductReviewDto,
  ProductReview,
  ProductReviewsList,
} from './types';

function normalizeReviewList(
  data: ProductReview | ProductReview[] | null | undefined,
): ProductReview[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Tạo review:
 * 1 order + 1 product = 1 review
 *
 * POST /product-reviews
 */
export async function createProductReview(
  dto: CreateProductReviewDto,
): Promise<ApiResponse<ProductReview>> {
  const res = await http.post<ApiResponse<ProductReview>>(
    '/product-reviews',
    dto,
  );

  return res.data;
}

/**
 * Lấy toàn bộ review của user trong 1 order.
 *
 * GET /product-reviews/by-order/:orderId
 */
export async function getMyReviewsByOrder(
  orderId: string,
): Promise<ApiResponse<ProductReview[]>> {
  const res = await http.get<ApiResponse<ProductReview[] | ProductReview | null>>(
    `/product-reviews/by-order/${orderId}`,
  );

  return {
    ...res.data,
    data: normalizeReviewList(res.data.data),
  };
}

/**
 * Lấy review của 1 product cụ thể trong 1 order.
 *
 * GET /product-reviews/by-order/:orderId?productId=1
 */
export async function getMyReviewByOrderProduct(
  orderId: string,
  productId: number,
): Promise<ApiResponse<ProductReview | null>> {
  const res = await http.get<ApiResponse<ProductReview | ProductReview[] | null>>(
    `/product-reviews/by-order/${orderId}`,
    {
      params: { productId },
    },
  );

  const data = res.data.data;

  return {
    ...res.data,
    data: Array.isArray(data) ? data[0] ?? null : data ?? null,
  };
}

/**
 * API tương thích cũ.
 */
export async function getMyReviewByOrder(
  orderId: string,
): Promise<ApiResponse<ProductReview[]>> {
  return getMyReviewsByOrder(orderId);
}

/**
 * Public:
 * GET /products/:productId/reviews
 */
export async function getProductReviews(
  productId: number,
  params?: {
    page?: number;
    limit?: number;
  },
): Promise<ApiResponse<ProductReviewsList>> {
  const res = await http.get<ApiResponse<ProductReviewsList>>(
    `/products/${productId}/reviews`,
    {
      params,
    },
  );

  return res.data;
}

// ================== SHOP REVIEWS ==================

export interface ShopReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
}

export interface ShopReviewsSummary {
  ratingAvg?: number | string;
  reviewCount?: number;
  avg?: number | string;
  count?: number;
}

export interface ShopReviewsList {
  summary: ShopReviewsSummary;
  items: ProductReview[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Shop đang đăng nhập xem review của shop mình.
 *
 * GET /reviews/shop/me?page=1&limit=10&rating=5
 */
export async function getMyShopReviews(
  params: ShopReviewsParams = {},
): Promise<ApiResponse<ShopReviewsList>> {
  const res = await http.get<ApiResponse<ShopReviewsList>>(
    '/reviews/shop/me',
    {
      params,
    },
  );

  return res.data;
}

/**
 * User/public xem review của shop theo shopId.
 *
 * GET /reviews/shop/:shopId?page=1&limit=10&rating=5
 */
export async function getShopReviews(
  shopId: number,
  params: ShopReviewsParams = {},
): Promise<ApiResponse<ShopReviewsList>> {
  const res = await http.get<ApiResponse<ShopReviewsList>>(
    `/reviews/shop/${shopId}`,
    {
      params,
    },
  );

  return res.data;
}

export const ReviewsApi = {
  createProductReview,
  getMyReviewsByOrder,
  getMyReviewByOrder,
  getMyReviewByOrderProduct,
  getProductReviews,

  getMyShopReviews,
  getShopReviews,
};