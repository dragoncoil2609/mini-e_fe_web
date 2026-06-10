import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBold,
  FiBox,
  FiCheckCircle,
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
  FiSave,
  FiSmile,
  FiTag,
  FiType,
  FiUnderline,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';

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

import bunnyImg from '../../assets/brand/bunny_bear_original.png';

import './style/ProductEditPage.css';

const MAX_PRODUCT_IMAGES = 10;
const MAX_TITLE_LENGTH = 180;
const MAX_DETAIL_DESCRIPTION_LENGTH = 2000;

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
  const raw = error?.response?.data?.message ?? error?.message;

  if (Array.isArray(raw)) {
    return raw.join(', ');
  }

  return raw || 'Không thể cập nhật sản phẩm. Vui lòng thử lại.';
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
  const suggestRequestRef = useRef(0);

  const [product, setProduct] = useState<ProductFormData | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
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
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageActionId, setImageActionId] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const productId = Number(id);
  const isLocked = status === 'LOCKED';
  const isDeleted = Boolean(product?.deletedAt);
  const currentImages = normalizeImages(product?.images);
  const remainingImageSlots = Math.max(0, MAX_PRODUCT_IMAGES - currentImages.length);
  const imageActionsDisabled =
    isLocked || isDeleted || imageUploading || Boolean(imageActionId);

  const mainImage =
    currentImages.find((image) => image.isMain) || currentImages[0] || null;

  const currentPreviewImage =
    currentImages[previewIndex]?.url || mainImage?.url || '';

  const thumbWindowSize = 5;
  const thumbStartIndex = Math.max(
    0,
    Math.min(
      previewIndex - 2,
      Math.max(0, currentImages.length - thumbWindowSize),
    ),
  );

  const visibleThumbs = currentImages.slice(
    thumbStartIndex,
    thumbStartIndex + thumbWindowSize,
  );

  const hasSuggestionContent =
    suggestionLoading ||
    Boolean(suggestionError) ||
    Boolean(suggestionMessage) ||
    categorySuggestions.length > 0 ||
    parentFallbacks.length > 0;

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
      setCategoryId(data.categoryId ? String(data.categoryId) : '');
      setPrice(String(data.price ?? ''));
      setDetailDescription(data.description ?? '');
      setStatus(data.status ?? 'ACTIVE');
      setPreviewIndex(0);
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
      const data = unwrapApiData<SellerCategoryOption[]>(response);

      setCategories(Array.isArray(data) ? data : []);
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

  async function fetchCategorySuggestions(forceShow = false) {
    const cleanTitle = title.trim();
    const cleanDescription = detailDescription.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (isLocked || isDeleted) return;

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
    void loadProduct();
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const cleanTitle = title.trim();
    const cleanDescription = detailDescription.trim();
    const searchText = `${cleanTitle} ${cleanDescription}`.trim();

    if (isLocked || isDeleted || searchText.length < 3) {
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
  }, [title, detailDescription, isLocked, isDeleted]);

  function handleSelectCategory(nextCategoryId: number) {
    setCategoryId(String(nextCategoryId));
    setCategoryError('');
  }

  function handlePrevPreview() {
    setPreviewIndex((current) => Math.max(0, current - 1));
  }

  function handleNextPreview() {
    setPreviewIndex((current) =>
      Math.min(currentImages.length - 1, current + 1),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked || isDeleted) {
      setError('Sản phẩm này không thể chỉnh sửa.');
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
    setSuccess('');

    try {
      const response = await updateProduct(productId, {
        title: cleanTitle,
        slug: slug.trim() || undefined,
        description: detailDescription.trim() || undefined,
        price: numericPrice,
        categoryId: categoryId ? Number(categoryId) : null,
        status,
      } as any);

      const data = unwrapApiData<ProductFormData>(response);

      if (data?.id) {
        setProduct(data);
      } else {
        await loadProduct();
      }

      setSuccess('Cập nhật sản phẩm thành công.');
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

    if (!validFiles.length) return;

    if (isLocked || isDeleted) {
      setError('Sản phẩm này không thể chỉnh sửa ảnh.');
      return;
    }

    if (remainingImageSlots <= 0) {
      setError(`Sản phẩm chỉ được tối đa ${MAX_PRODUCT_IMAGES} ảnh.`);
      return;
    }

    const uploadFiles = validFiles.slice(0, remainingImageSlots);

    if (validFiles.length > remainingImageSlots) {
      setError(
        `Chỉ còn ${remainingImageSlots} vị trí ảnh, hệ thống sẽ tải lên ${remainingImageSlots} ảnh đầu tiên.`,
      );
    } else {
      setError('');
    }

    setSuccess('');
    setImageUploading(true);

    try {
      const response = await addProductImages(productId, uploadFiles);
      const data = unwrapApiData<ProductFormData>(response);

      if (data?.id) {
        setProduct(data);
      } else {
        await loadProduct();
      }

      setSuccess('Thêm ảnh sản phẩm thành công.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSetMainImage(image: ProductFormImage, index: number) {
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
    setSuccess('');

    try {
      const response = await setMainProductImage(productId, image.id);
      const data = unwrapApiData<ProductFormData>(response);

      if (data?.id) {
        setProduct(data);
      } else {
        await loadProduct();
      }

      setPreviewIndex(index);
      setSuccess('Đã đặt ảnh chính.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageActionId(null);
    }
  }

  async function handleDeleteImage(image: ProductFormImage, index: number) {
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
    setSuccess('');

    try {
      const response = await deleteProductImage(productId, image.id);
      const data = unwrapApiData<ProductFormData>(response);

      if (data?.id) {
        setProduct(data);
      } else {
        await loadProduct();
      }

      setPreviewIndex((current) => {
        const nextLength = Math.max(0, currentImages.length - 1);
        if (nextLength === 0) return 0;
        if (current === index) return Math.max(0, current - 1);
        if (current > index) return current - 1;
        return current >= nextLength ? nextLength - 1 : current;
      });

      setSuccess('Xóa ảnh thành công.');
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setImageActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="mochi-page product-form-page">
        <div className="mochi-container product-form-container">
          <div className="product-state-card">Đang tải sản phẩm...</div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="mochi-page product-form-page">
        <div className="mochi-container product-form-container">
          <div className="product-alert product-alert-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>

          <Link to="/shops/me/products" className="product-secondary-back">
            <FiArrowLeft />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
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
          <b>Sửa sản phẩm</b>
        </div>

        <div className="product-page-heading">
          <div>
            <h1>Sửa sản phẩm</h1>
            <p>Cập nhật thông tin sản phẩm và hình ảnh cho cửa hàng của bạn</p>
          </div>
        </div>

        {error ? (
          <div className="product-alert product-alert-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="product-alert product-alert-success">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        ) : null}

        {isLocked ? (
          <div className="product-alert product-alert-warning">
            <FiAlertCircle />
            <span>
              Sản phẩm này đã bị admin khóa. Shop chỉ có thể xem, không thể chỉnh sửa.
            </span>
          </div>
        ) : null}

        {isDeleted ? (
          <div className="product-alert product-alert-warning">
            <FiAlertCircle />
            <span>
              Sản phẩm này đã bị xóa mềm. Không thể chỉnh sửa lại dữ liệu.
            </span>
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
                      disabled={isLocked || isDeleted}
                      onChange={(event) => setTitle(event.target.value)}
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
                    disabled={isLocked || isDeleted}
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
                      disabled={isLocked || isDeleted || categoryLoading}
                      onChange={(event) => setCategoryId(event.target.value)}
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

                    {!isLocked && !isDeleted ? (
                      <button
                        type="button"
                        className="product-suggest-btn"
                        onClick={() => void fetchCategorySuggestions(true)}
                        disabled={suggestionLoading}
                      >
                        <FiTag />
                        {suggestionLoading ? 'Đang gợi ý...' : 'Gợi ý danh mục'}
                      </button>
                    ) : null}
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

              <div className="product-grid product-grid-2">
                <div className="product-field">
                  <label>
                    Giá bán <b>*</b>
                  </label>

                  <div className="product-price-wrap">
                    <input
                      value={price}
                      disabled={isLocked || isDeleted}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                    <span>đ</span>
                  </div>
                </div>

                <div className="product-field">
                  <label>Trạng thái</label>

                  <select
                    value={status}
                    disabled={isLocked || isDeleted}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                  </select>
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
                      disabled={isLocked || isDeleted}
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
              <div className="product-section-head product-section-head-between">
                <div>
                  <span className="product-step-badge">2</span>
                  <h2>Hình ảnh sản phẩm</h2>
                </div>

                {!isLocked && !isDeleted && remainingImageSlots > 0 ? (
                  <label className="product-add-image-btn">
                    <FiUploadCloud />
                    {imageUploading
                      ? 'Đang tải ảnh...'
                      : `Thêm ảnh (${remainingImageSlots})`}
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
                <div className="product-image-thumb-grid">
                  {currentImages.map((image, index) => {
                    const isMain =
                      Boolean(image.isMain) ||
                      (!currentImages.some((item) => item.isMain) && index === 0);
                    const isActionLoading = imageActionId === image.id;

                    return (
                      <div
                        key={image.id ?? image.url}
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
                          <img src={image.url} alt={`Ảnh ${index + 1}`} />
                        </button>

                        {isMain ? (
                          <span className="product-image-main-badge">
                            Ảnh đại diện
                          </span>
                        ) : null}

                        {!isLocked && !isDeleted ? (
                          <button
                            type="button"
                            className="product-image-remove-btn"
                            disabled={imageActionsDisabled || !image.id}
                            onClick={() => handleDeleteImage(image, index)}
                          >
                            <FiX />
                          </button>
                        ) : null}

                        <div className="product-image-item-actions">
                          {!isMain && !isLocked && !isDeleted ? (
                            <button
                              type="button"
                              disabled={imageActionsDisabled || !image.id}
                              onClick={() => handleSetMainImage(image, index)}
                            >
                              {isActionLoading ? 'Đang xử lý...' : 'Đặt ảnh chính'}
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
                    visibleThumbs.map((image, index) => {
                      const actualIndex = thumbStartIndex + index;

                      return (
                        <button
                          type="button"
                          key={image.id ?? image.url}
                          className={
                            actualIndex === previewIndex
                              ? 'product-preview-thumb active'
                              : 'product-preview-thumb'
                          }
                          onClick={() => setPreviewIndex(actualIndex)}
                        >
                          <img src={image.url} alt={`thumb-${actualIndex + 1}`} />
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
                    previewIndex >= currentImages.length - 1 ||
                    !currentImages.length
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
                  <b>{currentImages.length} ảnh</b>
                </div>

                <div className="product-side-info-item">
                  <span>Trạng thái</span>
                  <b>
                    {status === 'ACTIVE'
                      ? 'Đang bán'
                      : status === 'OUT_OF_STOCK'
                        ? 'Hết hàng'
                        : status === 'LOCKED'
                          ? 'Đã khóa'
                          : status}
                  </b>
                </div>

                <div className="product-side-info-item">
                  <span>Mô tả</span>
                  <b>{detailDescription.trim() || 'Chưa có mô tả.'}</b>
                </div>
              </div>

              <div className="product-stock-box">
                <div className="product-stock-box-left">
                  <div className="product-stock-icon">
                    <FiPackage />
                  </div>
                  <div>
                    <strong>Hình ảnh</strong>
                    <span>
                      Đang có {currentImages.length}/{MAX_PRODUCT_IMAGES} ảnh
                    </span>
                  </div>
                </div>

                <em>{currentImages.length}</em>
              </div>

              <button
                type="submit"
                className="product-primary-submit"
                disabled={submitting || isLocked || isDeleted}
              >
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                <FiSave />
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