import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPublicProductDetail,
  getProductVariants,
} from '../../api/products.api';
import type {
  ProductDetail,
  ProductVariant,
  ApiResponse,
} from '../../api/types';
import {
  getMainImageUrl,
  getAllImages,
} from '../../utils/productImage';
import './style/ProductDetailPage.css';

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // State UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State Logic sản phẩm
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);

  // Fetch dữ liệu
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      getPublicProductDetail(id),
      getProductVariants(id).catch(() => null), // Variant lỗi thì bỏ qua
    ])
      .then(([detailRes, variantRes]) => {
        const detailData = (
          detailRes as unknown as ApiResponse<ProductDetail>
        ).data;
        setProduct(detailData);
        // Set ảnh mặc định
        setPreviewImage(getMainImageUrl(detailData));

        if (variantRes) {
          const variantData = (
            variantRes as unknown as ApiResponse<ProductVariant[]>
          ).data;
          setVariants(variantData);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được thông tin sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Logic tìm Variant dựa trên Option đang chọn
  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null;

    // Tìm variant khớp với TẤT CẢ option đang chọn
    return variants.find((v) => {
      if (!v.options) return false;
      return v.options.every(
        (opt) => selectedOptions[opt.option] === opt.value,
      );
    });
  }, [variants, selectedOptions]);

  // Xử lý khi user click chọn Option (Màu/Size)
  const handleOptionClick = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // TODO: nếu sau này BE trả về image cho variant, chỗ này có thể đổi previewImage theo variant
  };

  // Format tiền tệ
  const formatPrice = (amount: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount));
  };

  // Xác định thông tin hiển thị (Giá, Kho, SKU)
  const displayPrice = currentVariant ? currentVariant.price : product?.price;
  const displayStock = currentVariant ? currentVariant.stock : product?.stock;
  const displaySku = currentVariant ? currentVariant.sku : '---';

  // Kiểm tra đã chọn đủ option chưa (để enable nút Mua)
  const isFullOptionsSelected = product?.optionSchema
    ? product.optionSchema.length ===
      Object.keys(selectedOptions).length
    : true;

  const canAddToCart =
    isFullOptionsSelected && Number(displayStock) > 0;

  // --- RENDER ---

  if (loading)
    return (
      <div className="pdp-loading">
        <div className="pdp-loading-card">Đang tải sản phẩm...</div>
      </div>
    );

  if (error || !product)
    return (
      <div className="pdp-loading">
        <div className="pdp-error-card">
          {error || 'Sản phẩm không tồn tại'}
        </div>
      </div>
    );

  const allImages = getAllImages(product);

  return (
    <div className="pdp-container">
      <div className="pdp-wrapper">
        {/* Breadcrumb / Back */}
        <div className="pdp-breadcrumb">
          <span onClick={() => navigate('/home')}>Trang chủ</span>
          <span className="pdp-breadcrumb-sep">/</span>
          <span className="pdp-breadcrumb-current">
            {product.title}
          </span>
        </div>

        <div className="pdp-main-card">
          {/* CỘT TRÁI: HÌNH ẢNH */}
          <div className="pdp-gallery-col">
            <div className="pdp-main-image-frame">
              {previewImage ? (
                <img src={previewImage} alt={product.title} />
              ) : (
                <div className="pdp-no-image">Không có ảnh</div>
              )}
            </div>

            <div className="pdp-thumb-list">
              {allImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`pdp-thumb-item ${
                    previewImage === img.normalizedUrl
                      ? 'active'
                      : ''
                  }`}
                  onMouseEnter={() =>
                    setPreviewImage(img.normalizedUrl)
                  }
                  onClick={() =>
                    setPreviewImage(img.normalizedUrl)
                  }
                >
                  <img src={img.normalizedUrl} alt="thumbnail" />
                </button>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN */}
          <div className="pdp-info-col">
            {/* Shop Info (placeholder) */}
            <div className="pdp-shop-header">
              <div className="pdp-shop-avatar">🏪</div>
              <div className="pdp-shop-meta">
                <h4 className="pdp-shop-name">
                  Cửa hàng chính hãng
                </h4>
                <div className="pdp-shop-sub">
                  <span className="pdp-sold-count">
                    Đã bán {product.sold ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="pdp-title">{product.title}</h1>

            <div className="pdp-price-box">
              {product.compareAtPrice &&
                Number(product.compareAtPrice) >
                  Number(displayPrice) && (
                  <span className="pdp-compare-price">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              <span className="pdp-current-price">
                {formatPrice(displayPrice || 0)}
              </span>
            </div>

            {/* Options (Màu, Size, ...) */}
            {product.optionSchema &&
              product.optionSchema.map((schema, idx) => (
                <div key={idx} className="pdp-option-group">
                  <span className="pdp-option-label">
                    {schema.name}:
                  </span>
                  <div className="pdp-option-values">
                    {schema.values.map((val) => {
                      const isSelected =
                        selectedOptions[schema.name] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          className={`pdp-option-btn ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() =>
                            handleOptionClick(schema.name, val)
                          }
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Meta info: SKU & Kho */}
            <div className="pdp-meta-info">
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">SKU</span>
                <span className="pdp-meta-value">
                  {displaySku}
                </span>
              </div>
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">Tồn kho</span>
                <span className="pdp-meta-value">
                  {displayStock} sản phẩm
                </span>
              </div>
            </div>

            {/* Số lượng + nút hành động */}
            <div className="pdp-actions">
              <div className="pdp-quantity-group">
                <span className="pdp-option-label">Số lượng:</span>
                <div className="pdp-quantity-control">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.max(1, q - 1))
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => q + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pdp-action-buttons">
                <button
                  type="button"
                  className="pdp-btn-cart"
                  disabled={!canAddToCart}
                  onClick={() =>
                    alert(
                      `Thêm vào giỏ: ${
                        currentVariant
                          ? currentVariant.sku
                          : 'Sản phẩm gốc'
                      } - SL: ${quantity}`,
                    )
                  }
                >
                  🛒 Thêm vào giỏ
                </button>
                <button
                  type="button"
                  className="pdp-btn-buy"
                  disabled={!canAddToCart}
                >
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MÔ TẢ SẢN PHẨM */}
        <section className="pdp-description-section">
          <h3>Mô tả sản phẩm</h3>
          <div
            className="pdp-desc-content"
            dangerouslySetInnerHTML={{
              __html: product.description || '',
            }}
          />
        </section>
      </div>
    </div>
  );
}
