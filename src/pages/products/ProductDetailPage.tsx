// src/pages/ProductDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getPublicProductDetail, getProductVariants } from '../../api/products.api';
import { getShopDetail } from '../../api/shop.api';

import type { ApiResponse, ProductDetail, ProductVariant, Shop } from '../../api/types';

import { getAllImages, getMainImageUrl } from '../../utils/productImage';
import './style/ProductDetailPage.css';

const formatCurrency = (value: number | string | undefined | null) => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

// normalize options của variant về Record để match ổn định (hỗ trợ cả array & object)
function variantOptionsToRecord(v: ProductVariant): Record<string, string> {
  const raw: unknown = (v as any).options;

  if (!raw) return {};

  // case đúng theo types.ts: options là array [{ option, value }]
  if (Array.isArray(raw)) {
    const rec: Record<string, string> = {};
    for (const it of raw) {
      const key = String((it as any)?.option ?? (it as any)?.name ?? '');
      const val = String((it as any)?.value ?? (it as any)?.val ?? '');
      if (key) rec[key] = val;
    }
    return rec;
  }

  // case BE trả object: { "Màu": "Trắng", "Size": "M" }
  if (typeof raw === 'object') return raw as Record<string, string>;

  // case hiếm: BE trả string JSON
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

  const optionSchema = product?.optionSchema || [];

  const allImages = useMemo(() => {
    if (!product) return [];
    return getAllImages(product); // [{ id, normalizedUrl }]
  }, [product]);

  // đã chọn đủ option chưa
  const isFullOptionsSelected =
    optionSchema.length > 0 && Object.keys(selectedOptions).length === optionSchema.length;

  // derive variant dựa theo selectedOptions (match đúng kiểu options array)
  const currentVariant = useMemo(() => {
    if (!product) return null;
    if (!variants.length) return null;

    const need = product.optionSchema?.length || 0;
    if (need <= 0) return null;
    if (Object.keys(selectedOptions).length !== need) return null;

    return (
      variants.find((v) => {
        const rec = variantOptionsToRecord(v);
        return Object.entries(selectedOptions).every(([k, val]) => rec[k] === val);
      }) || null
    );
  }, [product, variants, selectedOptions]);

  // Load product detail + variants
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

  // Load shop info từ product.shopId
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

  // Khi variant đổi → ưu tiên ảnh của variant (imageId), nếu không thì dùng main
  useEffect(() => {
    if (!product) return;

    if (!isFullOptionsSelected || !currentVariant) {
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
  }, [currentVariant, isFullOptionsSelected, allImages, product]);

  const handleOptionClick = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const displayPrice = currentVariant?.price ?? product?.price;
  const displayStock = currentVariant?.stock ?? product?.stock ?? 0;

  const basePrice = product?.price;
  const hasVariantPrice =
    currentVariant &&
    currentVariant.price !== undefined &&
    Number(currentVariant.price) !== Number(basePrice ?? 0);

  const numericStock = Number(displayStock ?? 0);
  const inStock = numericStock > 0;

  const canPurchase = inStock && (!optionSchema.length || isFullOptionsSelected);

  const clampQty = (q: number) => {
    const min = 1;
    const max = numericStock > 0 ? numericStock : Number.MAX_SAFE_INTEGER;
    return Math.max(min, Math.min(max, q));
  };

  const handleAddToCart = () => {
    alert('TODO: add to cart');
  };

  const handleBuyNow = () => {
    alert('TODO: buy now');
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
          <button type="button" className="pdp-btn-buy" onClick={() => navigate('/products')}>
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const mainUrl = previewImage || getMainImageUrl(product) || '';
  const shopName = shop?.name || '';
  const avatarLetter = shopName ? shopName.trim()[0]?.toUpperCase() : 'S';

  // totalSold: cố gắng lấy theo nhiều kiểu để không crash nếu API khác nhau
  const totalSold =
    (shop as any)?.totalSold ??
    (shop as any)?.stats?.totalSold ??
    (shop as any)?.stats?.total_sold ??
    null;

  return (
    <div className="pdp-container">
      <div className="pdp-wrapper">
        <div className="pdp-breadcrumb">
          <span onClick={() => navigate('/products')}>Sản phẩm</span>
          <span className="pdp-breadcrumb-sep">/</span>
          <span className="pdp-breadcrumb-current">{product.title}</span>
        </div>

        <div className="pdp-main-card">
          {/* LEFT: IMAGES */}
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

          {/* RIGHT: INFO */}
          <div className="pdp-info-col">
            {/* SHOP HEADER (match CSS) */}
            {shop && (
              <div className="pdp-shop-header">
                <div className="pdp-shop-avatar">{avatarLetter}</div>
                <div className="pdp-shop-meta">
                  <p className="pdp-shop-name">
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/shops/${shop.id}`)}
                      title="Xem shop"
                    >
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
              {product.compareAtPrice && (
                <div className="pdp-compare-price">{formatCurrency(product.compareAtPrice)}</div>
              )}
            </div>

            {/* OPTIONS */}
            {optionSchema.map((opt) => (
              <div className="pdp-option-group" key={opt.name}>
                <div className="pdp-option-label">{opt.name}</div>
                <div className="pdp-option-values">
                  {opt.values.map((val) => {
                    const selected = selectedOptions[opt.name] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`pdp-option-btn ${selected ? 'selected' : ''}`}
                        onClick={() => handleOptionClick(opt.name, val)}
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
                <div className="pdp-meta-value">{numericStock}</div>
              </div>

              <div className="pdp-meta-item">
                <div className="pdp-meta-label">SKU</div>
                <div className="pdp-meta-value">{currentVariant?.sku || '---'}</div>
              </div>
            </div>

            {/* QUANTITY + ACTION */}
            <div className="pdp-actions">
              <div className="pdp-quantity-group">
                <span>Số lượng</span>

                <div className="pdp-quantity-control">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    aria-label="decrease"
                    disabled={!inStock}
                  >
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

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    aria-label="increase"
                    disabled={!inStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pdp-action-buttons">
                <button
                  type="button"
                  className="pdp-btn-cart"
                  disabled={!canPurchase}
                  onClick={handleAddToCart}
                >
                  Thêm vào giỏ
                </button>

                <button
                  type="button"
                  className="pdp-btn-buy"
                  disabled={!canPurchase}
                  onClick={handleBuyNow}
                >
                  {canPurchase
                    ? 'Mua ngay'
                    : optionSchema.length && !isFullOptionsSelected
                      ? 'Vui lòng chọn biến thể'
                      : 'Hết hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION (match CSS) */}
        {product.description && (
          <div className="pdp-description-section">
            <h3>Mô tả</h3>
            <div className="pdp-desc-content">{product.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
