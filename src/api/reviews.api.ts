// src/api/reviews.api.ts
import { http } from './http';
import type { ApiResponse, ProductReview, CreateProductReviewDto, ProductReviewsList } from './types';

/**
 * ✅ Tạo review (1 order = 1 review)
 * Gợi ý endpoint: POST /product-reviews
 */
export async function createProductReview(dto: CreateProductReviewDto): Promise<ApiResponse<ProductReview>> {
  const res = await http.post<ApiResponse<ProductReview>>('/product-reviews', dto);
  return res.data;
}

/**
 * ✅ Lấy review theo order để check đã review chưa
 * Gợi ý endpoint: GET /product-reviews/by-order/:orderId
 * - Nếu chưa có review: BE nên trả success=true, data=null (hoặc 404)
 */
export async function getMyReviewByOrder(orderId: string): Promise<ApiResponse<ProductReview | null>> {
  const res = await http.get<ApiResponse<ProductReview | null>>(`/product-reviews/by-order/${orderId}`);
  return res.data;
}

export const ReviewsApi = {
  createProductReview,
  getMyReviewByOrder,
};

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