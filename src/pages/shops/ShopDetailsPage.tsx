import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getShopDetail } from '../../api/shop.api';
import { getProductsByShop } from '../../api/products.api';
import type { ProductListItem } from '../../api/types';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';
import basketImg from '../../assets/brand/basket_chick.png';

import './style/ShopDetailsPage.css';

type ShopView = {
  id: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  email?: string | null;
  status?: string;
  verifiedAt?: string | null;
  createdAt?: string | null;
  shopAddress?: string | null;
  shopPhone?: string | null;
  productCount?: number;
  totalOrders?: number;
  totalSold?: number;
  stats?: {
    productCount?: number;
    totalOrders?: number;
    totalSold?: number;
    ratingAvg?: number | string;
    reviewCount?: number;
  } | null;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapPaginatedItems<T>(response: any): T[] {
  const data = response?.data?.data ?? response?.data ?? response;
  return data?.items ?? [];
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải thông tin shop.'
  );
}

function formatMoney(value?: number | string) {
  return new Intl.NumberFormat('vi-VN').format(Number(value ?? 0)) + 'đ';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa xác minh';

  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return value;
  }
}

function getProductImage(product: ProductListItem) {
  const item = product as any;

  return (
    item.mainImageUrl ||
    item.imageUrl ||
    item.thumbnail ||
    item.thumbnailUrl ||
    item.images?.[0]?.url ||
    bunnyImg
  );
}

function getProductComparePrice(product: ProductListItem) {
  const item = product as any;
  return item.compareAtPrice ?? item.compare_at_price ?? null;
}

function getProductDiscount(product: ProductListItem) {
  const item = product as any;
  const price = Number(item.price ?? 0);
  const compareAtPrice = Number(getProductComparePrice(product) ?? 0);

  if (!compareAtPrice || compareAtPrice <= price) return null;

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function getProductSold(product: ProductListItem) {
  const item = product as any;
  return item.sold ?? item.totalSold ?? 0;
}

function ShopPreviewProductCard({ product }: { product: ProductListItem }) {
  const item = product as any;
  const discount = getProductDiscount(product);
  const compareAtPrice = getProductComparePrice(product);

  return (
    <Link to={`/products/${item.id}`} className="shop-preview-product-card">
      <div className="shop-preview-product-image">
        {discount ? <span>-{discount}%</span> : null}

        <img src={getProductImage(product)} alt={item.title || item.name} />
      </div>

      <div className="shop-preview-product-body">
        <h3>{item.title || item.name}</h3>

        <div className="shop-preview-product-price">
          <strong>{formatMoney(item.price)}</strong>

          {compareAtPrice ? <del>{formatMoney(compareAtPrice)}</del> : null}
        </div>

        <div className="shop-preview-product-meta">
          <small>Đã bán {getProductSold(product)}</small>

          <button type="button" aria-label="Thêm vào giỏ">
            🛒
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ShopDetailsPage() {
  const { id } = useParams();
  const shopId = Number(id);

  const [shop, setShop] = useState<ShopView | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadShop() {
      setLoading(true);
      setError('');
      setProducts([]);

      try {
        const shopResponse = await getShopDetail(shopId);
        const shopData = unwrapApiData<ShopView>(shopResponse);

        if (!mounted) return;

        setShop(shopData);
        setProductsLoading(true);

        try {
          const productsResponse = await getProductsByShop(shopData.id, {
            page: 1,
            limit: 8,
          });

          if (!mounted) return;

          setProducts(unwrapPaginatedItems<ProductListItem>(productsResponse));
        } catch {
          if (!mounted) return;
          setProducts([]);
        } finally {
          if (mounted) setProductsLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;

        setShop(null);
        setError(getApiMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (Number.isFinite(shopId) && shopId > 0) {
      void loadShop();
    } else {
      setLoading(false);
      setError('Shop không hợp lệ.');
    }

    return () => {
      mounted = false;
    };
  }, [shopId]);

  const productCount = useMemo(() => {
    return shop?.productCount ?? shop?.stats?.productCount ?? products.length ?? 0;
  }, [shop, products.length]);

  const totalOrders = shop?.totalOrders ?? shop?.stats?.totalOrders ?? 0;
  const totalSold = shop?.totalSold ?? shop?.stats?.totalSold ?? 0;
  const ratingAvg = shop?.stats?.ratingAvg ?? 0;
  const reviewCount = shop?.stats?.reviewCount ?? 0;

  if (loading) {
    return (
      <div className="mochi-page shop-detail-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding shop-detail-state">
            Đang tải thông tin shop...
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mochi-page shop-detail-page">
        <div className="mochi-container">
          <div className="shop-detail-inaccessible mochi-card">
            <img src={bunnyImg} alt="Shop không thể truy cập" />

            <h1>Shop không thể truy cập</h1>

            <p>{error || 'Shop này không tồn tại hoặc đã bị xóa.'}</p>

            <Link to="/shops/me" className="mochi-btn mochi-btn-primary">
              Quay lại shop của tôi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page shop-detail-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>{shop.name}</b>
        </div>

        <section className="shop-detail-hero mochi-card">
          <div className="shop-detail-cover">
            {shop.coverUrl ? (
              <img src={shop.coverUrl} alt={shop.name} />
            ) : (
              <div className="shop-detail-cover-fallback" />
            )}
          </div>

          <div className="shop-detail-content">
            <div className="shop-detail-logo">
              <img src={shop.logoUrl || bunnyImg} alt={shop.name} />
            </div>

            <div className="shop-detail-info">
              <span>Mochi Shop ♡</span>

              <h1>{shop.name}</h1>

              <p>{shop.description || 'Cửa hàng chưa cập nhật mô tả.'}</p>

              <div className="shop-detail-meta">
                <small>🧸 {productCount} sản phẩm</small>
                <small>📦 {totalOrders} đơn hàng</small>
                <small>🛍️ {totalSold} đã bán</small>
                <small>⭐ {ratingAvg}/5 ({reviewCount})</small>
                <small>✅ {formatDate(shop.verifiedAt)}</small>
              </div>
            </div>

            <img className="shop-detail-art" src={basketImg} alt="Mochi" />
          </div>
        </section>

        <section className="shop-detail-grid">
          <div className="shop-detail-panel mochi-card">
            <h2>Thông tin cửa hàng</h2>

            <p>
              <b>Email:</b> {shop.email || 'Chưa cập nhật'}
            </p>

            <p>
              <b>Số điện thoại:</b> {shop.shopPhone || 'Chưa cập nhật'}
            </p>

            <p>
              <b>Địa chỉ:</b> {shop.shopAddress || 'Chưa cập nhật'}
            </p>
          </div>

          <div className="shop-detail-panel mochi-card">
            <h2>Tổng quan shop</h2>

            <p>
              <b>Sản phẩm:</b> {productCount}
            </p>

            <p>
              <b>Đơn hàng:</b> {totalOrders}
            </p>

            <p>
              <b>Đánh giá:</b> {ratingAvg}/5 từ {reviewCount} lượt đánh giá
            </p>
          </div>
        </section>

        <section className="shop-detail-products mochi-card">
          <div className="shop-detail-products-head">
            <div>
              <h2>Sản phẩm bán chạy ✨</h2>
              <p>Những sản phẩm đang hiển thị công khai của shop.</p>
            </div>

            <Link to={`/products?shopId=${shop.id}`} className="mochi-section-link">
              Xem tất cả →
            </Link>
          </div>

          {productsLoading ? (
            <div className="shop-detail-products-empty">
              Đang tải sản phẩm của shop...
            </div>
          ) : products.length > 0 ? (
            <div className="shop-preview-product-row">
              {products.map((product) => (
                <ShopPreviewProductCard
                  key={(product as any).id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="shop-detail-products-empty">
              Shop hiện chưa có sản phẩm đang bán.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}