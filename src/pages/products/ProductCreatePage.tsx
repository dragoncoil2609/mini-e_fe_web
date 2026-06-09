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
  getSellerCategoryOptions,
  suggestProductCategories,
  type CategoryParentFallback,
  type CategorySuggestionData,
  type CategorySuggestionItem,
  type SellerCategoryOption,
} from '../../api/categories.api';

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ProductCreatePage.css';

const MAX_PRODUCT_IMAGES = 10;

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

function getSuggestionLevelText(level: string) {
  if (level === 'strong') return 'Rất phù hợp';
  if (level === 'medium') return 'Có thể phù hợp';
  return 'Tham khảo';
}

function moveMainImageToFirst(files: File[], mainIndex: number) {
  if (!files.length) return [];

  const safeIndex =
    mainIndex >= 0 && mainIndex < files.length ? mainIndex : 0;

  const mainFile = files[safeIndex];

  return [
    mainFile,
    ...files.filter((_, index) => index !== safeIndex),
  ];
}

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const previewUrls = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file));
  }, [images]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError('');

        const response = await getSellerCategoryOptions();

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

  useEffect(() => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (searchText.length < 3) {
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
  }, [title, description]);

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  }

  function handleSelectCategory(nextCategoryId: number) {
    setCategoryId(String(nextCategoryId));
    setCategoryError('');
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    event.target.value = '';

    if (!validFiles.length) {
      return;
    }

    const nextImages = [...images, ...validFiles].slice(0, MAX_PRODUCT_IMAGES);

    if (images.length + validFiles.length > MAX_PRODUCT_IMAGES) {
      setError(`Sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
    } else {
      setError('');
    }

    setImages(nextImages);

    if (!nextImages[mainImageIndex]) {
      setMainImageIndex(0);
    }
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);

      setMainImageIndex((currentMain) => {
        if (!next.length) return 0;
        if (currentMain === index) return 0;
        if (currentMain > index) return currentMain - 1;
        return currentMain >= next.length ? 0 : currentMain;
      });

      return next;
    });
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

    if (images.length > MAX_PRODUCT_IMAGES) {
      setError(`Sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const orderedImages = moveMainImageToFirst(images, mainImageIndex);

      const response = await createProduct({
        title: cleanTitle,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        price: numericPrice,
        categoryId: categoryId ? Number(categoryId) : null,
        images: orderedImages,
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
                    placeholder="Ví dụ: Tã Bỉm Gooby Hàn Quốc size M"
                    maxLength={180}
                  />
                </div>

                <div className="mochi-form-group">
                  <label className="mochi-label">Slug</label>
                  <input
                    className="mochi-input"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    placeholder="ta-bim-gooby-han-quoc-size-m"
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

                    <div className="product-category-suggestion-box">
                      <div className="product-category-suggestion-head">
                        <strong>Gợi ý danh mục</strong>
                        {suggestionLoading ? <span>Đang phân tích...</span> : null}
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
                <small>
                  Tối đa {MAX_PRODUCT_IMAGES} ảnh, mỗi ảnh tối đa 2MB. Bấm vào
                  ảnh để chọn ảnh chính.
                </small>
              </label>

              {previewUrls.length > 0 ? (
                <>
                  <small className="product-upload-note">
                    Đã chọn {images.length}/{MAX_PRODUCT_IMAGES} ảnh. Ảnh chính
                    sẽ được gửi lên BE đầu tiên để tránh chọn sai ảnh main.
                  </small>

                  <div className="product-preview-grid">
                    {previewUrls.map((url, index) => {
                      const isMain = index === mainImageIndex;

                      return (
                        <div
                          className={
                            isMain
                              ? 'product-preview-item is-main'
                              : 'product-preview-item'
                          }
                          key={`${url}-${index}`}
                        >
                          <button
                            type="button"
                            className="product-preview-image-button"
                            onClick={() => setMainImageIndex(index)}
                            title="Chọn làm ảnh chính"
                          >
                            <img src={url} alt={`Ảnh ${index + 1}`} />
                          </button>

                          {isMain ? <span>Ảnh chính</span> : null}

                          <div className="product-preview-actions">
                            {!isMain ? (
                              <button
                                type="button"
                                className="product-preview-action"
                                onClick={() => setMainImageIndex(index)}
                              >
                                Đặt chính
                              </button>
                            ) : null}

                            <button
                              type="button"
                              className="product-preview-action danger"
                              onClick={() => handleRemoveImage(index)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
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