import EmptyState from '../ui/EmptyState';
import Loading from '../ui/Loading';

import ProductCard, { type ProductCardItem } from './ProductCard';

import './ProductGrid.css';

type ProductGridProps = {
  products: ProductCardItem[];
  loading?: boolean;
  columns?: 4 | 5 | 6;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ProductGrid({
  products,
  loading = false,
  columns = 6,
  compact = false,
  emptyTitle = 'Chưa có sản phẩm',
  emptyDescription = 'Hiện chưa có sản phẩm để hiển thị.',
}: ProductGridProps) {
  if (loading) {
    return <Loading text="Đang tải sản phẩm..." />;
  }

  if (!products.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`mochi-product-grid mochi-product-grid-${columns}`}>
      {products.map((product) => (
        <ProductCard product={product} compact={compact} key={product.id} />
      ))}
    </div>
  );
}