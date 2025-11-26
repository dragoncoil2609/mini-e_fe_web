// src/api/home.api.ts
import { http } from './http';
import type {
  ApiResponse,
  PaginatedResult,
  ProductListItem,
  Shop,
} from './types';

/**
 * API cho trang chủ
 * Sử dụng lại các API public có sẵn và có thể mở rộng thêm
 */

// ================== FEATURED / POPULAR PRODUCTS ==================

/**
 * Lấy sản phẩm nổi bật (featured products)
 * Sử dụng API products với filter/sort đặc biệt
 * Có thể BE sẽ có endpoint riêng /home/featured-products sau này
 */
export async function getFeaturedProducts(
  limit: number = 8,
): Promise<ApiResponse<ProductListItem[]>> {
  // Tạm thời dùng API products với limit nhỏ, sort theo createdAt DESC
  // Nếu BE có endpoint riêng thì sẽ update sau
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products',
    {
      params: {
        page: 1,
        limit,
        status: 'ACTIVE',
      },
    },
  );

  // Trả về items dưới dạng array
  return {
    success: res.data.success,
    statusCode: res.data.statusCode,
    data: res.data.data.items,
  };
}

/**
 * Lấy sản phẩm mới nhất (latest products)
 */
export async function getLatestProducts(
  limit: number = 12,
): Promise<ApiResponse<ProductListItem[]>> {
  const res = await http.get<ApiResponse<PaginatedResult<ProductListItem>>>(
    '/products',
    {
      params: {
        page: 1,
        limit,
        status: 'ACTIVE',
      },
    },
  );

  return {
    success: res.data.success,
    statusCode: res.data.statusCode,
    data: res.data.data.items,
  };
}

// ================== FEATURED SHOPS ==================

/**
 * Lấy danh sách shop nổi bật
 * Sử dụng API shops với filter status ACTIVE
 */
export async function getFeaturedShops(
  limit: number = 6,
): Promise<ApiResponse<Shop[]>> {
  const res = await http.get<ApiResponse<PaginatedResult<Shop>>>('/shops', {
    params: {
      page: 1,
      limit,
      status: 'ACTIVE',
    },
  });

  return {
    success: res.data.success,
    statusCode: res.data.statusCode,
    data: res.data.data.items,
  };
}

// ================== STATISTICS (nếu BE có endpoint) ==================

/**
 * Interface cho thống kê trang chủ
 */
export interface HomeStats {
  totalProducts?: number;
  totalShops?: number;
  totalUsers?: number;
  totalOrders?: number;
}

/**
 * Lấy thống kê tổng quan (nếu BE có endpoint /home/stats)
 * Hiện tại trả về null, có thể implement sau khi BE có API
 */
export async function getHomeStats(): Promise<ApiResponse<HomeStats | null>> {
  try {
    // Nếu BE có endpoint /home/stats thì uncomment:
    // const res = await http.get<ApiResponse<HomeStats>>('/home/stats');
    // return res.data;

    // Tạm thời trả về null
    return {
      success: true,
      statusCode: 200,
      data: null,
    };
  } catch {
    return {
      success: false,
      statusCode: 404,
      data: null,
    };
  }
}

// ================== CATEGORIES (nếu BE có endpoint) ==================

/**
 * Interface cho category
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

/**
 * Lấy danh sách categories (nếu BE có endpoint /categories)
 * Hiện tại trả về empty array, có thể implement sau khi BE có API
 */
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    // Nếu BE có endpoint /categories thì uncomment:
    // const res = await http.get<ApiResponse<Category[]>>('/categories');
    // return res.data;

    // Tạm thời trả về empty array
    return {
      success: true,
      statusCode: 200,
      data: [],
    };
  } catch {
    return {
      success: false,
      statusCode: 404,
      data: [],
    };
  }
}

// ================== EXPORT OBJECT ==================

export const HomeApi = {
  getFeaturedProducts,
  getLatestProducts,
  getFeaturedShops,
  getHomeStats,
  getCategories,
};

