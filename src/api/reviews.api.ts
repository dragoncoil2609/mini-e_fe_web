// src/api/reviews.api.ts
import { http } from './http';
import type {
  ApiResponse,
  CreateProductReviewDto,
  ProductReview,
  ProductReviewsList,
} from './types';

function normalizeReviewList(data: ProductReview | ProductReview[] | null | undefined): ProductReview[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Tạo review theo rule mới:
 * 1 order + 1 product = 1 review
 *
 * POST /product-reviews
 * Body:
 * {
 *   orderId,
 *   productId,
 *   rating,
 *   comment/content,
 *   images
 * }
 */
export async function createProductReview(
  dto: CreateProductReviewDto,
): Promise<ApiResponse<ProductReview>> {
  const res = await http.post<ApiResponse<ProductReview>>('/product-reviews', dto);
  return res.data;
}

/**
 * Lấy toàn bộ review của user trong 1 order.
 *
 * GET /product-reviews/by-order/:orderId
 *
 * BE mới nên trả ProductReview[].
 * Hàm này vẫn tự normalize nếu BE cũ trả ProductReview | null.
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
 * Trước đây FE dùng getMyReviewByOrder(orderId) để lấy 1 review.
 * Bây giờ order có nhiều product nên hàm này trả danh sách review.
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
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<ProductReviewsList>> {
  const res = await http.get<ApiResponse<ProductReviewsList>>(
    `/products/${productId}/reviews`,
    { params },
  );
  return res.data;
}

export const ReviewsApi = {
  createProductReview,
  getMyReviewsByOrder,
  getMyReviewByOrder,
  getMyReviewByOrderProduct,
  getProductReviews,
};