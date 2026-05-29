import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getShopDetail } from '../../api/shop.api';
import { getProductsByShop } from '../../api/products.api';
import { getShopReviews, type ShopReviewsSummary } from '../../api/reviews.api';
import type { ProductListItem, ProductReview } from '../../api/types';

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

function unwrapReviewsResponse(response: any) {
  const data = unwrapApiData<any>(response);

  return {
    items: (data?.items ?? []) as ProductReview[],
    total: Number(data?.total ?? 0),
    summary: data?.summary as ShopReviewsSummary | undefined,
  };
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

function ratingText(value?: number | string) {
  return Number(value ?? 0).toFixed(1);
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

function userName(review: ProductReview) {
  return review.user?.name || review.userNameSnapshot || 'Người dùng Mochi';
}

function userAvatar(review: ProductReview) {
  return review.user?.avatarUrl || review.userAvatarSnapshot || '';
}

function productName(review: ProductReview) {
  return review.product?.title || `Sản phẩm #${review.productId}`;
}

function reviewImages(images: ProductReview['images']) {
  if (!images) return [];
  return Array.isArray(images) ? images.filter(Boolean) : [];
}

function renderStars(rating?: number) {
  const value = Math.max(0, Math.min(5, Number(rating ?? 0)));

  return '★★★★★'.split('').map((star, index) => (
    <span
      key={index}
      className={index < value ? 'shop-detail-review-star-active' : ''}
    >
      {star}
    </span>
  ));
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
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] =
    useState<ShopReviewsSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadShop() {
      setLoading(true);
      setError('');
      setProducts([]);
      setReviews([]);
      setReviewSummary(null);

      try {
        const shopResponse = await getShopDetail(shopId);
        const shopData = unwrapApiData<ShopView>(shopResponse);

        if (!mounted) return;

        setShop(shopData);

        setProductsLoading(true);
        setReviewsLoading(true);

        void getProductsByShop(shopData.id, {
          page: 1,
          limit: 8,
        })
          .then((productsResponse) => {
            if (!mounted) return;
            setProducts(unwrapPaginatedItems<ProductListItem>(productsResponse));
          })
          .catch(() => {
            if (!mounted) return;
            setProducts([]);
          })
          .finally(() => {
            if (mounted) setProductsLoading(false);
          });

        void getShopReviews(shopData.id, {
          page: 1,
          limit: 4,
        })
          .then((reviewResponse) => {
            if (!mounted) return;

            const reviewData = unwrapReviewsResponse(reviewResponse);

            setReviews(reviewData.items);
            setReviewSummary(reviewData.summary ?? null);
          })
          .catch(() => {
            if (!mounted) return;

            setReviews([]);
            setReviewSummary(null);
          })
          .finally(() => {
            if (mounted) setReviewsLoading(false);
          });
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

  const ratingAvg =
    reviewSummary?.ratingAvg ??
    reviewSummary?.avg ??
    shop?.stats?.ratingAvg ??
    0;

  const reviewCount =
    reviewSummary?.reviewCount ??
    reviewSummary?.count ??
    shop?.stats?.reviewCount ??
    0;

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
                <small>⭐ {ratingText(ratingAvg)}/5 ({reviewCount})</small>
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
              <b>Đánh giá:</b> {ratingText(ratingAvg)}/5 từ {reviewCount} lượt
              đánh giá
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

        <section className="shop-detail-reviews mochi-card">
          <div className="shop-detail-reviews-head">
            <div>
              <h2>Đánh giá shop ⭐</h2>
              <p>Đánh giá được tổng hợp từ các sản phẩm của shop.</p>
            </div>

            <div className="shop-detail-review-score">
              <strong>{ratingText(ratingAvg)}</strong>
              <span>/5</span>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="shop-detail-reviews-empty">
              Đang tải đánh giá shop...
            </div>
          ) : reviews.length > 0 ? (
            <div className="shop-detail-review-list">
              {reviews.map((review) => {
                const images = reviewImages(review.images);

                return (
                  <article key={review.id} className="shop-detail-review-item">
                    <div className="shop-detail-review-user">
                      <div className="shop-detail-review-avatar">
                        {userAvatar(review) ? (
                          <img src={userAvatar(review)} alt={userName(review)} />
                        ) : (
                          <span>{userName(review).charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div>
                        <h3>{userName(review)}</h3>

                        <div className="shop-detail-review-stars">
                          {renderStars(review.rating)}
                        </div>

                        <small>{formatDate(review.createdAt)}</small>
                      </div>
                    </div>

                    <div className="shop-detail-review-content">
                      <p className="shop-detail-review-product">
                        Sản phẩm:{' '}
                        {review.product?.id ? (
                          <Link to={`/products/${review.product.id}`}>
                            {productName(review)}
                          </Link>
                        ) : (
                          <span>{productName(review)}</span>
                        )}
                      </p>

                      {review.comment ? (
                        <p className="shop-detail-review-comment">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="shop-detail-review-comment shop-detail-review-muted">
                          Khách hàng chưa để lại bình luận.
                        </p>
                      )}

                      {images.length > 0 ? (
                        <div className="shop-detail-review-images">
                          {images.map((image, index) => (
                            <img
                              key={`${review.id}-${index}`}
                              src={image}
                              alt={`Review ${index + 1}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="shop-detail-reviews-empty">
              Shop hiện chưa có đánh giá.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}