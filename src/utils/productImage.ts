// src/utils/productImage.ts
import type { ProductImage, ProductListItem, ProductDetail } from '../api/types';

/**
 * Lấy base URL của backend từ environment
 * Ưu tiên dùng VITE_API_BASE_URL, nếu không có thì dùng VITE_BACKEND_BASE_URL
 */
function getBackendBaseUrl(): string {
  // Ưu tiên dùng VITE_BACKEND_BASE_URL nếu có (dành riêng cho backend base URL)
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (backendBaseUrl) {
    // Nếu là full URL, giữ nguyên
    if (backendBaseUrl.startsWith('http://') || backendBaseUrl.startsWith('https://')) {
      try {
        const url = new URL(backendBaseUrl);
        return `${url.protocol}//${url.host}`;
      } catch {
        // Nếu parse lỗi, fallback
      }
    }
  }
  
  // Nếu không có VITE_BACKEND_BASE_URL, dùng VITE_API_BASE_URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  
  // Nếu là full URL (có protocol), tách lấy base
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    try {
      const url = new URL(apiBaseUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Nếu parse lỗi, fallback về window location (chỉ khi dev local)
      console.warn('Cannot parse VITE_API_BASE_URL, using window.location.origin');
      return window.location.origin;
    }
  }
  
  // Nếu là relative path (/api), dùng window location (chỉ khi dev local)
  console.warn('VITE_API_BASE_URL is relative path, using window.location.origin');
  return window.location.origin;
}

/**
 * Normalize image URL: thêm base URL nếu là relative path
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Nếu đã là full URL, giữ nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Nếu là relative path, thêm base URL
  if (url.startsWith('/')) {
    return `${getBackendBaseUrl()}${url}`;
  }
  
  // Nếu không có leading slash, thêm vào
  return `${getBackendBaseUrl()}/${url}`;
}

/**
 * Lấy ảnh chính (main image) từ danh sách images của product
 * Ưu tiên ảnh có isMain = true, nếu không có thì lấy ảnh đầu tiên
 */
export function getMainImageUrl(
  product: ProductListItem | ProductDetail | null | undefined,
): string | null {
  if (!product) return null;

  // Nếu có images array
  if (product.images && product.images.length > 0) {
    // Tìm ảnh có isMain = true
    const mainImage = product.images.find((img) => img.isMain);
    if (mainImage) return normalizeImageUrl(mainImage.url);

    // Nếu không có main, lấy ảnh đầu tiên
    return normalizeImageUrl(product.images[0].url);
  }

  // Fallback: dùng thumbnailUrl nếu có (backward compatibility)
  if ('thumbnailUrl' in product && product.thumbnailUrl) {
    return normalizeImageUrl(product.thumbnailUrl);
  }

  return null;
}

/**
 * Lấy tất cả ảnh của product (sắp xếp theo position, ảnh main đầu tiên)
 * Trả về với URL đã được normalize
 */
export function getAllImages(
  product: ProductListItem | ProductDetail | null | undefined,
): (ProductImage & { normalizedUrl: string })[] {
  if (!product || !product.images || product.images.length === 0) {
    return [];
  }

  // Sắp xếp: ảnh main trước, sau đó theo position
  return [...product.images]
    .sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return a.position - b.position;
    })
    .map((img) => ({
      ...img,
      normalizedUrl: normalizeImageUrl(img.url) || img.url,
    }));
}

