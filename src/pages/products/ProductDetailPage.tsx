// src/pages/ProductDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getPublicProductDetail, getProductVariants } from '../../api/products.api';
import { getShopDetail } from '../../api/shop.api';
import { CartApi } from '../../api/cart.api';
import { http } from '../../api/http';

import type { ApiResponse, ProductDetail, ProductVariant, Shop } from '../../api/types';

import { getAllImages, getMainImageUrl } from '../../utils/productImage';
import './style/ProductDetailPage.css';

type ReviewUserPublic = {
  id: number;
  name: string;
  avatarUrl: string | null;
};

type ProductReview = {
  id: string;
  orderId: string;
  userId: number;
  productId: number;
  rating: number;
  comment: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUserPublic | null;
};

type ProductReviewsList = {
  summary: { count: number; avg: number };
  items: ProductReview[];
  page: number;
  limit: number;
  total: number;
};

const formatCurrency = (value: number | string | undefined | null) => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

function formatDateVi(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return (
    <span className="pdp-stars" aria-label={`${r} trên 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`pdp-star ${i < r ? 'filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function variantOptionsToRecord(v: ProductVariant): Record<string, string> {
  const raw: unknown = (v as any).options;
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const rec: Record<string, string> = {};
    for (const it of raw) {
      const key = String((it as any)?.option ?? (it as any)?.name ?? '');
      const val = String((it as any)?.value ?? (it as any)?.val ?? '');
      if (key) rec[key] = val;
    }
    return rec;
  }

  if (typeof raw === 'object') return raw as Record<string, string>;

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const rec: Record<string, string> = {};
        for (const it of parsed) {
          const key = String((it as any)?.option ?? (it as any)?.name ?? '');
          const val = String((it as any)?.value ?? (it as any)?.val ?? '');
          if (key) rec[key] = val;
        }
        return rec;
      }
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    } catch {
      return {};
    }
  }

  return {};
}

function ReviewAvatar({ user }: { user: ReviewUserPublic | null }) {
  const name = user?.name?.trim() || 'Người mua';
  const first = (name[0] || 'U').toUpperCase();

  if (user?.avatarUrl) {
    return <img className="pdp-review-avatar-img" src={user.avatarUrl} alt={name} />;
  }

  return <div className="pdp-review-avatar">{first}</div>;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? Number(id) : null;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // ===== REVIEWS =====
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; avg: number }>({ count: 0, avg: 0 });
  const [reviewPage, setReviewPage] = useState(1);
  const reviewLimit = 6;
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const optionSchema = product?.optionSchema || [];

  const allImages = useMemo(() => {
    if (!product) return [];
    return getAllImages(product);
  }, [product]);

  const isFullOptionsSelected =
    optionSchema.length > 0 && Object.keys(selectedOptions).length === optionSchema.length;

  const totalVariantStock = useMemo(() => {
    if (!variants.length) return 0;
    return variants.reduce((sum, v) => sum + Math.max(0, Number((v as any).stock ?? 0)), 0);
  }, [variants]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    if (!variants.length) return null;

    const need = product.optionSchema?.length || 0;
    if (need <= 0) return variants[0] ?? null;

    if (Object.keys(selectedOptions).length !== need) return null;

    return (
      variants.find((v) => {
        const rec = variantOptionsToRecord(v);
        return Object.entries(selectedOptions).every(([k, val]) => rec[k] === val);
      }) || null
    );
  }, [product, variants, selectedOptions]);

  const isOptionValueAvailable = (optionName: string, value: string): boolean => {
    if (!variants.length) return true;
    const next = { ...selectedOptions, [optionName]: value };
    return variants.some((v) => {
      const stock = Number((v as any).stock ?? 0);
      if (stock <= 0) return false;
      const rec = variantOptionsToRecord(v);
      return Object.entries(next).every(([k, val]) => rec[k] === val);
    });
  };

  useEffect(() => {
    if (!numericId) return;

    setLoading(true);
    setError(null);

    Promise.all([getPublicProductDetail(numericId), getProductVariants(numericId).catch(() => null)])
      .then(([detailRes, variantRes]) => {
        const detail = (detailRes as unknown as ApiResponse<ProductDetail>).data;

        setProduct(detail);
        setSelectedOptions({});
        setQuantity(1);

        const main = getMainImageUrl(detail);
        setPreviewImage(main || null);

        if (variantRes) {
          const vs = (variantRes as unknown as ApiResponse<ProductVariant[]>).data;
          setVariants(Array.isArray(vs) ? vs : []);
        } else {
          setVariants([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [numericId]);

  useEffect(() => {
    const shopId = product?.shopId;
    if (!shopId) {
      setShop(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await getShopDetail(shopId);
        if (!cancelled) setShop(res.success ? (res.data as Shop) : null);
      } catch (e) {
        console.error(e);
        if (!cancelled) setShop(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product?.shopId]);

  useEffect(() => {
    if (!product) return;

    if (!currentVariant) {
      setPreviewImage(getMainImageUrl(product) || null);
      return;
    }

    const vid = currentVariant.imageId != null ? Number(currentVariant.imageId) : null;
    if (vid) {
      const found = allImages.find((x) => Number(x.id) === vid);
      if (found?.normalizedUrl) {
        setPreviewImage(found.normalizedUrl);
        return;
      }
    }

    setPreviewImage(getMainImageUrl(product) || null);
  }, [currentVariant, allImages, product]);

  // ===== LOAD REVIEWS (public) =====
  useEffect(() => {
    if (!numericId) return;

    setReviews([]);
    setReviewSummary({ count: 0, avg: 0 });
    setReviewPage(1);
    setReviewTotal(0);
    setReviewError(null);

    let cancelled = false;

    (async () => {
      setReviewLoading(true);
      try {
        const res = await http.get<ApiResponse<ProductReviewsList>>(`/products/${numericId}/reviews`, {
          params: { page: 1, limit: reviewLimit },
        });

        const payload = res.data?.data as unknown as ProductReviewsList;

        if (cancelled) return;

        setReviewSummary(payload?.summary || { count: 0, avg: 0 });
        setReviewTotal(Number(payload?.total ?? 0));
        setReviews(Array.isArray(payload?.items) ? payload.items : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setReviewError('Không tải được đánh giá.');
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [numericId]);

  const loadMoreReviews = async () => {
    if (!numericId) return;
    const next = reviewPage + 1;

    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await http.get<ApiResponse<ProductReviewsList>>(`/products/${numericId}/reviews`, {
        params: { page: next, limit: reviewLimit },
      });

      const payload = res.data?.data as unknown as ProductReviewsList;
      const more = Array.isArray(payload?.items) ? payload.items : [];

      setReviews((prev) => [...prev, ...more]);
      setReviewSummary(payload?.summary || reviewSummary);
      setReviewTotal(Number(payload?.total ?? reviewTotal));
      setReviewPage(next);
    } catch (e) {
      console.error(e);
      setReviewError('Không tải thêm đánh giá.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOptionClick = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const displayPrice = currentVariant?.price ?? product?.price;
  const displayStock = currentVariant?.stock ?? 0;

  const numericStock = Number(displayStock ?? 0);
  const inStock = numericStock > 0;

  const canPurchase = inStock && (!optionSchema.length || isFullOptionsSelected) && !!currentVariant;

  const clampQty = (q: number) => {
    const min = 1;
    const max = numericStock > 0 ? numericStock : Number.MAX_SAFE_INTEGER;
    return Math.max(min, Math.min(max, q));
  };

  const handleAddToCart = async (): Promise<boolean> => {
    setActionError(null);
    setActionMsg(null);

    if (!product) return false;

    if (!currentVariant) {
      setActionError('Vui lòng chọn biến thể trước khi thêm vào giỏ.');
      return false;
    }

    if (optionSchema.length && !isFullOptionsSelected) {
      setActionError('Vui lòng chọn đầy đủ biến thể.');
      return false;
    }

    if (!inStock) {
      setActionError('Sản phẩm đã hết hàng.');
      return false;
    }

    setAdding(true);
    try {
      const res = await CartApi.addItem({
        productId: product.id,
        variantId: Number((currentVariant as any).id),
        quantity,
      });

      if (res.success) {
        setActionMsg('Đã thêm vào giỏ hàng!');
        return true;
      }

      setActionError(res.message || 'Thêm vào giỏ hàng thất bại.');
      return false;
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) {
        navigate('/login');
        return false;
      }
      setActionError(err?.response?.data?.message || 'Thêm vào giỏ hàng thất bại.');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    const ok = await handleAddToCart();
    if (ok) navigate('/cart');
  };

  if (!numericId) {
    return (
      <div className="pdp-loading">
        <div className="pdp-error-card">Thiếu id sản phẩm trên URL.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-loading-card">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pdp-loading">
        <div className="pdp-error-card">
          <div style={{ marginBottom: 12 }}>{error || 'Sản phẩm không tồn tại.'}</div>

          {/* ✅ đổi về /home thay vì /products (product list) */}
          <button type="button" className="pdp-btn-buy" onClick={() => navigate('/home')}>
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const mainUrl = previewImage || getMainImageUrl(product) || '';
  const shopName = shop?.name || '';
  const avatarLetter = shopName ? shopName.trim()[0]?.toUpperCase() : 'S';

  const totalSold =
    (shop as any)?.totalSold ?? (shop as any)?.stats?.totalSold ?? (shop as any)?.stats?.total_sold ?? null;

  const canLoadMore = reviews.length < (reviewTotal || 0);

  return (
    <div className="pdp-container">
      <div className="pdp-wrapper">
        <div className="pdp-breadcrumb">
          <span onClick={() => navigate('/home')}>Trang chủ</span>
          <span className="pdp-breadcrumb-sep">/</span>

          {/* ✅ đổi "Sản phẩm" (product list) về /home */}
          <span onClick={() => navigate('/home')}>Sản phẩm</span>

          <span className="pdp-breadcrumb-sep">/</span>
          <span className="pdp-breadcrumb-current">{product.title}</span>
        </div>

        <div className="pdp-main-card">
          {/* LEFT */}
          <div className="pdp-gallery-col">
            <div className="pdp-main-image-frame">
              {mainUrl ? <img src={mainUrl} alt={product.title} /> : <div className="pdp-no-image">No image</div>}
            </div>

            {allImages.length > 0 && (
              <div className="pdp-thumb-list">
                {allImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`pdp-thumb-item ${img.normalizedUrl === mainUrl ? 'active' : ''}`}
                    onClick={() => setPreviewImage(img.normalizedUrl)}
                    aria-label="Xem ảnh"
                  >
                    <img src={img.normalizedUrl} alt="thumb" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="pdp-info-col">
            {shop && (
              <div className="pdp-shop-header">
                <div className="pdp-shop-avatar">{avatarLetter}</div>
                <div className="pdp-shop-meta">
                  <p className="pdp-shop-name">
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/shops/${shop.id}`)} title="Xem shop">
                      {shop.name}
                    </span>
                  </p>
                  <div className="pdp-shop-sub">Bán bởi shop</div>
                </div>

                {totalSold != null && <div className="pdp-sold-count">Đã bán: {Number(totalSold) || 0}</div>}
              </div>
            )}

            <h1 className="pdp-title">{product.title}</h1>

            <div className="pdp-price-box">
              <div className="pdp-current-price">{formatCurrency(displayPrice)}</div>
              {product.compareAtPrice && <div className="pdp-compare-price">{formatCurrency(product.compareAtPrice)}</div>}
            </div>

            {optionSchema.map((opt) => (
              <div className="pdp-option-group" key={opt.name}>
                <div className="pdp-option-label">{opt.name}</div>
                <div className="pdp-option-values">
                  {opt.values.map((val) => {
                    const selected = selectedOptions[opt.name] === val;
                    const available = isOptionValueAvailable(opt.name, val);
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`pdp-option-btn ${selected ? 'selected' : ''}`}
                        onClick={() => handleOptionClick(opt.name, val)}
                        disabled={!available}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pdp-meta-info">
              <div className="pdp-meta-item">
                <div className="pdp-meta-label">Tồn kho</div>
                <div className="pdp-meta-value">{optionSchema.length ? numericStock : totalVariantStock}</div>
              </div>

              <div className="pdp-meta-item">
                <div className="pdp-meta-label">SKU</div>
                <div className="pdp-meta-value">{currentVariant?.sku || '---'}</div>
              </div>
            </div>

            <div className="pdp-actions">
              <div className="pdp-quantity-group">
                <span>Số lượng</span>

                <div className="pdp-quantity-control">
                  <button type="button" onClick={() => setQuantity((q) => clampQty(q - 1))} disabled={!inStock}>
                    –
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={numericStock > 0 ? numericStock : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(clampQty(Number(e.target.value || 1)))}
                    disabled={!inStock}
                    inputMode="numeric"
                  />

                  <button type="button" onClick={() => setQuantity((q) => clampQty(q + 1))} disabled={!inStock}>
                    +
                  </button>
                </div>
              </div>

              <div className="pdp-action-buttons">
                <button type="button" className="pdp-btn-cart" disabled={!canPurchase || adding} onClick={handleAddToCart}>
                  {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>

                <button type="button" className="pdp-btn-buy" disabled={!canPurchase || adding} onClick={handleBuyNow}>
                  {canPurchase
                    ? 'Mua ngay'
                    : optionSchema.length && !isFullOptionsSelected
                      ? 'Vui lòng chọn biến thể'
                      : 'Hết hàng'}
                </button>
              </div>
            </div>

            {(actionError || actionMsg) && (
              <div style={{ marginTop: 10, fontSize: 14 }}>
                {actionError && <div style={{ color: '#b42318' }}>{actionError}</div>}
                {actionMsg && <div style={{ color: '#027a48' }}>{actionMsg}</div>}
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div className="pdp-description-section">
            <h3>Mô tả</h3>
            <div className="pdp-desc-content">{product.description}</div>
          </div>
        )}

        {/* ===== REVIEWS ===== */}
        <div className="pdp-reviews-section">
          <div className="pdp-reviews-header">
            <h3>Đánh giá</h3>

            <div className="pdp-reviews-summary">
              <div className="pdp-reviews-avg">
                <strong>{Number(reviewSummary.avg || 0).toFixed(2)}</strong>
                <span className="pdp-reviews-sub">/5</span>
              </div>
              <div className="pdp-reviews-count">{reviewSummary.count || 0} đánh giá</div>
            </div>
          </div>

          {reviewLoading && reviews.length === 0 && <div className="pdp-reviews-loading">Đang tải đánh giá...</div>}
          {reviewError && <div className="pdp-reviews-error">{reviewError}</div>}

          {!reviewLoading && !reviewError && (reviewSummary.count || 0) === 0 && (
            <div className="pdp-reviews-empty">Chưa có đánh giá nào cho sản phẩm này.</div>
          )}

          {reviews.length > 0 && (
            <div className="pdp-review-list">
              {reviews.map((r) => {
                const displayName = r.user?.name?.trim() || 'Người mua';
                return (
                  <div key={r.id} className="pdp-review-item">
                    <div className="pdp-review-top">
                      <div className="pdp-review-user">
                        <ReviewAvatar user={r.user} />
                        <span className="pdp-review-user-name">{displayName}</span>
                      </div>

                      <div className="pdp-review-date">{formatDateVi(r.createdAt)}</div>
                    </div>

                    <div className="pdp-review-rating">
                      <Stars rating={r.rating} />
                      <span className="pdp-review-score">{r.rating}/5</span>
                    </div>

                    {r.comment && <div className="pdp-review-comment">{r.comment}</div>}

                    {Array.isArray(r.images) && r.images.length > 0 && (
                      <div className="pdp-review-images">
                        {r.images.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="pdp-review-img">
                            <img src={url} alt="review" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canLoadMore && (
            <div className="pdp-reviews-more">
              <button type="button" className="pdp-btn-cart" onClick={loadMoreReviews} disabled={reviewLoading}>
                {reviewLoading ? 'Đang tải...' : 'Tải thêm đánh giá'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
