import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiGift,
  FiTruck,
  FiRefreshCcw,
  FiShield,
  FiHeadphones,
  FiHome,
  FiCheckCircle,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

import {
  getProductVariants,
  getPublicProductDetail,
} from "../../api/products.api";
import { addItem } from "../../api/cart.api";
import { getProductReviews } from "../../api/reviews.api";
import type { ProductReview } from "../../api/types";
import {
  addFavoriteProduct,
  recordProductEvent,
  removeFavoriteProduct,
} from "../../api/recommendations.api";

import bunnyImg from "../../assets/brand/bunny_bear_original.png";

import "./style/ProductDetailPage.css";

type ProductImage = {
  id?: number;
  url: string;
  alt?: string | null;
  isMain?: boolean;
};

type ProductView = {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number | string;
  compareAtPrice?: number | string | null;
  stock?: number | string;
  sold?: number | string;
  status?: string;
  shopId?: number;
  categoryId?: number | null;
  category?: {
    id?: number;
    name?: string;
    title?: string;
  } | null;
  shop?: {
    id?: number;
    name?: string;
  } | null;
  images?: ProductImage[];
  mainImageUrl?: string | null;
  imageUrl?: string | null;
  isFavorite?: boolean | 0 | 1 | "0" | "1";
  variants?: VariantRow[];
};

type VariantRow = {
  id: number;
  productId?: number;
  sku?: string;
  name?: string;
  price?: string | number | null;
  stock?: number | string;
  imageId?: number | null;
  options?: {
    option: string;
    value: string | null;
  }[];

  optionName1?: string | null;
  optionName2?: string | null;
  optionName3?: string | null;
  optionName4?: string | null;
  optionName5?: string | null;

  value1?: string | null;
  value2?: string | null;
  value3?: string | null;
  value4?: string | null;
  value5?: string | null;
};

type ReviewSummary = {
  count: number;
  avg: number;
};

const REVIEW_LIMIT = 5;

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapApiList<T>(response: any): T[] {
  const data = unwrapApiData<any>(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function goLoginPath() {
  return "/auth/login";
}

function getApiMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Không thể tải chi tiết sản phẩm."
  );
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value?: number | string | null) {
  return new Intl.NumberFormat("vi-VN").format(toNumber(value)) + "đ";
}

function formatDate(value?: string | null) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getProductName(product?: ProductView | null) {
  return product?.title || product?.name || "Sản phẩm";
}

function getCategoryName(product?: ProductView | null) {
  return product?.category?.name || product?.category?.title || "Sản phẩm";
}

function getShopName(product?: ProductView | null) {
  return product?.shop?.name || "Mochi";
}

function getProductImages(product?: ProductView | null): ProductImage[] {
  if (!product) return [{ url: bunnyImg, isMain: true }];

  const images = product.images ?? [];

  if (images.length > 0) return images;
  if (product.mainImageUrl)
    return [{ url: product.mainImageUrl, isMain: true }];
  if (product.imageUrl) return [{ url: product.imageUrl, isMain: true }];

  return [{ url: bunnyImg, isMain: true }];
}

function getVariantImageUrl(
  productImages: ProductImage[],
  variant?: VariantRow | null,
) {
  if (!variant?.imageId) return null;

  const img = productImages.find((image) => image.id === variant.imageId);
  return img?.url ?? null;
}

function getDiscountPercent(product?: ProductView | null) {
  const price = toNumber(product?.price);
  const compareAt = toNumber(product?.compareAtPrice);

  if (!compareAt || compareAt <= price) return null;

  return Math.round((1 - price / compareAt) * 100);
}

function normalizeFavorite(value: ProductView["isFavorite"]) {
  return value === true || value === 1 || value === "1";
}

function renderReviewStars(rating: number) {
  const safe = Math.max(0, Math.min(5, Math.round(toNumber(rating))));

  return Array.from({ length: 5 }).map((_, index) =>
    index < safe ? <FaStar key={index} /> : <FaRegStar key={index} />,
  );
}

function getReviewUserName(review: ProductReview) {
  return review.user?.name || review.userNameSnapshot || "Người dùng đã xóa";
}

function getReviewAvatar(review: ProductReview) {
  return review.user?.avatarUrl || review.userAvatarSnapshot || bunnyImg;
}

function getVariantOptionMap(variant?: VariantRow | null) {
  const map: Record<string, string> = {};

  if (!variant) return map;

  if (Array.isArray(variant.options) && variant.options.length > 0) {
    variant.options.forEach((item) => {
      if (item.option && item.value) {
        map[item.option] = item.value;
      }
    });

    return map;
  }

  const legacyOptions = [
    { option: variant.optionName1 || "Phân loại 1", value: variant.value1 },
    { option: variant.optionName2 || "Phân loại 2", value: variant.value2 },
    { option: variant.optionName3 || "Phân loại 3", value: variant.value3 },
    { option: variant.optionName4 || "Phân loại 4", value: variant.value4 },
    { option: variant.optionName5 || "Phân loại 5", value: variant.value5 },
  ];

  legacyOptions.forEach((item) => {
    if (item.value) {
      map[item.option] = item.value;
    }
  });

  return map;
}

function variantMatchesOptions(
  variant: VariantRow,
  options: Record<string, string>,
) {
  const map = getVariantOptionMap(variant);

  return Object.entries(options).every(([key, value]) => map[key] === value);
}

function beautifyOptionName(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("size") || lower.includes("kích")) return "Kích thước";
  if (lower.includes("color") || lower.includes("màu")) return "Màu sắc";
  if (lower.includes("material") || lower.includes("chất")) return "Chất liệu";

  return name;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const productId = Number(id);

  const [product, setProduct] = useState<ProductView | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [activeImageUrl, setActiveImageUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");

  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [cartMessageType, setCartMessageType] = useState<"success" | "error">(
    "success",
  );

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    count: 0,
    avg: 0,
  });
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const reviewScrollBoxRef = useRef<HTMLDivElement | null>(null);
  const reviewLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const productImages = useMemo(() => getProductImages(product), [product]);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? null;

  const optionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();

    variants.forEach((variant) => {
      const optionMap = getVariantOptionMap(variant);

      Object.entries(optionMap).forEach(([option, value]) => {
        if (!option || !value) return;

        if (!groups.has(option)) {
          groups.set(option, new Set<string>());
        }

        groups.get(option)?.add(value);
      });
    });

    return Array.from(groups.entries()).map(([option, values]) => ({
      option,
      label: beautifyOptionName(option),
      values: Array.from(values),
    }));
  }, [variants]);

  const activeImageIndex = useMemo(() => {
    const index = productImages.findIndex(
      (image) => image.url === activeImageUrl,
    );
    return index >= 0 ? index : 0;
  }, [activeImageUrl, productImages]);

  const displayPrice =
    selectedVariant?.price !== null &&
    selectedVariant?.price !== undefined &&
    selectedVariant?.price !== ""
      ? selectedVariant.price
      : product?.price;

  const displayStock =
    selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
      ? selectedVariant.stock
      : (product?.stock ?? 0);

  const isProductLocked = product?.status === "LOCKED";

  const isOutOfStock =
    product?.status === "OUT_OF_STOCK" || toNumber(displayStock) <= 0;

  const canAddToCart =
    Boolean(product?.id) &&
    Boolean(selectedVariantId) &&
    !isProductLocked &&
    !isOutOfStock &&
    !addingCart;

  const discountPercent = getDiscountPercent(product);
  const hasMoreReviews = reviews.length < reviewSummary.count;

  async function loadProductReviews(
    nextPage = 1,
    mode: "replace" | "append" = "replace",
  ) {
    if (!productId) return;

    setReviewsLoading(true);
    setReviewsError("");

    try {
      const response = await getProductReviews(productId, {
        page: nextPage,
        limit: REVIEW_LIMIT,
      });

      const data = response.data;
      const nextItems = Array.isArray(data?.items) ? data.items : [];

      setReviewSummary({
        count: toNumber(data?.summary?.count),
        avg: toNumber(data?.summary?.avg),
      });
      setReviewPage(toNumber(data?.page) || nextPage);
      setReviews((prev) =>
        mode === "append" ? [...prev, ...nextItems] : nextItems,
      );
    } catch (err: any) {
      setReviewsError(getApiMessage(err));

      if (mode === "replace") {
        setReviews([]);
        setReviewSummary({ count: 0, avg: 0 });
      }
    } finally {
      setReviewsLoading(false);
    }
  }

  async function loadProductDetail() {
    if (!productId) {
      setError("ID sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setCartMessage("");

    try {
      const [productResponse, variantsResponse] = await Promise.all([
        getPublicProductDetail(productId),
        getProductVariants(productId).catch(() => null),
      ]);

      const productData = unwrapApiData<ProductView>(productResponse);

      const variantsFromApi = variantsResponse
        ? unwrapApiList<VariantRow>(variantsResponse)
        : [];

      const variantsFromDetail = Array.isArray(productData?.variants)
        ? productData.variants
        : [];

      const safeVariants =
        variantsFromApi.length > 0 ? variantsFromApi : variantsFromDetail;
      const images = getProductImages(productData);

      setProduct(productData);
      setVariants(safeVariants);
      setIsFavorite(normalizeFavorite(productData?.isFavorite));

      if (safeVariants.length > 0) {
        const firstAvailable =
          safeVariants.find((variant) => toNumber(variant.stock) > 0) ??
          safeVariants[0];

        setSelectedVariantId(firstAvailable.id);
        setSelectedOptions(getVariantOptionMap(firstAvailable));

        const variantImage = getVariantImageUrl(images, firstAvailable);
        setActiveImageUrl(variantImage || images[0]?.url || bunnyImg);
      } else {
        setSelectedVariantId(null);
        setSelectedOptions({});
        setActiveImageUrl(images[0]?.url || bunnyImg);
      }
    } catch (err: any) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function syncVariantImage(variant: VariantRow | null) {
    const imageUrl = getVariantImageUrl(productImages, variant);

    if (imageUrl) {
      setActiveImageUrl(imageUrl);
    }
  }

  function handleSelectVariant(variant: VariantRow) {
    setSelectedVariantId(variant.id);
    setSelectedOptions(getVariantOptionMap(variant));
    syncVariantImage(variant);
    setQuantity(1);
    setCartMessage("");
  }

  function handleSelectOption(option: string, value: string) {
    const nextOptions = {
      ...selectedOptions,
      [option]: value,
    };

    setSelectedOptions(nextOptions);

    const matchedVariant =
      variants.find(
        (variant) =>
          variantMatchesOptions(variant, nextOptions) &&
          toNumber(variant.stock) > 0,
      ) ??
      variants.find((variant) => variantMatchesOptions(variant, nextOptions));

    if (matchedVariant) {
      setSelectedVariantId(matchedVariant.id);
      syncVariantImage(matchedVariant);
    } else {
      setSelectedVariantId(null);
    }

    setQuantity(1);
    setCartMessage("");
  }

  function isOptionDisabled(option: string, value: string) {
    const nextOptions = {
      ...selectedOptions,
      [option]: value,
    };

    return !variants.some(
      (variant) =>
        variantMatchesOptions(variant, nextOptions) &&
        toNumber(variant.stock) > 0,
    );
  }

  function changeQuantity(next: number) {
    const max = Math.max(1, toNumber(displayStock));
    const safe = Math.min(max, Math.max(1, next));

    setQuantity(safe);
  }

  function goToImage(direction: "prev" | "next") {
    if (productImages.length <= 1) return;

    const nextIndex =
      direction === "next"
        ? (activeImageIndex + 1) % productImages.length
        : (activeImageIndex - 1 + productImages.length) % productImages.length;

    setActiveImageUrl(productImages[nextIndex]?.url || bunnyImg);
  }

  function goToRequireAuth() {
    navigate(goLoginPath(), {
      state: {
        from: `/products/${productId}`,
      },
    });
  }

  async function handleAddToCart(): Promise<boolean> {
    if (!product) return false;

    if (!selectedVariantId) {
      setCartMessageType("error");
      setCartMessage("Vui lòng chọn phân loại trước khi thêm vào giỏ hàng.");
      return false;
    }

    if (isProductLocked) {
      setCartMessageType("error");
      setCartMessage("Sản phẩm này hiện đang bị khóa.");
      return false;
    }

    if (isOutOfStock) {
      setCartMessageType("error");
      setCartMessage("Sản phẩm này hiện đã hết hàng.");
      return false;
    }

    setAddingCart(true);
    setCartMessage("");

    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariantId,
        quantity,
      });

      recordProductEvent({
        productId: product.id,
        eventType: "ADD_TO_CART",
        metadata: {
          source: "product_detail",
          quantity,
          variantId: selectedVariantId,
        },
      }).catch(() => {});

      setCartMessageType("success");
      setCartMessage("Đã thêm sản phẩm vào giỏ hàng.");

      window.dispatchEvent(new Event("mochi-cart-updated"));
      return true;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setCartMessageType("error");
        setCartMessage("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
        goToRequireAuth();
        return false;
      }

      setCartMessageType("error");
      setCartMessage(getApiMessage(err));
      return false;
    } finally {
      setAddingCart(false);
    }
  }

  async function handleBuyNow() {
    const added = await handleAddToCart();

    if (added) {
      navigate("/cart");
    }
  }

  async function handleToggleFavorite() {
    if (!product || favoriteLoading) return;

    const previous = isFavorite;

    try {
      setFavoriteLoading(true);
      setIsFavorite(!previous);
      setCartMessage("");

      if (previous) {
        await removeFavoriteProduct(product.id);

        recordProductEvent({
          productId: product.id,
          eventType: "UNFAVORITE",
          metadata: {
            source: "product_detail",
          },
        }).catch(() => {});
      } else {
        await addFavoriteProduct(product.id);

        recordProductEvent({
          productId: product.id,
          eventType: "FAVORITE",
          metadata: {
            source: "product_detail",
          },
        }).catch(() => {});
      }

      setCartMessageType("success");
      setCartMessage(
        previous ? "Đã bỏ yêu thích sản phẩm." : "Đã thêm vào yêu thích.",
      );
    } catch (err: any) {
      setIsFavorite(previous);

      if (err?.response?.status === 401) {
        setCartMessageType("error");
        setCartMessage("Bạn cần đăng nhập để yêu thích sản phẩm.");
        goToRequireAuth();
        return;
      }

      setCartMessageType("error");
      setCartMessage(getApiMessage(err));
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    const title = getProductName(product);

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCartMessageType("success");
      setCartMessage("Đã sao chép liên kết sản phẩm.");
    } catch {
      setCartMessageType("error");
      setCartMessage("Không thể chia sẻ sản phẩm lúc này.");
    }
  }

  useEffect(() => {
    void loadProductDetail();
    void loadProductReviews(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;

    recordProductEvent({
      productId: product.id,
      eventType: "VIEW_DETAIL",
      metadata: {
        source: "product_detail",
      },
    }).catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    if (activeTab !== "review") return;
    if (!hasMoreReviews) return;
    if (reviewsLoading) return;

    const scrollRoot = reviewScrollBoxRef.current;
    const target = reviewLoadMoreRef.current;

    if (!scrollRoot || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (!firstEntry?.isIntersecting) return;
        if (reviewsLoading) return;
        if (!hasMoreReviews) return;

        void loadProductReviews(reviewPage + 1, "append");
      },
      {
        root: scrollRoot,
        rootMargin: "80px",
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasMoreReviews, reviewsLoading, reviewPage, reviews.length]);

  if (loading) {
    return (
      <div className="mochi-page product-detail-page">
        <div className="mochi-container">
          <div className="product-detail-state-card">
            <div className="mochi-loading-spinner" />
            <p>Đang tải chi tiết sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mochi-page product-detail-page">
        <div className="mochi-container">
          <div className="product-detail-state-card">
            <h3>Không thể xem sản phẩm</h3>
            <p>{error || "Sản phẩm không tồn tại hoặc đã ngừng bán."}</p>

            <Link
              to="/products"
              className="mochi-btn mochi-btn-primary product-detail-back"
            >
              Xem sản phẩm khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page product-detail-page">
      <div className="mochi-container">
        <div className="product-detail-breadcrumb">
          <Link to="/home">
            <FiHome />
            Trang chủ
          </Link>
          <FiChevronRight />
          <Link to="/products">Sản phẩm</Link>
          <FiChevronRight />
          <span>{getProductName(product)}</span>
        </div>

        <section className="product-detail-hero">
          <div className="product-detail-gallery-card">
            <div className="product-detail-main-image">
              {discountPercent ? (
                <span className="product-detail-discount">
                  -{discountPercent}%
                </span>
              ) : null}

              {isOutOfStock ? (
                <span className="product-detail-stock-tag">Hết hàng</span>
              ) : null}

              {productImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="product-detail-image-arrow is-left"
                    onClick={() => goToImage("prev")}
                    aria-label="Ảnh trước"
                  >
                    <FiChevronLeft />
                  </button>

                  <button
                    type="button"
                    className="product-detail-image-arrow is-right"
                    onClick={() => goToImage("next")}
                    aria-label="Ảnh sau"
                  >
                    <FiChevronRight />
                  </button>
                </>
              ) : null}

              <img
                src={activeImageUrl || bunnyImg}
                alt={getProductName(product)}
                onError={(event) => {
                  event.currentTarget.src = bunnyImg;
                }}
              />
            </div>

            <div className="product-detail-thumbs-wrap">
              <button
                type="button"
                className="product-detail-thumb-nav"
                disabled={productImages.length <= 1}
                onClick={() => goToImage("prev")}
                aria-label="Ảnh trước"
              >
                <FiChevronLeft />
              </button>

              <div className="product-detail-thumbs">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image.url}-${index}`}
                    className={activeImageUrl === image.url ? "active" : ""}
                    onClick={() => setActiveImageUrl(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Ảnh ${index + 1}`}
                      onError={(event) => {
                        event.currentTarget.src = bunnyImg;
                      }}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="product-detail-thumb-nav"
                disabled={productImages.length <= 1}
                onClick={() => goToImage("next")}
                aria-label="Ảnh sau"
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="product-detail-services">
              <div className="product-detail-service-item">
                <span className="is-pink">
                  <FiTruck />
                </span>
                <div>
                  <strong>Miễn phí vận chuyển</strong>
                  <p>Cho đơn từ 300k</p>
                </div>
              </div>

              <div className="product-detail-service-item">
                <span className="is-green">
                  <FiRefreshCcw />
                </span>
                <div>
                  <strong>Đổi trả dễ dàng</strong>
                  <p>Trong vòng 7 ngày</p>
                </div>
              </div>

              <div className="product-detail-service-item">
                <span className="is-blue">
                  <FiShield />
                </span>
                <div>
                  <strong>Thanh toán an toàn</strong>
                  <p>Bảo mật tuyệt đối</p>
                </div>
              </div>

              <div className="product-detail-service-item">
                <span className="is-purple">
                  <FiHeadphones />
                </span>
                <div>
                  <strong>Hỗ trợ 24/7</strong>
                  <p>Luôn sẵn sàng hỗ trợ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="product-detail-info-card">
            <div className="product-detail-tags">
              <span>{getCategoryName(product)}</span>
              <span>Bán chạy</span>
            </div>

            <h1>{getProductName(product)}</h1>

            <div className="product-detail-rating-row">
              <div className="product-detail-stars">
                {renderReviewStars(reviewSummary.avg || 5)}
              </div>

              <span>
                {(reviewSummary.avg || 5).toFixed(1)} ({reviewSummary.count}{" "}
                đánh giá)
              </span>

              <i />

              <span>Đã bán {product.sold ?? 0}</span>
            </div>

            <div className="product-detail-price-row">
              <strong>{formatMoney(displayPrice)}</strong>

              {product.compareAtPrice &&
              toNumber(product.compareAtPrice) > toNumber(displayPrice) ? (
                <span>{formatMoney(product.compareAtPrice)}</span>
              ) : null}

              {discountPercent ? <b>-{discountPercent}%</b> : null}
            </div>

            <div className="product-detail-voucher">
              <FiGift />
              <span>Ưu đãi đặc biệt: Miễn phí vận chuyển cho đơn từ 300k</span>
            </div>

            {optionGroups.length > 0 ? (
              <div className="product-detail-options">
                {optionGroups.map((group) => (
                  <div
                    className="product-detail-option-group"
                    key={group.option}
                  >
                    <h2>{group.label}</h2>

                    <div className="product-detail-option-list">
                      {group.values.map((value) => {
                        const active = selectedOptions[group.option] === value;
                        const disabled = isOptionDisabled(group.option, value);

                        return (
                          <button
                            type="button"
                            key={`${group.option}-${value}`}
                            className={active ? "active" : ""}
                            disabled={disabled}
                            onClick={() =>
                              handleSelectOption(group.option, value)
                            }
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : variants.length > 0 ? (
              <div className="product-detail-options">
                <div className="product-detail-option-group">
                  <h2>Phân loại</h2>

                  <div className="product-detail-option-list">
                    {variants.map((variant) => {
                      const variantStock = toNumber(variant.stock);
                      const selected = selectedVariantId === variant.id;

                      return (
                        <button
                          type="button"
                          key={variant.id}
                          className={selected ? "active" : ""}
                          disabled={variantStock <= 0}
                          onClick={() => handleSelectVariant(variant)}
                        >
                          {variant.name ||
                            variant.sku ||
                            `Biến thể #${variant.id}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="product-detail-cart-message is-error">
                Sản phẩm này chưa có biến thể nên chưa thể thêm vào giỏ hàng.
              </div>
            )}

            <div className="product-detail-quantity-row">
              <h2>Số lượng</h2>

              <div className="product-detail-quantity">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => changeQuantity(quantity - 1)}
                >
                  <FiMinus />
                </button>

                <input
                  value={quantity}
                  inputMode="numeric"
                  onChange={(event) =>
                    changeQuantity(Number(event.target.value))
                  }
                />

                <button
                  type="button"
                  disabled={quantity >= toNumber(displayStock)}
                  onClick={() => changeQuantity(quantity + 1)}
                >
                  <FiPlus />
                </button>
              </div>

              <span className="product-detail-stock-text">
                Còn {displayStock ?? 0} sản phẩm
              </span>
            </div>

            {cartMessage ? (
              <div
                className={`product-detail-cart-message is-${cartMessageType}`}
              >
                {cartMessage}
              </div>
            ) : null}

            <div className="product-detail-actions">
              <button
                type="button"
                className="product-detail-cart-btn"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                <FiShoppingCart />
                {addingCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>

              <button
                type="button"
                className="product-detail-buy-btn"
                disabled={!canAddToCart}
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
            </div>

            <div className="product-detail-social-actions">
              <button
                type="button"
                className={isFavorite ? "is-active" : ""}
                disabled={favoriteLoading}
                onClick={handleToggleFavorite}
              >
                <FiHeart />
                {isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}
              </button>

              <i />

              <button type="button" onClick={handleShare}>
                Chia sẻ
                <FiShare2 />
              </button>
            </div>
          </div>
        </section>

        <section className="product-detail-lower-grid">
          <div className="product-detail-description-card">
            <div className="product-detail-tabs">
              <button
                type="button"
                className={activeTab === "detail" ? "active" : ""}
                onClick={() => setActiveTab("detail")}
              >
                Thông tin chi tiết sản phẩm
              </button>

              <button
                type="button"
                className={activeTab === "review" ? "active" : ""}
                onClick={() => setActiveTab("review")}
              >
                Đánh giá ({reviewSummary.count})
              </button>
            </div>

            {activeTab === "detail" ? (
              <div className="product-detail-description-content">
                <p>
                  {product.description ||
                    `${getProductName(
                      product,
                    )} là sản phẩm chất lượng tốt, phù hợp sử dụng hằng ngày hoặc làm quà tặng.`}
                </p>

                <ul>
                  <li>
                    <FiCheckCircle />
                    <span>Thuộc cửa hàng: {getShopName(product)}</span>
                  </li>
                  <li>
                    <FiCheckCircle />
                    <span>Danh mục: {getCategoryName(product)}</span>
                  </li>
                  <li>
                    <FiCheckCircle />
                    <span>Chất lượng đảm bảo, an toàn khi sử dụng</span>
                  </li>
                  <li>
                    <FiCheckCircle />
                    <span>
                      Bảo quản nơi khô thoáng, tránh ánh nắng trực tiếp
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="product-detail-tab-review-content">
                <div className="product-detail-reviews-head product-detail-reviews-head-inside">
                  <div>
                    <h2>Đánh giá sản phẩm</h2>
                    <p>
                      {reviewSummary.count > 0
                        ? `${reviewSummary.avg.toFixed(1)} / 5 từ ${
                            reviewSummary.count
                          } đánh giá`
                        : "Sản phẩm chưa có đánh giá nào."}
                    </p>
                  </div>

                  <div className="product-detail-review-score">
                    <strong>{reviewSummary.avg.toFixed(1)}</strong>
                    <span>{renderReviewStars(reviewSummary.avg)}</span>
                  </div>
                </div>

                {reviewsError ? (
                  <div className="product-detail-review-alert">
                    {reviewsError}
                  </div>
                ) : null}

                {reviewsLoading && reviews.length <= 0 ? (
                  <div className="product-detail-review-loading">
                    Đang tải đánh giá...
                  </div>
                ) : reviews.length <= 0 ? (
                  <div className="product-detail-review-empty">
                    Chưa có khách hàng nào đánh giá sản phẩm này.
                  </div>
                ) : (
                  <div
                    className="product-detail-review-scroll"
                    ref={reviewScrollBoxRef}
                  >
                    <div className="product-detail-review-list">
                      {reviews.map((review) => (
                        <article
                          key={review.id}
                          className="product-detail-review-item"
                        >
                          <img
                            src={getReviewAvatar(review)}
                            alt={getReviewUserName(review)}
                            onError={(event) => {
                              event.currentTarget.src = bunnyImg;
                            }}
                          />

                          <div>
                            <div className="product-detail-review-topline">
                              <strong>{getReviewUserName(review)}</strong>
                              <span>{formatDate(review.createdAt)}</span>
                            </div>

                            <div className="product-detail-review-stars">
                              {renderReviewStars(review.rating)}
                            </div>

                            {review.comment ? <p>{review.comment}</p> : null}

                            {review.images?.length ? (
                              <div className="product-detail-review-images">
                                {review.images.map((imageUrl) => (
                                  <img
                                    key={imageUrl}
                                    src={imageUrl}
                                    alt="Ảnh đánh giá"
                                  />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>

                    {hasMoreReviews ? (
                      <div
                        ref={reviewLoadMoreRef}
                        className="product-detail-review-sentinel"
                      >
                        {reviewsLoading
                          ? "Đang tải thêm đánh giá..."
                          : "Kéo xuống để xem thêm"}
                      </div>
                    ) : (
                      <div className="product-detail-review-sentinel">
                        Đã hiển thị tất cả đánh giá
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}