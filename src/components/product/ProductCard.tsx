import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';

import ProductPrice from './ProductPrice';
import {
  addFavoriteProduct,
  recordProductEvent,
  removeFavoriteProduct,
} from '../../api/recommendations.api';

import fallbackImg from '../../assets/brand/basket_chick.png';

import './ProductCard.css';

export type ProductCardItem = {
  id: number | string;
  title?: string;
  name?: string;
  price?: number | string | null;
  compareAtPrice?: number | string | null;
  mainImageUrl?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  images?: any[];
  sold?: number;
  stock?: number;
  status?: string;
  isFavorite?: boolean | 0 | 1 | '0' | '1';
  [key: string]: any;
};

type ProductCardProps = {
  product: ProductCardItem;
  to?: string;
  compact?: boolean;

  /**
   * Cho phép hiện/ẩn nút yêu thích.
   * Mặc định hiện.
   */
  showFavorite?: boolean;

  /**
   * Cho phép bật/tắt tracking CLICK.
   * Mặc định bật.
   */
  enableTracking?: boolean;
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getProductName(product: ProductCardItem): string {
  return product.title || product.name || 'Sản phẩm Mochi';
}

function getProductImage(product: ProductCardItem): string {
  return (
    product.mainImageUrl ||
    product.imageUrl ||
    product.thumbnail ||
    product.thumbnailUrl ||
    product.coverUrl ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    fallbackImg
  );
}

function getDiscountPercent(product: ProductCardItem): number | null {
  const price = toNumber(product.price);
  const compareAt = toNumber(product.compareAtPrice);

  if (!compareAt || compareAt <= price) {
    return null;
  }

  return Math.round((1 - price / compareAt) * 100);
}

function isOutOfStock(product: ProductCardItem): boolean {
  return product.status === 'OUT_OF_STOCK' || toNumber(product.stock) <= 0;
}

function normalizeFavorite(value: ProductCardItem['isFavorite']): boolean {
  return value === true || value === 1 || value === '1';
}

export default function ProductCard({
  product,
  to = `/products/${product.id}`,
  compact = false,
  showFavorite = true,
  enableTracking = true,
}: ProductCardProps) {
  const name = getProductName(product);
  const image = getProductImage(product);
  const discount = getDiscountPercent(product);
  const outOfStock = isOutOfStock(product);
  const sold = toNumber(product.sold);
  const productId = Number(product.id);

  const [isFavorite, setIsFavorite] = useState(
    normalizeFavorite(product.isFavorite),
  );
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(normalizeFavorite(product.isFavorite));
  }, [product.id, product.isFavorite]);

  function handleCardClick() {
    if (!enableTracking || !productId) return;

    recordProductEvent({
      productId,
      eventType: 'CLICK',
      metadata: {
        source: 'product_card',
      },
    }).catch(() => {
      // Tracking lỗi thì bỏ qua, không làm hỏng thao tác xem sản phẩm.
    });
  }

  async function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!productId || favoriteLoading) return;

    const previous = isFavorite;

    try {
      setFavoriteLoading(true);
      setIsFavorite(!previous);

      if (previous) {
        await removeFavoriteProduct(productId);
      } else {
        await addFavoriteProduct(productId);
      }
    } catch (error: any) {
      setIsFavorite(previous);

      if (error?.response?.status === 401) {
        alert('Bạn cần đăng nhập để yêu thích sản phẩm.');
        return;
      }

      alert(
        error?.response?.data?.message ||
          'Không thể cập nhật sản phẩm yêu thích. Vui lòng thử lại.',
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <Link
      to={to}
      className={`mochi-product-card ${
        compact ? 'mochi-product-card-compact' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="mochi-product-image-wrap">
        {discount ? (
          <span className="mochi-product-discount">-{discount}%</span>
        ) : null}

        {outOfStock ? (
          <span className="mochi-product-out">Hết hàng</span>
        ) : null}

        {showFavorite ? (
          <button
            type="button"
            className={`mochi-product-favorite ${
              isFavorite ? 'is-active' : ''
            }`}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            disabled={favoriteLoading}
            onClick={handleFavoriteClick}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        ) : null}

        <img
          className="mochi-product-image"
          src={image}
          alt={name}
          loading="lazy"
        />
      </div>

      <div className="mochi-product-body">
        <h3 className="mochi-product-title">{name}</h3>

        <ProductPrice
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size={compact ? 'sm' : 'md'}
        />

        <div className="mochi-product-footer">
          <small>Đã bán {sold}</small>

          <span
            className={`mochi-product-cart ${outOfStock ? 'is-disabled' : ''}`}
            title={outOfStock ? 'Sản phẩm đã hết hàng' : 'Thêm vào giỏ'}
          >
            {outOfStock ? '🚫' : '🛒'}
          </span>
        </div>
      </div>
    </Link>
  );
}