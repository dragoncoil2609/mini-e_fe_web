import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyShop } from '../../api/shop.api';
import {
  getMyShopReviews,
  type ShopReviewsSummary,
} from '../../api/reviews.api';
import type { ProductReview } from '../../api/types';

import ShopOwnerSidebar from '../../components/shop/ShopOwnerSidebar';

import './style/ShopReviewsPage.css';

type ShopView = {
  id: number;
  name: string;
  stats?: {
    ratingAvg?: number | string;
    reviewCount?: number;
  } | null;
};

type RatingFilter = '' | '1' | '2' | '3' | '4' | '5';

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapReviewsResponse(response: any) {
  const data = unwrapApiData<any>(response);

  return {
    items: (data?.items ?? []) as ProductReview[],
    total: Number(data?.total ?? data?.meta?.total ?? 0),
    page: Number(data?.page ?? data?.meta?.page ?? 1),
    limit: Number(data?.limit ?? data?.meta?.limit ?? 10),
    summary: data?.summary as ShopReviewsSummary | undefined,
  };
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải đánh giá shop.'
  );
}

function ratingText(value?: number | string) {
  return Number(value ?? 0).toFixed(1);
}

function formatDate(value?: string) {
  if (!value) return 'Chưa có';

  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return value;
  }
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

function renderStars(rating?: number) {
  const value = Math.max(0, Math.min(5, Number(rating ?? 0)));

  return '★★★★★'.split('').map((star, index) => (
    <span
      key={index}
      className={index < value ? 'shop-review-star-active' : ''}
    >
      {star}
    </span>
  ));
}

function reviewImages(images: ProductReview['images']) {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images.filter(Boolean);
  }

  return [];
}

export default function ShopReviewsPage() {
  const [shop, setShop] = useState<ShopView | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ShopReviewsSummary | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function loadReviews(nextPage = page, nextRating = ratingFilter) {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await getMyShop();
      const shopData = unwrapApiData<ShopView>(shopResponse);

      setShop(shopData);

      const reviewResponse = await getMyShopReviews({
        page: nextPage,
        limit,
        rating: nextRating ? Number(nextRating) : undefined,
      });

      const reviewData = unwrapReviewsResponse(reviewResponse);

      setReviews(reviewData.items);
      setTotal(reviewData.total);
      setPage(reviewData.page);
      setSummary(reviewData.summary ?? null);
    } catch (err: any) {
      setReviews([]);
      setTotal(0);
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeRating = (value: RatingFilter) => {
    setRatingFilter(value);
    void loadReviews(1, value);
  };

  const ratingAvg =
    summary?.ratingAvg ??
    summary?.avg ??
    shop?.stats?.ratingAvg ??
    0;

  const reviewCount =
    summary?.reviewCount ??
    summary?.count ??
    shop?.stats?.reviewCount ??
    total ??
    0;

  return (
    <div className="mochi-page shop-reviews-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <b>Đánh giá</b>
        </div>

        <div className="shop-reviews-layout">
          <ShopOwnerSidebar shopId={shop?.id} />

          <main className="shop-reviews-main">
            <section className="shop-reviews-head mochi-card">
              <div>
                <h1>Đánh giá shop</h1>
                <p>
                  Danh sách đánh giá được lấy từ review của các sản phẩm thuộc
                  shop.
                </p>
              </div>

              <div className="shop-reviews-head-actions">
                <select
                  value={ratingFilter}
                  onChange={(event) =>
                    handleChangeRating(event.target.value as RatingFilter)
                  }
                >
                  <option value="">Tất cả sao</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>

                <button
                  type="button"
                  className="mochi-btn mochi-btn-outline"
                  onClick={() => void loadReviews(page, ratingFilter)}
                  disabled={loading}
                >
                  Làm mới
                </button>
              </div>
            </section>

            {loading ? (
              <div className="mochi-card mochi-card-padding shop-reviews-state">
                Đang tải đánh giá...
              </div>
            ) : error ? (
              <div className="mochi-card mochi-card-padding shop-reviews-error">
                {error}
              </div>
            ) : (
              <>
                <section className="shop-reviews-summary mochi-card">
                  <div className="shop-reviews-score">
                    <strong>{ratingText(ratingAvg)}</strong>
                    <span>/5</span>
                  </div>

                  <div>
                    <h2>Điểm đánh giá trung bình</h2>
                    <p>{reviewCount} lượt đánh giá</p>

                    <div className="shop-reviews-stars">
                      {renderStars(Math.round(Number(ratingAvg)))}
                    </div>
                  </div>
                </section>

                {reviews.length === 0 ? (
                  <section className="shop-reviews-empty mochi-card">
                    <h2>Chưa có đánh giá</h2>

                    <p>
                      Khi khách hàng đánh giá sản phẩm trong shop, nội dung sẽ
                      hiển thị tại đây.
                    </p>
                  </section>
                ) : (
                  <>
                    <section className="shop-reviews-list">
                      {reviews.map((review) => {
                        const images = reviewImages(review.images);

                        return (
                          <article
                            key={review.id}
                            className="shop-review-item mochi-card"
                          >
                            <div className="shop-review-user">
                              <div className="shop-review-avatar">
                                {userAvatar(review) ? (
                                  <img
                                    src={userAvatar(review)}
                                    alt={userName(review)}
                                  />
                                ) : (
                                  <span>
                                    {userName(review).charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div>
                                <h3>{userName(review)}</h3>

                                <div className="shop-review-item-stars">
                                  {renderStars(review.rating)}
                                </div>

                                <p>{formatDate(review.createdAt)}</p>
                              </div>
                            </div>

                            <div className="shop-review-content">
                              <div className="shop-review-product">
                                Sản phẩm:{' '}
                                {review.product?.id ? (
                                  <Link to={`/products/${review.product.id}`}>
                                    {productName(review)}
                                  </Link>
                                ) : (
                                  <span>{productName(review)}</span>
                                )}
                              </div>

                              {review.comment ? (
                                <p className="shop-review-comment">
                                  {review.comment}
                                </p>
                              ) : (
                                <p className="shop-review-comment shop-review-comment-muted">
                                  Khách hàng chưa để lại bình luận.
                                </p>
                              )}

                              {images.length > 0 ? (
                                <div className="shop-review-images">
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
                    </section>

                    <div className="shop-reviews-pagination">
                      <button
                        type="button"
                        className="mochi-btn mochi-btn-outline mochi-btn-sm"
                        disabled={page <= 1}
                        onClick={() => void loadReviews(page - 1, ratingFilter)}
                      >
                        Trước
                      </button>

                      <span>
                        Trang {page} / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="mochi-btn mochi-btn-outline mochi-btn-sm"
                        disabled={page >= totalPages}
                        onClick={() => void loadReviews(page + 1, ratingFilter)}
                      >
                        Sau
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}