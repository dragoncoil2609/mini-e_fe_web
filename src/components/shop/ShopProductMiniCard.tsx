import { Link } from 'react-router-dom';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './ShopProductMiniCard.css';

export type ShopProductMini = {
  id: number;
  title: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  sold?: number;
  stock?: number;
  mainImageUrl?: string | null;
};

function formatMoney(value: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
}

function discountPercent(product: ShopProductMini) {
  const price = Number(product.price || 0);
  const oldPrice = Number(product.compareAtPrice || 0);

  if (!oldPrice || oldPrice <= price) return null;

  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function ShopProductMiniCard({ product }: { product: ShopProductMini }) {
  const discount = discountPercent(product);

  return (
    <Link to={`/products/${product.id}`} className="shop-product-mini-card">
      <div className="shop-product-mini-image">
        {discount ? <span>-{discount}%</span> : null}

        <img
          src={product.mainImageUrl || bunnyImg}
          alt={product.title}
        />
      </div>

      <div className="shop-product-mini-body">
        <h3>{product.title}</h3>

        <div className="shop-product-mini-price">
          <strong>{formatMoney(product.price)}</strong>

          {product.compareAtPrice ? (
            <del>{formatMoney(product.compareAtPrice)}</del>
          ) : null}
        </div>

        <div className="shop-product-mini-meta">
          <small>Đã bán {product.sold ?? 0}</small>
          <button type="button" aria-label="Thêm vào giỏ">
            🛒
          </button>
        </div>
      </div>
    </Link>
  );
}