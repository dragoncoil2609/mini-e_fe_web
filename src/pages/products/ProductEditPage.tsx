// src/pages/products/ProductEditPage.tsx
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getProductDetail, updateProduct } from '../../api/products.api';
import {
  getSellerCategoryOptions,
  type SellerCategoryOption,
} from '../../api/categories.api';

import './style/ProductEditPage.css';

type ProductFormData = {
  id: number;
  title?: string;
  slug?: string;
  description?: string;
  price?: number | string;
  categoryId?: number | null;
  status?: string;
  deletedAt?: string | null;
  images?: { id?: number; url: string; isMain?: boolean }[];
};

type CategorySelectOption = {
  id: number;
  name: string;
  label: string;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể cập nhật sản phẩm. Vui lòng thử lại.'
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductFormData | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [categories, setCategories] = useState<SellerCategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const productId = Number(id);
  const isLocked = status === 'LOCKED';
  const isDeleted = Boolean(product?.deletedAt);

  const categoryOptions = useMemo<CategorySelectOption[]>(() => {
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      label: category.fullName || category.name,
    }));
  }, [categories]);

  async function loadProduct() {
    if (!productId) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getProductDetail(productId);
      const data = unwrapApiData<ProductFormData>(response);

      setProduct(data);
      setTitle(data.title ?? '');
      setSlug(data.slug ?? '');
      setDescription(data.description ?? '');
      setPrice(String(data.price ?? ''));
      setCategoryId(data.categoryId ? String(data.categoryId) : '');
      setStatus(data.status ?? 'ACTIVE');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      setCategoryLoading(true);
      setCategoryError('');

      const response = await getSellerCategoryOptions();

      setCategories(response.data ?? []);
    } catch (err: any) {
      setCategories([]);
      setCategoryError(
        err?.response?.data?.message ||
          err?.message ||
          'Không tải được danh mục.',
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setError('Sản phẩm đã bị khóa, shop không thể chỉnh sửa.');
      return;
    }

    if (isDeleted) {
      setError('Sản phẩm đã bị xóa, không thể chỉnh sửa.');
      return;
    }

    const cleanTitle = title.trim();
    const numericPrice = Number(price);

    if (!cleanTitle) {
      setError('Vui lòng nhập tên sản phẩm.');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Giá sản phẩm không hợp lệ.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await updateProduct(productId, {
        title: cleanTitle,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        price: numericPrice,
        categoryId: categoryId ? Number(categoryId) : null,
        status,
      });

      navigate('/shops/me/products');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadProduct();
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mochi-page product-form-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding product-form-state">
            Đang tải sản phẩm...
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="mochi-page product-form-page">
        <div className="mochi-container">
          <div className="mochi-card mochi-card-padding product-form-error">
            {error}
          </div>

          <Link to="/shops/me/products" className="mochi-btn mochi-btn-outline">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page product-form-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/shops/me">Shop của tôi</Link>
          <span>›</span>
          <Link to="/shops/me/products">Sản phẩm</Link>
          <span>›</span>
          <b>Sửa sản phẩm</b>
        </div>

        <form className="product-form-layout" onSubmit={handleSubmit}>
          <main className="product-form-main mochi-card">
            <div className="product-form-head">
              <div>
                <h1>Sửa sản phẩm</h1>
                <p>
                  Cập nhật thông tin cơ bản và trạng thái bán hàng của sản phẩm.
                </p>
              </div>

              <Link
                to={`/shops/me/products/${productId}/variants`}
                className="mochi-btn mochi-btn-outline"
              >
                Quản lý biến thể
              </Link>
            </div>

            {error ? <div className="product-form-error">{error}</div> : null}

            {isLocked ? (
              <div className="product-form-warning">
                Sản phẩm này đã bị admin khóa. Shop chỉ có thể xem, không thể
                chỉnh sửa.
              </div>
            ) : null}

            {isDeleted ? (
              <div className="product-form-warning">
                Sản phẩm này đã bị xóa mềm. Không thể chỉnh sửa lại dữ liệu.
              </div>
            ) : null}

            <div className="product-form-section">
              <h2>Thông tin sản phẩm</h2>

              <div className="mochi-form">
                <div className="mochi-form-group">
                  <label className="mochi-label">Tên sản phẩm *</label>
                  <input
                    className="mochi-input"
                    value={title}
                    disabled={isLocked || isDeleted}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={180}
                  />
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Slug</label>
                  <input
                    className="mochi-input"
                    value={slug}
                    disabled={isLocked || isDeleted}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    maxLength={200}
                  />
                </div>

                <div className="mochi-form-row">
                  <div className="mochi-form-group">
                    <label className="mochi-label">Giá bán *</label>
                    <input
                      className="mochi-input"
                      value={price}
                      disabled={isLocked || isDeleted}
                      onChange={(event) => setPrice(event.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Danh mục</label>

                    <select
                      className="mochi-select"
                      value={categoryId}
                      disabled={isLocked || isDeleted || categoryLoading}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">
                        {categoryLoading
                          ? 'Đang tải danh mục...'
                          : 'Chọn danh mục cho sản phẩm'}
                      </option>

                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    {categoryError ? (
                      <small className="product-category-message error">
                        {categoryError}
                      </small>
                    ) : null}
                  </div>
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Trạng thái</label>
                  <select
                    className="mochi-select"
                    value={status}
                    disabled={isLocked || isDeleted}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                  </select>
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Mô tả</label>
                  <textarea
                    className="mochi-textarea"
                    value={description}
                    disabled={isLocked || isDeleted}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>

            {product?.images?.length ? (
              <div className="product-form-section">
                <h2>Ảnh hiện tại</h2>

                <div className="product-preview-grid">
                  {product.images.map((image, index) => (
                    <div
                      className="product-preview-item"
                      key={image.id ?? image.url}
                    >
                      <img src={image.url} alt={`Ảnh ${index + 1}`} />
                      {image.isMain || index === 0 ? (
                        <span>Ảnh chính</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </main>

          <aside className="product-form-side mochi-card">
            <h2>Lưu thay đổi</h2>

            <p>
              Shop chỉ được đổi trạng thái về <b>Đang bán</b> hoặc{' '}
              <b>Hết hàng</b>. Trạng thái <b>Đã khóa</b> do admin xử lý.
            </p>

            <button
              type="submit"
              className="mochi-btn mochi-btn-primary product-submit-btn"
              disabled={submitting || isLocked || isDeleted}
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>

            <Link
              to="/shops/me/products"
              className="mochi-btn mochi-btn-outline product-submit-btn"
            >
              Quay lại
            </Link>
          </aside>
        </form>
      </div>
    </div>
  );
}