// src/utils/productImage.ts
import type { ProductImage, ProductListItem, ProductDetail } from '../api/types';

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
    if (mainImage) return mainImage.url;

    // Nếu không có main, lấy ảnh đầu tiên
    return product.images[0].url;
  }

  // Fallback: dùng thumbnailUrl nếu có (backward compatibility)
  if ('thumbnailUrl' in product && product.thumbnailUrl) {
    return product.thumbnailUrl;
  }

  return null;
}

/**
 * Lấy tất cả ảnh của product (sắp xếp theo position, ảnh main đầu tiên)
 */
export function getAllImages(
  product: ProductListItem | ProductDetail | null | undefined,
): ProductImage[] {
  if (!product || !product.images || product.images.length === 0) {
    return [];
  }

  // Sắp xếp: ảnh main trước, sau đó theo position
  return [...product.images].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.position - b.position;
  });
}

