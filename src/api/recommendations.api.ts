import { http } from './http';

export type InteractionEvent =
  | 'CLICK'
  | 'VIEW_DETAIL'
  | 'ADD_TO_CART'
  | 'FAVORITE'
  | 'UNFAVORITE'
  | 'PURCHASE';

export type RecommendedProduct = {
  id: number;
  shopId?: number | null;
  categoryId?: number | null;

  title: string;
  name?: string;
  slug?: string;

  description?: string | null;

  price: number | string;
  compareAtPrice?: number | string | null;
  currency?: string;

  stock?: number;
  sold?: number;
  status?: string;

  createdAt?: string;
  updatedAt?: string;

  shopName?: string | null;
  categoryName?: string | null;

  productScore?: number | string;
  categoryScore?: number | string;
  rawTagScore?: number | string;
  tagScore?: number | string;
  trendingBonus?: number | string;
  trendingRank?: number | string | null;
  trendingScore7d?: number | string;
  recommendationScore?: number | string;

  imageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;

  isFavorite?: boolean | 0 | 1 | '0' | '1';

  [key: string]: any;
};

export type RecommendationResponse = {
  page: number;
  limit: number;
  total?: number;
  pageCount?: number;

  categoryId?: number | null;
  categoryIds?: number[];

  source:
    | 'personalized'
    | 'fallback'
    | 'category_not_found'
    | 'trending'
    | string;

  message?: string;
  formula?: Record<string, any>;

  items: RecommendedProduct[];
};

export type FavoriteProductsResponse = {
  page: number;
  limit: number;
  items: RecommendedProduct[];
};

export type GetRecommendedProductsParams = {
  page?: number;
  limit?: number;
  categoryId?: number;
};

export async function getRecommendedProducts(
  params?: GetRecommendedProductsParams,
) {
  const res = await http.get<RecommendationResponse>(
    '/recommendations/products',
    { params },
  );

  return res.data;
}

export async function getTrendingProducts(
  params?: GetRecommendedProductsParams,
) {
  const res = await http.get<RecommendationResponse>(
    '/recommendations/trending-products',
    { params },
  );

  return res.data;
}

export async function recordProductEvent(payload: {
  productId: number;
  eventType: InteractionEvent;
  metadata?: Record<string, any>;
}) {
  const res = await http.post('/recommendations/events', payload);
  return res.data;
}

export async function addFavoriteProduct(productId: number) {
  const res = await http.post(`/recommendations/favorites/${productId}`);
  return res.data;
}

export async function removeFavoriteProduct(productId: number) {
  const res = await http.delete(`/recommendations/favorites/${productId}`);
  return res.data;
}

export async function getFavoriteProducts(params?: {
  page?: number;
  limit?: number;
}) {
  const res = await http.get<FavoriteProductsResponse>(
    '/recommendations/favorites',
    { params },
  );

  return res.data;
}

export async function getMyCategoryPreferences() {
  const res = await http.get('/recommendations/preferences');
  return res.data;
}