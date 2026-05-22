import './ProductCard.css';

type ProductPriceProps = {
  price?: number | string | null;
  compareAtPrice?: number | string | null;
  size?: 'sm' | 'md' | 'lg';
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatVnd(value: unknown): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export default function ProductPrice({
  price,
  compareAtPrice,
  size = 'md',
}: ProductPriceProps) {
  const current = toNumber(price);
  const old = toNumber(compareAtPrice);
  const showOld = old > current;

  return (
    <div className={`product-price product-price-${size}`}>
      <strong>{formatVnd(current)}</strong>
      {showOld ? <span>{formatVnd(old)}</span> : null}
    </div>
  );
}