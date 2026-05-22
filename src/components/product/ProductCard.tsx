import { Link } from 'react-router-dom';

import ProductPrice from './ProductPrice';

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
  [key: string]: any;
};

type ProductCardProps = {
  product: ProductCardItem;
  to?: string;
  compact?: boolean;
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

export default function ProductCard({
  product,
  to = `/products/${product.id}`,
  compact = false,
}: ProductCardProps) {
  const name = getProductName(product);
  const image = getProductImage(product);
  const discount = getDiscountPercent(product);
  const outOfStock = isOutOfStock(product);
  const sold = toNumber(product.sold);

  return (
    <Link
      to={to}
      className={`mochi-product-card ${compact ? 'mochi-product-card-compact' : ''}`}
    >
      <div className="mochi-product-image-wrap">
        {discount ? (
          <span className="mochi-product-discount">-{discount}%</span>
        ) : null}

        {outOfStock ? (
          <span className="mochi-product-out">Hết hàng</span>
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