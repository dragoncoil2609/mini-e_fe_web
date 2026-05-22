import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createProduct } from '../../api/products.api';
import {
  getPublicCategoryTree,
  type Category,
} from '../../api/categories.api';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ProductCreatePage.css';

type CategorySelectOption = {
  id: number;
  name: string;
  label: string;
  depth: number;
  hasChildren: boolean;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể tạo sản phẩm. Vui lòng thử lại.'
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

function flattenCategoryTree(
  categories: Category[],
  depth = 0,
): CategorySelectOption[] {
  const result: CategorySelectOption[] = [];

  for (const category of categories) {
    const children = category.children ?? [];
    const hasChildren = children.length > 0;

    const prefix = depth === 0 ? '' : `${'— '.repeat(depth)}`;

    result.push({
      id: category.id,
      name: category.name,
      label: `${prefix}${category.name}${depth === 0 ? ' (Danh mục cha)' : ''}`,
      depth,
      hasChildren,
    });

    if (hasChildren) {
      result.push(...flattenCategoryTree(children, depth + 1));
    }
  }

  return result;
}

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categoryOptions = useMemo(() => {
    return flattenCategoryTree(categories);
  }, [categories]);

  const previewUrls = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file));
  }, [images]);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError('');

        const response = await getPublicCategoryTree();

        if (!mounted) return;

        setCategories(response.data ?? []);
      } catch (err: any) {
        if (!mounted) return;

        setCategories([]);
        setCategoryError(
          err?.response?.data?.message ||
            err?.message ||
            'Không tải được danh mục.',
        );
      } finally {
        if (mounted) {
          setCategoryLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    if (validFiles.length > 6) {
      setImages(validFiles.slice(0, 6));
      return;
    }

    setImages(validFiles);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const response = await createProduct({
        title: cleanTitle,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        price: numericPrice,
        categoryId: categoryId ? Number(categoryId) : null,
        images,
      });

      const product = unwrapApiData<any>(response);
      const productId = product?.id;

      if (productId) {
        navigate(`/shops/me/products/${productId}/variants`);
      } else {
        navigate('/shops/me/products');
      }
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setSubmitting(false);
    }
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
          <b>Thêm sản phẩm</b>
        </div>

        <form className="product-form-layout" onSubmit={handleSubmit}>
          <main className="product-form-main mochi-card">
            <div className="product-form-head">
              <div>
                <h1>Thêm sản phẩm mới</h1>
                <p>
                  Nhập thông tin cơ bản của sản phẩm. Sau khi tạo xong bạn có
                  thể tạo biến thể.
                </p>
              </div>
            </div>

            {error ? <div className="product-form-error">{error}</div> : null}

            <div className="product-form-section">
              <h2>Thông tin sản phẩm</h2>

              <div className="mochi-form">
                <div className="mochi-form-group">
                  <label className="mochi-label">Tên sản phẩm *</label>
                  <input
                    className="mochi-input"
                    value={title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Ví dụ: Gấu bông thỏ Mochi"
                    maxLength={180}
                  />
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Slug</label>
                  <input
                    className="mochi-input"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    placeholder="gau-bong-tho-mochi"
                    maxLength={200}
                  />
                </div>

                <div className="mochi-form-row">
                  <div className="mochi-form-group">
                    <label className="mochi-label">Giá bán *</label>
                    <input
                      className="mochi-input"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="Ví dụ: 120000"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mochi-form-group">
                    <label className="mochi-label">Danh mục</label>

                    <select
                      className="mochi-select"
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      disabled={categoryLoading}
                    >
                      <option value="">
                        {categoryLoading
                          ? 'Đang tải danh mục...'
                          : 'Chọn danh mục cho sản phẩm'}
                      </option>

                      {categoryOptions.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          disabled={category.hasChildren}
                        >
                          {category.label}
                        </option>
                      ))}
                    </select>

                    {categoryError ? (
                      <small className="product-category-message error">
                        {categoryError}
                      </small>
                    ) : null
                    }
                  </div>
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Mô tả</label>
                  <textarea
                    className="mochi-textarea"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Mô tả ngắn về chất liệu, kích thước, công dụng..."
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>

            <div className="product-form-section">
              <h2>Hình ảnh sản phẩm</h2>

              <label className="product-upload-box">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImagesChange}
                />

                <span className="product-upload-icon">📷</span>
                <strong>Chọn ảnh sản phẩm</strong>
                <small>Tối đa 6 ảnh, nên dùng ảnh vuông hoặc nền sáng.</small>
              </label>

              {previewUrls.length > 0 ? (
                <div className="product-preview-grid">
                  {previewUrls.map((url, index) => (
                    <div className="product-preview-item" key={url}>
                      <img src={url} alt={`Ảnh ${index + 1}`} />
                      {index === 0 ? <span>Ảnh chính</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="product-empty-preview">
                  <img src={bunnyImg} alt="Preview" />
                  <p>Chưa chọn ảnh sản phẩm</p>
                </div>
              )}
            </div>
          </main>

          <aside className="product-form-side mochi-card">
            <h2>Hoàn tất</h2>

            <p>
              Sản phẩm mới sẽ được tạo ở trạng thái <b>Đang bán</b>. Bạn có thể
              chỉnh về hết hàng ở trang sửa.
            </p>

            <button
              type="submit"
              className="mochi-btn mochi-btn-primary product-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Đang tạo...' : 'Tạo sản phẩm'}
            </button>

            <Link
              to="/shops/me/products"
              className="mochi-btn mochi-btn-outline product-submit-btn"
            >
              Hủy
            </Link>
          </aside>
        </form>
      </div>
    </div>
  );
}