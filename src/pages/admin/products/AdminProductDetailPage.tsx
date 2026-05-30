import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiRefreshCw, FiUnlock } from 'react-icons/fi';

import {
  getAdminProductDetail,
  getProductVariants,
  updateProductStatus,
} from '../../../api/products.api';
import type {
  ProductDetail,
  ProductImage,
  ProductStatus,
  ProductVariant,
} from '../../../api/types';

import './style/AdminProductDetailPage.css';

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

function formatMoney(value?: string | number | null) {
  const numberValue = Number(value ?? 0);

  return new Intl.NumberFormat('vi-VN').format(
    Number.isFinite(numberValue) ? numberValue : 0,
  ) + 'đ';
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getStatusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Đang bán';
  if (status === 'OUT_OF_STOCK') return 'Hết hàng';
  if (status === 'LOCKED') return 'Đã khóa';
  return status || 'Không rõ';
}

function getStatusClass(status?: string) {
  if (status === 'ACTIVE') return 'active';
  if (status === 'OUT_OF_STOCK') return 'out';
  if (status === 'LOCKED') return 'locked';
  return 'unknown';
}

function getImages(product?: ProductDetail | null): ProductImage[] {
  if (!product) return [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }

  if (product.mainImageUrl) {
    return [
      {
        id: 0,
        productId: product.id,
        url: product.mainImageUrl,
        position: 0,
        isMain: true,
      },
    ];
  }

  return [];
}

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const productId = Number(id);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [activeImage, setActiveImage] = useState('');

  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState('');

  const images = useMemo(() => getImages(product), [product]);

  async function loadDetail() {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [productResponse, variantsResponse] = await Promise.all([
        getAdminProductDetail(productId),
        getProductVariants(productId).catch(() => null),
      ]);

      const productData = unwrapApiData<ProductDetail>(productResponse);
      const variantData = variantsResponse
        ? unwrapApiData<ProductVariant[]>(variantsResponse)
        : [];

      setProduct(productData);
      setVariants(Array.isArray(variantData) ? variantData : []);

      const nextImages = getImages(productData);
      setActiveImage(nextImages[0]?.url || '/src/assets/brand/bunny_bear_original.png');
    } catch (err: any) {
      setError(getApiMessage(err));
      setProduct(null);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(nextStatus: ProductStatus) {
    if (!product) return;

    const ok = window.confirm(
      nextStatus === 'LOCKED'
        ? `Khóa sản phẩm "${product.title}"?`
        : `Mở khóa sản phẩm "${product.title}" về trạng thái đang bán?`,
    );

    if (!ok) return;

    setChangingStatus(true);
    setError('');

    try {
      const response = await updateProductStatus(product.id, nextStatus);
      const data = unwrapApiData<ProductDetail>(response);

      setProduct(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể đổi trạng thái sản phẩm.',
      );
    } finally {
      setChangingStatus(false);
    }
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="admin-product-detail-page">
        <div className="admin-product-detail-state">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="admin-product-detail-page">
        <div className="admin-product-detail-state error">{error}</div>

        <button
          type="button"
          className="admin-product-detail-back-btn"
          onClick={() => navigate('/admin/products')}
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="admin-product-detail-page">
      <div className="admin-product-detail-head">
        <button
          type="button"
          className="admin-product-detail-back-btn"
          onClick={() => navigate('/admin/products')}
        >
          <FiArrowLeft />
          Quay lại
        </button>

        <div>
          <h1>Chi tiết sản phẩm</h1>
          <p>Admin chỉ xem chi tiết và đổi trạng thái sản phẩm.</p>
        </div>

        <div className="admin-product-detail-head-actions">
          {product.status === 'LOCKED' ? (
            <button
              type="button"
              disabled={changingStatus}
              onClick={() => handleStatusChange('ACTIVE')}
            >
              <FiUnlock />
              Mở khóa
            </button>
          ) : (
            <button
              type="button"
              disabled={changingStatus}
              onClick={() => handleStatusChange('LOCKED')}
            >
              <FiLock />
              Khóa sản phẩm
            </button>
          )}

          <button type="button" onClick={loadDetail}>
            <FiRefreshCw />
            Tải lại
          </button>
        </div>
      </div>

      {error ? <div className="admin-product-detail-message">{error}</div> : null}

      <div className="admin-product-detail-layout">
        <section className="admin-product-detail-card admin-product-gallery-card">
          <div className="admin-product-main-image">
            <img src={activeImage} alt={product.title} />
          </div>

          {images.length > 1 ? (
            <div className="admin-product-thumbs">
              {images.map((image) => (
                <button
                  type="button"
                  key={image.id || image.url}
                  className={activeImage === image.url ? 'active' : ''}
                  onClick={() => setActiveImage(image.url)}
                >
                  <img src={image.url} alt={product.title} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="admin-product-detail-card admin-product-info-card">
          <div className="admin-product-title-row">
            <div>
              <h2>{product.title}</h2>
              <p>ID: {product.id}</p>
            </div>

            <span
              className={`admin-products-status ${getStatusClass(
                product.status,
              )}`}
            >
              {getStatusLabel(product.status)}
            </span>
          </div>

          <div className="admin-product-info-grid">
            <div>
              <span>Giá bán</span>
              <strong>{formatMoney(product.price)}</strong>
            </div>

            <div>
              <span>Tồn kho</span>
              <strong>{product.stock ?? 0}</strong>
            </div>

            <div>
              <span>Đã bán</span>
              <strong>{product.sold ?? 0}</strong>
            </div>

            <div>
              <span>Shop ID</span>
              <strong>{product.shopId}</strong>
            </div>

            <div>
              <span>Category ID</span>
              <strong>{product.categoryId || '—'}</strong>
            </div>

            <div>
              <span>Ngày tạo</span>
              <strong>{formatDate(product.createdAt)}</strong>
            </div>
          </div>

          <div className="admin-product-desc">
            <h3>Mô tả</h3>
            <p>{product.description || 'Sản phẩm chưa có mô tả.'}</p>
          </div>

          <Link
            to={`/products/${product.id}`}
            className="admin-product-public-link"
            target="_blank"
          >
            Xem trang public
          </Link>
        </section>
      </div>

      <section className="admin-product-detail-card admin-product-variants-card">
        <div className="admin-product-section-head">
          <h2>Biến thể sản phẩm</h2>
          <p>{variants.length} biến thể</p>
        </div>

        <div className="admin-product-variants-table-wrap">
          <table className="admin-product-variants-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên biến thể</th>
                <th>SKU</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Options</th>
              </tr>
            </thead>

            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-product-empty">
                    Sản phẩm chưa có biến thể
                  </td>
                </tr>
              ) : (
                variants.map((variant, index) => (
                  <tr key={variant.id}>
                    <td>{index + 1}</td>
                    <td>{variant.name}</td>
                    <td>{variant.sku}</td>
                    <td>{formatMoney(variant.price)}</td>
                    <td>{variant.stock}</td>
                    <td>
                      {variant.options?.length
                        ? variant.options
                            .map((option) => `${option.option}: ${option.value}`)
                            .join(' / ')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}