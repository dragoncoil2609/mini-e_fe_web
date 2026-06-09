// src/pages/products/ProductEditPage.tsx
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  addProductImages,
  deleteProductImage,
  getProductDetail,
  setMainProductImage,
  updateProduct,
} from '../../api/products.api';
import {
  getSellerCategoryOptions,
  suggestProductCategories,
  type CategoryParentFallback,
  type CategorySuggestionData,
  type CategorySuggestionItem,
  type SellerCategoryOption,
} from '../../api/categories.api';

import './style/ProductEditPage.css';

const MAX_PRODUCT_IMAGES = 10;

type ProductFormImage = {
  id?: number;
  url: string;
  isMain?: boolean;
  position?: number;
};

type ProductFormData = {
  id: number;
  title?: string;
  slug?: string;
  description?: string;
  price?: number | string;
  categoryId?: number | null;
  status?: string;
  deletedAt?: string | null;
  images?: ProductFormImage[];
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

function getSuggestionLevelText(level: string) {
  if (level === 'strong') return 'Rất phù hợp';
  if (level === 'medium') return 'Có thể phù hợp';
  return 'Tham khảo';
}

function normalizeImages(images?: ProductFormImage[]) {
  return [...(images ?? [])].sort((a, b) => {
    const posA = Number(a.position ?? 0);
    const posB = Number(b.position ?? 0);

    if (posA !== posB) return posA - posB;

    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
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

  const [categorySuggestions, setCategorySuggestions] = useState<
    CategorySuggestionItem[]
  >([]);
  const [parentFallbacks, setParentFallbacks] = useState<
    CategoryParentFallback[]
  >([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageActionId, setImageActionId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const productId = Number(id);
  const isLocked = status === 'LOCKED';
  const isDeleted = Boolean(product?.deletedAt);
  const currentImages = normalizeImages(product?.images);
  const remainingImageSlots = Math.max(0, MAX_PRODUCT_IMAGES - currentImages.length);
  const imageActionsDisabled = isLocked || isDeleted || imageUploading || Boolean(imageActionId);

  const categoryOptions = useMemo<CategorySelectOption[]>(() => {
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      label: category.fullName || category.name,
    }));
  }, [categories]);

  const selectedCategoryLabel = useMemo(() => {
    return (
      categoryOptions.find((category) => String(category.id) === categoryId)
        ?.label ?? ''
    );
  }, [categoryOptions, categoryId]);

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

  useEffect(() => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (isLocked || isDeleted || searchText.length < 3) {
      setCategorySuggestions([]);
      setParentFallbacks([]);
      setSuggestionMessage('');
      setSuggestionError('');
      setSuggestionLoading(false);
      return;
    }

    let active = true;

    const timer = window.setTimeout(async () => {
      try {
        setSuggestionLoading(true);
        setSuggestionError('');

        const response = await suggestProductCategories({
          title: cleanTitle,
          description: cleanDescription,
          limit: 5,
        });

        if (!active) return;

        const data = unwrapApiData<CategorySuggestionData>(response);

        setCategorySuggestions(data.items ?? []);
        setParentFallbacks(data.parentFallbacks ?? []);
        setSuggestionMessage(data.message ?? '');
      } catch (err: any) {
        if (!active) return;

        setCategorySuggestions([]);
        setParentFallbacks([]);
        setSuggestionMessage('');
        setSuggestionError(
          err?.response?.data?.message ||
            err?.message ||
            'Không gợi ý được danh mục.',
        );
      } finally {
        if (active) {
          setSuggestionLoading(false);
        }
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [title, description, isLocked, isDeleted]);

  function handleSelectCategory(nextCategoryId: number) {
    setCategoryId(String(nextCategoryId));
    setCategoryError('');
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

  async function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    event.target.value = '';

    if (isLocked || isDeleted) {
      setError('Sản phẩm không thể chỉnh sửa ảnh.');
      return;
    }

    if (!validFiles.length) {
      return;
    }

    if (remainingImageSlots <= 0) {
      setError(`Sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }

    const uploadFiles = validFiles.slice(0, remainingImageSlots);

    if (validFiles.length > remainingImageSlots) {
      setError(
        `Sản phẩm chỉ còn được thêm ${remainingImageSlots} ảnh. Hệ thống sẽ lấy ${remainingImageSlots} ảnh đầu tiên.`,
      );
    } else {
      setError('');
    }

    setImageUploading(true);

    try {
      const response = await addProductImages(productId, uploadFiles);
      const data = unwrapApiData<ProductFormData>(response);

      setProduct(data);
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSetMainImage(image: ProductFormImage) {
    if (!image.id) {
      setError('Ảnh không hợp lệ.');
      return;
    }

    if (isLocked || isDeleted) {
      setError('Sản phẩm không thể chỉnh sửa ảnh.');
      return;
    }

    setImageActionId(image.id);
    setError('');

    try {
      const response = await setMainProductImage(productId, image.id);
      const data = unwrapApiData<ProductFormData>(response);

      setProduct(data);
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageActionId(null);
    }
  }

  async function handleDeleteImage(image: ProductFormImage) {
    if (!image.id) {
      setError('Ảnh không hợp lệ.');
      return;
    }

    if (isLocked || isDeleted) {
      setError('Sản phẩm không thể chỉnh sửa ảnh.');
      return;
    }

    const ok = window.confirm(
      'Bạn có chắc muốn xóa ảnh này không? Nếu biến thể đang dùng ảnh này thì ảnh biến thể sẽ bị bỏ liên kết.',
    );

    if (!ok) return;

    setImageActionId(image.id);
    setError('');

    try {
      const response = await deleteProductImage(productId, image.id);
      const data = unwrapApiData<ProductFormData>(response);

      setProduct(data);
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageActionId(null);
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
                  Cập nhật thông tin cơ bản, trạng thái bán hàng và hình ảnh của
                  sản phẩm.
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

                    {selectedCategoryLabel ? (
                      <small className="product-category-message success">
                        Đã chọn: {selectedCategoryLabel}
                      </small>
                    ) : null}

                    {categoryError ? (
                      <small className="product-category-message error">
                        {categoryError}
                      </small>
                    ) : null}

                    {!isLocked && !isDeleted ? (
                      <div className="product-category-suggestion-box">
                        <div className="product-category-suggestion-head">
                          <strong>Gợi ý danh mục</strong>
                          {suggestionLoading ? (
                            <span>Đang phân tích...</span>
                          ) : null}
                        </div>

                        {suggestionError ? (
                          <small className="product-category-message error">
                            {suggestionError}
                          </small>
                        ) : null}

                        {!suggestionLoading && suggestionMessage ? (
                          <small className="product-category-message">
                            {suggestionMessage}
                          </small>
                        ) : null}

                        {categorySuggestions.length > 0 ? (
                          <div className="product-category-suggestion-list">
                            {categorySuggestions.map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion.categoryId}
                                className={
                                  String(suggestion.categoryId) === categoryId
                                    ? 'product-category-suggestion-item active'
                                    : 'product-category-suggestion-item'
                                }
                                onClick={() =>
                                  handleSelectCategory(suggestion.categoryId)
                                }
                              >
                                <span>
                                  {suggestion.parentName
                                    ? `${suggestion.parentName} > `
                                    : ''}
                                  {suggestion.categoryName}
                                </span>

                                <small>
                                  {getSuggestionLevelText(suggestion.level)} ·{' '}
                                  {suggestion.confidence}%
                                </small>
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {categorySuggestions.length === 0 &&
                        parentFallbacks.length > 0 ? (
                          <div className="product-category-parent-fallbacks">
                            {parentFallbacks.map((parent) => (
                              <div
                                className="product-category-parent-fallback"
                                key={parent.parentId}
                              >
                                <p>
                                  Có vẻ sản phẩm thuộc nhóm{' '}
                                  <b>{parent.parentName}</b>. Chọn cụ thể hơn:
                                </p>

                                <div>
                                  {parent.children.map((child) => (
                                    <button
                                      type="button"
                                      key={child.categoryId}
                                      onClick={() =>
                                        handleSelectCategory(child.categoryId)
                                      }
                                    >
                                      {child.categoryName}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
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

            <div className="product-form-section">
              <div className="product-image-manager-head">
                <div>
                  <h2>Ảnh sản phẩm</h2>
                  <p>
                    Đã có {currentImages.length}/{MAX_PRODUCT_IMAGES} ảnh.
                    Chọn ảnh chính để hiển thị trên card sản phẩm.
                  </p>
                </div>

                {!isLocked && !isDeleted && remainingImageSlots > 0 ? (
                  <label className="mochi-btn mochi-btn-outline product-image-add-btn">
                    {imageUploading
                      ? 'Đang tải ảnh...'
                      : `Thêm ảnh (${remainingImageSlots} còn lại)`}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={imageUploading}
                      onChange={handleAddImages}
                    />
                  </label>
                ) : null}
              </div>

              {currentImages.length > 0 ? (
                <div className="product-preview-grid">
                  {currentImages.map((image, index) => {
                    const isMain = Boolean(image.isMain) || (
                      !currentImages.some((item) => item.isMain) && index === 0
                    );
                    const isActionLoading = imageActionId === image.id;

                    return (
                      <div
                        className={
                          isMain
                            ? 'product-preview-item is-main'
                            : 'product-preview-item'
                        }
                        key={image.id ?? image.url}
                      >
                        <img src={image.url} alt={`Ảnh ${index + 1}`} />

                        {isMain ? <span>Ảnh chính</span> : null}

                        <div className="product-preview-actions">
                          {!isMain ? (
                            <button
                              type="button"
                              className="product-preview-action"
                              disabled={imageActionsDisabled || !image.id}
                              onClick={() => handleSetMainImage(image)}
                            >
                              {isActionLoading ? '...' : 'Đặt chính'}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="product-preview-action danger"
                            disabled={imageActionsDisabled || !image.id}
                            onClick={() => handleDeleteImage(image)}
                          >
                            {isActionLoading ? '...' : 'Xóa'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="product-empty-preview">
                  <p>Chưa có ảnh sản phẩm</p>
                </div>
              )}
            </div>
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