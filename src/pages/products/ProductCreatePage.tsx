import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBold,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiMaximize,
  FiMenu,
  FiMinus,
  FiPackage,
  FiSmile,
  FiTag,
  FiType,
  FiUnderline,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';

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
const MAX_TITLE_LENGTH = 180;
const MAX_DETAIL_DESCRIPTION_LENGTH = 2000;

type CategorySelectOption = {
  id: number;
  name: string;
  label: string;
};

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getApiMessage(error: any) {
  const raw = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(raw)) {
    return raw.join(', ');
  }

  return raw || 'Không thể tạo sản phẩm. Vui lòng thử lại.';
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

function formatMoney(value: string | number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '0đ';
  }

  return `${numericValue.toLocaleString('vi-VN')}đ`;
}

function getSuggestionLevelText(level: string) {
  if (level === 'strong') return 'Rất phù hợp';
  if (level === 'medium') return 'Có thể phù hợp';
  return 'Tham khảo';
}

function moveMainImageToFirst(files: File[], mainIndex: number) {
  if (!files.length) return [];

  const safeIndex = mainIndex >= 0 && mainIndex < files.length ? mainIndex : 0;
  const mainFile = files[safeIndex];

  return [mainFile, ...files.filter((_, index) => index !== safeIndex)];
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const suggestRequestRef = useRef(0);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [detailDescription, setDetailDescription] = useState('');

  const [images, setImages] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);

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
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);

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
        ?.label ?? 'Chưa chọn'
    );
  }, [categoryOptions, categoryId]);

  const previewUrls = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file));
  }, [images]);

  const currentPreviewImage = previewUrls[previewIndex] || previewUrls[0] || '';

  const thumbWindowSize = 5;
  const thumbStartIndex = Math.max(
    0,
    Math.min(
      previewIndex - 2,
      Math.max(0, previewUrls.length - thumbWindowSize),
    ),
  );

  const visibleThumbs = previewUrls.slice(
    thumbStartIndex,
    thumbStartIndex + thumbWindowSize,
  );

  const hasSuggestionContent =
    suggestionLoading ||
    Boolean(suggestionError) ||
    Boolean(suggestionMessage) ||
    categorySuggestions.length > 0 ||
    parentFallbacks.length > 0;

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
        const data = unwrapApiData<SellerCategoryOption[]>(response);

        if (!mounted) return;

        setCategories(Array.isArray(data) ? data : []);
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

  async function fetchCategorySuggestions(forceShow = false) {
    const cleanTitle = title.trim();
    const cleanDescription = detailDescription.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (searchText.length < 3) {
      setCategorySuggestions([]);
      setParentFallbacks([]);
      setSuggestionError('');
      setSuggestionLoading(false);

      if (forceShow) {
        setShowSuggestionBox(true);
        setSuggestionMessage('Hãy nhập tên hoặc mô tả sản phẩm để gợi ý danh mục.');
      } else {
        setShowSuggestionBox(false);
        setSuggestionMessage('');
      }

      return;
    }

    const requestId = ++suggestRequestRef.current;

    try {
      setSuggestionLoading(true);
      setSuggestionError('');

      const response = await suggestProductCategories({
        title: cleanTitle,
        description: cleanDescription,
        limit: 6,
      });

      if (requestId !== suggestRequestRef.current) return;

      const data = unwrapApiData<CategorySuggestionData>(response);

      setCategorySuggestions(data?.items ?? []);
      setParentFallbacks(data?.parentFallbacks ?? []);
      setSuggestionMessage(data?.message ?? '');
      setShowSuggestionBox(true);
    } catch (err: any) {
      if (requestId !== suggestRequestRef.current) return;

      setCategorySuggestions([]);
      setParentFallbacks([]);
      setSuggestionMessage('');
      setSuggestionError(
        err?.response?.data?.message ||
          err?.message ||
          'Không gợi ý được danh mục.',
      );
      setShowSuggestionBox(true);
    } finally {
      if (requestId === suggestRequestRef.current) {
        setSuggestionLoading(false);
      }
    }
  }

  useEffect(() => {
    const cleanTitle = title.trim();
    const cleanDescription = detailDescription.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (searchText.length < 3) {
      setCategorySuggestions([]);
      setParentFallbacks([]);
      setSuggestionMessage('');
      setSuggestionError('');
      setSuggestionLoading(false);
      setShowSuggestionBox(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchCategorySuggestions(false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, detailDescription]);

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

    if (!validFiles.length) return;

    const nextImages = [...images, ...validFiles].slice(0, MAX_PRODUCT_IMAGES);

    if (images.length + validFiles.length > MAX_PRODUCT_IMAGES) {
      setError(`Sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
    } else {
      setError('');
    }

    setImages(nextImages);

    if (!previewUrls.length) {
      setMainImageIndex(0);
      setPreviewIndex(0);
    } else {
      const nextLastIndex = Math.max(0, nextImages.length - 1);

      if (mainImageIndex >= nextImages.length) {
        setMainImageIndex(0);
      }

      if (previewIndex >= nextImages.length) {
        setPreviewIndex(nextLastIndex);
      }
    }
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);

      setMainImageIndex((current) => {
        if (!next.length) return 0;
        if (current === index) return 0;
        if (current > index) return current - 1;
        return current >= next.length ? 0 : current;
      });

      setPreviewIndex((current) => {
        if (!next.length) return 0;
        if (current === index) return Math.max(0, current - 1);
        if (current > index) return current - 1;
        return current >= next.length ? next.length - 1 : current;
      });

      return next;
    });
  }

  function handlePrevPreview() {
    setPreviewIndex((current) => Math.max(0, current - 1));
  }

  function handleNextPreview() {
    setPreviewIndex((current) => Math.min(previewUrls.length - 1, current + 1));
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
      const orderedImages = moveMainImageToFirst(images, mainImageIndex);

      const response = await createProduct({
        title: cleanTitle,
        slug: slug.trim() || undefined,
        description: detailDescription.trim() || undefined,
        price: numericPrice,
        categoryId: categoryId ? Number(categoryId) : null,
        images: orderedImages,
      } as any);

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
      <div className="mochi-container product-form-container">
        <div className="product-breadcrumb">
          <Link to="/home">Trang chủ</Link>
          <span>›</span>
          <Link to="/account">Tài khoản</Link>
          <span>›</span>
          <Link to="/shops/me/products">Quản lý sản phẩm</Link>
          <span>›</span>
          <b>Thêm sản phẩm</b>
        </div>

        <div className="product-page-heading">
          <div>
            <h1>Thêm sản phẩm mới</h1>
            <p>Điền đầy đủ thông tin để tạo sản phẩm mới cho cửa hàng của bạn</p>
          </div>
        </div>

        {error ? (
          <div className="product-alert product-alert-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="product-create-layout" onSubmit={handleSubmit}>
          <div className="product-create-main">
            <section className="product-card">
              <div className="product-section-head">
                <span className="product-step-badge">1</span>
                <h2>Thông tin cơ bản</h2>
              </div>

              <div className="product-grid product-grid-2">
                <div className="product-field">
                  <label>
                    Tên sản phẩm <b>*</b>
                  </label>

                  <div className="product-counter-input">
                    <input
                      value={title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      placeholder="Nhập tên sản phẩm"
                      maxLength={MAX_TITLE_LENGTH}
                    />
                    <small>
                      {title.length}/{MAX_TITLE_LENGTH}
                    </small>
                  </div>
                </div>

                <div className="product-field">
                  <label>Slug tự động (tùy chọn)</label>
                  <input
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    placeholder="duong-dan-san-pham"
                    maxLength={220}
                  />
                </div>
              </div>

              <div className="product-grid product-grid-category">
                <div className="product-field">
                  <label>
                    Danh mục <b>*</b>
                  </label>

                  <div className="product-category-inline">
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      disabled={categoryLoading}
                    >
                      <option value="">
                        {categoryLoading ? 'Đang tải danh mục...' : 'Chọn danh mục'}
                      </option>

                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="product-suggest-btn"
                      onClick={() => void fetchCategorySuggestions(true)}
                      disabled={suggestionLoading}
                    >
                      <FiTag />
                      {suggestionLoading ? 'Đang gợi ý...' : 'Gợi ý danh mục'}
                    </button>
                  </div>

                  {categoryError ? (
                    <small className="product-field-message error">
                      {categoryError}
                    </small>
                  ) : null}
                </div>
              </div>

              {showSuggestionBox && hasSuggestionContent ? (
                <div className="product-suggestion-box">
                  <div className="product-suggestion-head">
                    <div className="product-suggestion-title">
                      <FiTag />
                      <strong>Gợi ý danh mục cho bạn</strong>
                    </div>

                    <button
                      type="button"
                      className="product-suggestion-close"
                      onClick={() => setShowSuggestionBox(false)}
                    >
                      <FiX />
                    </button>
                  </div>

                  {suggestionError ? (
                    <p className="product-suggestion-message error">
                      {suggestionError}
                    </p>
                  ) : null}

                  {!suggestionError && suggestionMessage ? (
                    <p className="product-suggestion-message">
                      {suggestionMessage}
                    </p>
                  ) : null}

                  {categorySuggestions.length > 0 ? (
                    <div className="product-suggestion-chip-list">
                      {categorySuggestions.map((suggestion) => (
                        <button
                          key={suggestion.categoryId}
                          type="button"
                          className={
                            String(suggestion.categoryId) === categoryId
                              ? 'product-suggestion-chip active'
                              : 'product-suggestion-chip'
                          }
                          onClick={() =>
                            handleSelectCategory(suggestion.categoryId)
                          }
                        >
                          <FiTag />
                          <span>{suggestion.categoryName}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {categorySuggestions.length === 0 &&
                  parentFallbacks.length > 0 ? (
                    <div className="product-suggestion-fallbacks">
                      {parentFallbacks.map((parent) => (
                        <div
                          className="product-suggestion-fallback"
                          key={parent.parentId}
                        >
                          <p>
                            Nhóm gần đúng: <b>{parent.parentName}</b>
                          </p>

                          <div className="product-suggestion-chip-list">
                            {parent.children.map((child) => (
                              <button
                                key={child.categoryId}
                                type="button"
                                className={
                                  String(child.categoryId) === categoryId
                                    ? 'product-suggestion-chip active'
                                    : 'product-suggestion-chip'
                                }
                                onClick={() =>
                                  handleSelectCategory(child.categoryId)
                                }
                              >
                                <FiTag />
                                <span>{child.categoryName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {categorySuggestions.length > 0 ? (
                    <div className="product-suggestion-meta">
                      {categorySuggestions.slice(0, 3).map((item) => (
                        <span key={`${item.categoryId}-meta`}>
                          {item.categoryName} · {getSuggestionLevelText(item.level)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="product-grid product-grid-1">
                <div className="product-field">
                  <label>
                    Giá bán <b>*</b>
                  </label>

                  <div className="product-price-wrap">
                    <input
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                    <span>đ</span>
                  </div>
                </div>
              </div>

              <div className="product-field">
                <label>Mô tả chi tiết</label>

                <div className="product-editor">
                  <div className="product-editor-toolbar">
                    <button type="button">
                      <FiBold />
                    </button>
                    <button type="button">
                      <FiItalic />
                    </button>
                    <button type="button">
                      <FiUnderline />
                    </button>
                    <span className="divider" />
                    <button type="button">
                      <FiList />
                    </button>
                    <button type="button">
                      <FiMenu />
                    </button>
                    <button type="button">
                      <FiType />
                    </button>
                    <span className="divider" />
                    <button type="button">
                      <FiArrowRight />
                    </button>
                    <button type="button">
                      <FiLink />
                    </button>
                    <button type="button">
                      <FiImage />
                    </button>
                    <button type="button">
                      <FiSmile />
                    </button>
                    <button type="button">
                      <FiMinus />
                    </button>
                    <button type="button">
                      <FiMaximize />
                    </button>
                  </div>

                  <div className="product-counter-textarea detail">
                    <textarea
                      value={detailDescription}
                      onChange={(event) =>
                        setDetailDescription(event.target.value)
                      }
                      placeholder="Nhập mô tả chi tiết sản phẩm..."
                      maxLength={MAX_DETAIL_DESCRIPTION_LENGTH}
                    />
                    <small>
                      {detailDescription.length}/{MAX_DETAIL_DESCRIPTION_LENGTH}
                    </small>
                  </div>
                </div>
              </div>
            </section>

            <section className="product-card">
              <div className="product-section-head">
                <span className="product-step-badge">2</span>
                <h2>Hình ảnh sản phẩm</h2>
              </div>

              <div className="product-image-layout">
                <label className="product-upload-panel">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImagesChange}
                  />

                  <FiUploadCloud className="upload-icon" />
                  <strong>Kéo thả hình ảnh vào đây</strong>
                  <span>hoặc</span>
                  <em>Chọn ảnh</em>
                  <small>
                    Hỗ trợ: JPG, PNG, WEBP (tối đa 5MB/ảnh)
                    <br />
                    Tối đa {MAX_PRODUCT_IMAGES} ảnh
                  </small>
                </label>

                <div className="product-image-list-wrap">
                  <h3>Danh sách ảnh ({images.length}/{MAX_PRODUCT_IMAGES})</h3>

                  {previewUrls.length > 0 ? (
                    <div className="product-image-thumb-grid">
                      {previewUrls.map((url, index) => {
                        const isMain = index === mainImageIndex;

                        return (
                          <div
                            key={`${url}-${index}`}
                            className={
                              isMain
                                ? 'product-image-thumb-item is-main'
                                : 'product-image-thumb-item'
                            }
                          >
                            <button
                              type="button"
                              className="product-image-thumb-preview"
                              onClick={() => setPreviewIndex(index)}
                            >
                              <img src={url} alt={`Ảnh ${index + 1}`} />
                            </button>

                            {isMain ? (
                              <span className="product-image-main-badge">
                                Ảnh đại diện
                              </span>
                            ) : null}

                            <button
                              type="button"
                              className="product-image-remove-btn"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <FiX />
                            </button>

                            <div className="product-image-item-actions">
                              {!isMain ? (
                                <button
                                  type="button"
                                  onClick={() => setMainImageIndex(index)}
                                >
                                  Đặt ảnh chính
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="product-image-empty">
                      <img src={bunnyImg} alt="empty" />
                      <p>Chưa có ảnh nào được chọn</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="product-create-side">
            <section className="product-side-card">
              <h2>Xem trước sản phẩm</h2>

              <div className="product-preview-hero">
                {currentPreviewImage ? (
                  <img src={currentPreviewImage} alt="Xem trước sản phẩm" />
                ) : (
                  <img src={bunnyImg} alt="placeholder" />
                )}
              </div>

              <div className="product-preview-thumbs-row">
                <button
                  type="button"
                  className="product-preview-nav"
                  onClick={handlePrevPreview}
                  disabled={previewIndex <= 0}
                >
                  <FiChevronLeft />
                </button>

                <div className="product-preview-thumbs">
                  {visibleThumbs.length > 0 ? (
                    visibleThumbs.map((url, index) => {
                      const actualIndex = thumbStartIndex + index;

                      return (
                        <button
                          type="button"
                          key={`${url}-${actualIndex}`}
                          className={
                            actualIndex === previewIndex
                              ? 'product-preview-thumb active'
                              : 'product-preview-thumb'
                          }
                          onClick={() => setPreviewIndex(actualIndex)}
                        >
                          <img src={url} alt={`thumb-${actualIndex + 1}`} />
                        </button>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      className="product-preview-thumb active is-placeholder"
                    >
                      <img src={bunnyImg} alt="placeholder-thumb" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="product-preview-nav"
                  onClick={handleNextPreview}
                  disabled={
                    previewIndex >= previewUrls.length - 1 || !previewUrls.length
                  }
                >
                  <FiChevronRight />
                </button>
              </div>
            </section>

            <section className="product-side-card">
              <h2>Thông tin sản phẩm</h2>

              <div className="product-side-info-list">
                <div className="product-side-info-item">
                  <span>Tên sản phẩm</span>
                  <b>{title.trim() || 'Chưa nhập'}</b>
                </div>

                <div className="product-side-info-item">
                  <span>Danh mục</span>
                  <b>{selectedCategoryLabel}</b>
                </div>

                <div className="product-side-info-item">
                  <span>Giá bán</span>
                  <strong>{formatMoney(price)}</strong>
                </div>

                <div className="product-side-info-item">
                  <span>Số ảnh</span>
                  <b>{images.length} ảnh</b>
                </div>

                <div className="product-side-info-item">
                  <span>Mô tả</span>
                  <b>{detailDescription.trim() || 'Chưa có mô tả.'}</b>
                </div>
              </div>

              <button
                type="submit"
                className="product-primary-submit"
                disabled={submitting}
              >
                {submitting ? 'Đang tạo...' : 'Tiếp tục'}
                <FiArrowRight />
              </button>

              <Link to="/shops/me/products" className="product-secondary-back">
                <FiArrowLeft />
                Quay lại danh sách
              </Link>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}