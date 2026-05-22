import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getProductVariants,
  getPublicProductDetail,
} from '../../api/products.api';

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

export default function ProductDetailPage() {
  const { id } = useParams();

  const productId = Number(id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const productImages = useMemo(() => getProductImages(product), [product]);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;

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

  const discountPercent = getDiscountPercent(product);

  async function loadProductDetail() {
    if (!productId) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

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
  }

  function changeQuantity(next: number) {
    const max = Math.max(1, toNumber(displayStock));
    const safe = Math.min(max, Math.max(1, next));

    setQuantity(safe);
  }

  function handleAddToCart() {
    // Tạm thời chỉ hiển thị thông báo.
    // Khi bạn muốn nối cart thật, chỗ này gọi API add item vào cart.
    alert('Phần thêm giỏ hàng sẽ nối API cart sau.');
  }

  useEffect(() => {
    void loadProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

            <Link to="/products" className="mochi-btn mochi-btn-primary product-detail-back">
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
                <span className="product-detail-discount">-{discountPercent}%</span>
              ) : null}

              {isOutOfStock ? (
                <span className="product-detail-stock-tag">Hết hàng</span>
              ) : null}

              <img src={activeImageUrl || bunnyImg} alt={getProductName(product)} />
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
                    const variantImageUrl = getVariantImageUrl(productImages, variant);
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
                          <img src={variantImageUrl} alt={variant.name || 'Biến thể'} />
                        ) : null}

                        <span>{variant.name || variant.sku || `Biến thể #${variant.id}`}</span>
                        <small>{variantStock > 0 ? `Còn ${variantStock}` : 'Hết hàng'}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

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

            <div className="product-detail-actions">
              <button
                type="button"
                className="mochi-btn mochi-btn-primary"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </button>

              <button
                type="button"
                className="mochi-btn mochi-btn-outline"
                disabled={isOutOfStock}
              >
                Mua ngay
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