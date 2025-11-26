// src/pages/products/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProductDetail, getProductVariants } from '../../api/products.api';
import type { ProductDetail, ProductVariant, ApiResponse } from '../../api/types';
import { getMainImageUrl, getAllImages } from '../../utils/productImage';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getPublicProductDetail(id),
      // variants có thể chỉ cho Seller/Admin but skeleton cứ gọi, nếu 403 thì bỏ qua
      getProductVariants(id).catch(() => null),
    ])
      .then(([detailRes, variantRes]) => {
        const detailPayload = (detailRes as unknown as ApiResponse<ProductDetail>).data;
        setProduct(detailPayload);

        if (variantRes) {
          const variantPayload = (variantRes as unknown as ApiResponse<ProductVariant[]>).data;
          setVariants(variantPayload);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Không tải được sản phẩm.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="product-detail-state-container">
        <div className="product-detail-state-card product-detail-state-card--error">
          Thiếu id sản phẩm.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-detail-state-container">
        <div className="product-detail-state-card product-detail-state-card--loading">
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-state-container">
        <div className="product-detail-state-card product-detail-state-card--error">
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-state-container">
        <div className="product-detail-state-card product-detail-state-card--loading">
          Không tìm thấy sản phẩm.
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-card">
        <div className="product-detail-header">
          <div className="product-detail-icon">📦</div>
          <h1 className="product-detail-title">{product.title}</h1>
        </div>

        {getMainImageUrl(product) && (
          <div className="product-detail-main-image">
            <img src={getMainImageUrl(product)!} alt={product.title} />
          </div>
        )}

        <div className="product-detail-info-card">
          <div className="product-detail-info-grid">
            <div className="product-detail-info-item">
              <span className="product-detail-info-label">Giá:</span>
              <span className="product-detail-info-value">
                {product.price} {product.currency}
              </span>
            </div>
            <div className="product-detail-info-item">
              <span className="product-detail-info-label">Trạng thái:</span>
              <span className="product-detail-info-value-small">{product.status}</span>
            </div>
          </div>

          {product.description && (
            <div className="product-detail-description">
              <span className="product-detail-info-label">Mô tả:</span>
              <div className="product-detail-description-text">{product.description}</div>
            </div>
          )}
        </div>

        {getAllImages(product).length > 0 && (
          <div className="product-detail-images-section">
            <h3 className="product-detail-images-title">Tất cả hình ảnh</h3>
            <div className="product-detail-images-grid">
              {getAllImages(product).map((img) => (
                <div
                  key={img.id}
                  className={`product-detail-image-item ${
                    img.isMain ? 'product-detail-image-item--main' : ''
                  }`}
                >
                  <img src={img.normalizedUrl} alt={product.title} />
                  {img.isMain && (
                    <span className="product-detail-image-badge">Chính</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <div className="product-detail-variants-section">
            <h3 className="product-detail-variants-title">Các biến thể (variants)</h3>
            <div className="product-detail-variants-table-wrapper">
              <table className="product-detail-variants-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Tên</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td>{v.sku}</td>
                      <td>{v.name}</td>
                      <td>{v.price}</td>
                      <td>{v.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
