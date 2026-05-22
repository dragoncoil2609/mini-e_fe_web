import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  getProductVariants,
  getPublicProductDetail,
} from '../../api/products.api';
import { addItem } from '../../api/cart.api';
import {
  addFavoriteProduct,
  recordProductEvent,
  removeFavoriteProduct,
} from '../../api/recommendations.api';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ProductDetailPage.css';

type ProductImage = {
  id?: number;
  url: string;
  alt?: string | null;
  isMain?: boolean;
};

type ProductView = {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number | string;
  compareAtPrice?: number | string | null;
  stock?: number;
  sold?: number;
  status?: string;
  shopId?: number;
  categoryId?: number | null;
  images?: ProductImage[];
  mainImageUrl?: string | null;
  imageUrl?: string | null;
  isFavorite?: boolean | 0 | 1 | '0' | '1';
};

type VariantRow = {
  id: number;
  sku?: string;
  name?: string;
  price?: string | number | null;
  stock?: number;
  imageId?: number | null;
  options?: {
    option: string;
    value: string | null;
  }[];
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tải chi tiết sản phẩm.'
  );
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value?: number | string | null) {
  return new Intl.NumberFormat('vi-VN').format(toNumber(value)) + 'đ';
}

function getProductName(product?: ProductView | null) {
  return product?.title || product?.name || 'Sản phẩm';
}

function getProductImages(product?: ProductView | null): ProductImage[] {
  if (!product) return [];

  const images = product.images ?? [];

  if (images.length > 0) {
    return images;
  }

  if (product.mainImageUrl) {
    return [{ url: product.mainImageUrl, isMain: true }];
  }

  if (product.imageUrl) {
    return [{ url: product.imageUrl, isMain: true }];
  }

  return [{ url: bunnyImg, isMain: true }];
}

function getVariantImageUrl(
  productImages: ProductImage[],
  variant?: VariantRow | null,
) {
  if (!variant?.imageId) return null;

  const img = productImages.find((image) => image.id === variant.imageId);
  return img?.url ?? null;
}

function getDiscountPercent(product?: ProductView | null) {
  const price = toNumber(product?.price);
  const compareAt = toNumber(product?.compareAtPrice);

  if (!compareAt || compareAt <= price) return null;

  return Math.round((1 - price / compareAt) * 100);
}

function normalizeFavorite(value: ProductView['isFavorite']) {
  return value === true || value === 1 || value === '1';
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const productId = Number(id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [cartMessageType, setCartMessageType] = useState<'success' | 'error'>(
    'success',
  );

  const productImages = useMemo(() => getProductImages(product), [product]);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? null;

  const displayPrice =
    selectedVariant?.price !== null &&
    selectedVariant?.price !== undefined &&
    selectedVariant?.price !== ''
      ? selectedVariant.price
      : product?.price;

  const displayStock =
    selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
      ? selectedVariant.stock
      : product?.stock ?? 0;

  const isOutOfStock =
    product?.status === 'OUT_OF_STOCK' || toNumber(displayStock) <= 0;

  const canAddToCart =
    Boolean(selectedVariantId) && !isOutOfStock && !addingCart;

  const discountPercent = getDiscountPercent(product);

  async function loadProductDetail() {
    if (!productId) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setCartMessage('');

    try {
      const [productResponse, variantsResponse] = await Promise.all([
        getPublicProductDetail(productId),
        getProductVariants(productId).catch(() => null),
      ]);

      const productData = unwrapApiData<ProductView>(productResponse);
      const variantData = variantsResponse
        ? unwrapApiData<VariantRow[]>(variantsResponse)
        : [];

      const safeVariants = Array.isArray(variantData) ? variantData : [];
      const images = getProductImages(productData);

      setProduct(productData);
      setVariants(safeVariants);
      setIsFavorite(normalizeFavorite(productData?.isFavorite));

      if (safeVariants.length > 0) {
        const firstAvailable =
          safeVariants.find((variant) => toNumber(variant.stock) > 0) ??
          safeVariants[0];

        setSelectedVariantId(firstAvailable.id);

        const variantImage = getVariantImageUrl(images, firstAvailable);
        setActiveImageUrl(variantImage || images[0]?.url || bunnyImg);
      } else {
        setSelectedVariantId(null);
        setActiveImageUrl(images[0]?.url || bunnyImg);
      }
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSelectVariant(variant: VariantRow) {
    setSelectedVariantId(variant.id);

    const imageUrl = getVariantImageUrl(productImages, variant);
    if (imageUrl) {
      setActiveImageUrl(imageUrl);
    }

    setQuantity(1);
    setCartMessage('');
  }

  function changeQuantity(next: number) {
    const max = Math.max(1, toNumber(displayStock));
    const safe = Math.min(max, Math.max(1, next));

    setQuantity(safe);
  }

  async function handleAddToCart(): Promise<boolean> {
    if (!product) return false;

    if (!selectedVariantId) {
      setCartMessageType('error');
      setCartMessage('Vui lòng chọn biến thể trước khi thêm vào giỏ hàng.');
      return false;
    }

    setAddingCart(true);
    setCartMessage('');

    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariantId,
        quantity,
      });

      recordProductEvent({
        productId: product.id,
        eventType: 'ADD_TO_CART',
        metadata: {
          source: 'product_detail',
          quantity,
          variantId: selectedVariantId,
        },
      }).catch(() => {});

      setCartMessageType('success');
      setCartMessage('Đã thêm sản phẩm vào giỏ hàng.');

      window.dispatchEvent(new Event('mochi-cart-updated'));
      return true;
    } catch (err: any) {
      setCartMessageType('error');
      setCartMessage(getApiMessage(err));
      return false;
    } finally {
      setAddingCart(false);
    }
  }

  async function handleBuyNow() {
    const added = await handleAddToCart();

    if (added) {
      navigate('/cart');
    }
  }

  async function handleToggleFavorite() {
    if (!product || favoriteLoading) return;

    const previous = isFavorite;

    try {
      setFavoriteLoading(true);
      setIsFavorite(!previous);

      if (previous) {
        await removeFavoriteProduct(product.id);
      } else {
        await addFavoriteProduct(product.id);
      }
    } catch (err: any) {
      setIsFavorite(previous);
      setCartMessageType('error');
      setCartMessage(
        err?.response?.status === 401
          ? 'Bạn cần đăng nhập để yêu thích sản phẩm.'
          : getApiMessage(err),
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

  useEffect(() => {
    void loadProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;

    recordProductEvent({
      productId: product.id,
      eventType: 'VIEW_DETAIL',
      metadata: {
        source: 'product_detail',
      },
    }).catch(() => {
      // User chưa đăng nhập hoặc tracking lỗi thì bỏ qua.
    });
  }, [product?.id]);

  if (loading) {
    return (
      <div className="mochi-page product-detail-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding product-detail-state">
            Đang tải chi tiết sản phẩm...
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mochi-page product-detail-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-empty">
            <h3 className="mochi-empty-title">Không thể xem sản phẩm</h3>
            <p className="mochi-empty-desc">
              {error || 'Sản phẩm không tồn tại hoặc đã ngừng bán.'}
            </p>

            <Link
              to="/products"
              className="mochi-btn mochi-btn-primary product-detail-back"
            >
              Xem sản phẩm khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page product-detail-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/products">Sản phẩm</Link>
          <span>›</span>
          <b>{getProductName(product)}</b>
        </div>

        <section className="product-detail-shell mochi-card">
          <div className="product-detail-gallery">
            <div className="product-detail-main-image">
              {discountPercent ? (
                <span className="product-detail-discount">
                  -{discountPercent}%
                </span>
              ) : null}

              {isOutOfStock ? (
                <span className="product-detail-stock-tag">Hết hàng</span>
              ) : null}

              <img
                src={activeImageUrl || bunnyImg}
                alt={getProductName(product)}
              />
            </div>

            <div className="product-detail-thumbs">
              {productImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image.url}-${index}`}
                  className={activeImageUrl === image.url ? 'active' : ''}
                  onClick={() => setActiveImageUrl(image.url)}
                >
                  <img src={image.url} alt={image.alt || `Ảnh ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail-info">
            <div className="product-detail-shop-line">
              <span>Mochi product</span>
              <small>#{product.id}</small>
            </div>

            <h1>{getProductName(product)}</h1>

            <div className="product-detail-meta">
              <span>Đã bán {product.sold ?? 0}</span>
              <span>Còn {displayStock ?? 0} sản phẩm</span>
            </div>

            <div className="product-detail-price-box">
              <strong>{formatMoney(displayPrice)}</strong>

              {product.compareAtPrice ? (
                <span>{formatMoney(product.compareAtPrice)}</span>
              ) : null}
            </div>

            {variants.length > 0 ? (
              <div className="product-detail-section">
                <h2>Chọn biến thể</h2>

                <div className="product-detail-variants">
                  {variants.map((variant) => {
                    const variantStock = toNumber(variant.stock);
                    const variantImageUrl = getVariantImageUrl(
                      productImages,
                      variant,
                    );
                    const selected = selectedVariantId === variant.id;

                    return (
                      <button
                        type="button"
                        key={variant.id}
                        className={selected ? 'active' : ''}
                        disabled={variantStock <= 0}
                        onClick={() => handleSelectVariant(variant)}
                      >
                        {variantImageUrl ? (
                          <img
                            src={variantImageUrl}
                            alt={variant.name || 'Biến thể'}
                          />
                        ) : null}

                        <span>
                          {variant.name || variant.sku || `Biến thể #${variant.id}`}
                        </span>
                        <small>
                          {variantStock > 0 ? `Còn ${variantStock}` : 'Hết hàng'}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="product-detail-section">
                <h2>Biến thể</h2>
                <p className="product-detail-cart-message is-error">
                  Sản phẩm này chưa có biến thể nên chưa thể thêm vào giỏ hàng.
                </p>
              </div>
            )}

            <div className="product-detail-section">
              <h2>Số lượng</h2>

              <div className="product-detail-quantity">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => changeQuantity(quantity - 1)}
                >
                  −
                </button>

                <input
                  value={quantity}
                  inputMode="numeric"
                  onChange={(event) => changeQuantity(Number(event.target.value))}
                />

                <button
                  type="button"
                  disabled={quantity >= toNumber(displayStock)}
                  onClick={() => changeQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {cartMessage ? (
              <div className={`product-detail-cart-message is-${cartMessageType}`}>
                {cartMessage}
              </div>
            ) : null}

            <div className="product-detail-actions">
              <button
                type="button"
                className="mochi-btn mochi-btn-primary"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                {addingCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                disabled={!canAddToCart}
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>

              <button
                type="button"
                className={`mochi-btn mochi-btn-outline product-detail-favorite-btn ${
                  isFavorite ? 'is-active' : ''
                }`}
                disabled={favoriteLoading}
                onClick={handleToggleFavorite}
              >
                {favoriteLoading
                  ? 'Đang xử lý...'
                  : isFavorite
                    ? '♥ Đã yêu thích'
                    : '♡ Yêu thích'}
              </button>
            </div>

            <div className="product-detail-service-note">
              <span>🚚 Giao hàng nhanh</span>
              <span>🔄 Đổi trả trong 7 ngày</span>
              <span>🛡️ Bảo vệ người mua</span>
            </div>
          </div>
        </section>

        <section className="product-detail-description mochi-card">
          <h2>Mô tả sản phẩm</h2>

          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p className="text-muted">Sản phẩm chưa có mô tả chi tiết.</p>
          )}
        </section>
      </div>
    </div>
  );
}