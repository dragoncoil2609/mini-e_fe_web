import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  ApiResponse,
  Category,
  PaginatedResult,
  ProductListItem,
  Shop,
  ShopStatus,
  User,
} from '../api/types';
import { getPublicProducts } from '../api/products.api';
import { getPublicCategoryTree } from '../api/categories.api';
import { getMe } from '../api/users.api';
import { getMyShop } from '../api/shop.api';
import { AuthApi } from '../api/auth.api';
import { clearAccessToken, getAccessToken } from '../api/authToken';
import { getMainImageUrl } from '../utils/productImage';
import './HomePage.css';

type QuickKey = 'all' | 'new' | 'discount' | 'sold' | 'suggest';

type QuickItem = {
  key: QuickKey;
  label: string;
  icon: string;
};

const LIMIT = 20;

const QUICK_ITEMS: QuickItem[] = [
  { key: 'all', label: 'Tất cả sản phẩm', icon: '🏠' },
  { key: 'new', label: 'Hàng mới', icon: '✨' },
  { key: 'discount', label: 'Giá tốt', icon: '⚡' },
  { key: 'sold', label: 'Bán nhiều', icon: '🔥' },
  { key: 'suggest', label: 'Gợi ý cho bạn', icon: '🎁' },
];

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function formatPrice(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(toNumber(value));
}

function formatCompactNumber(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

function getDiscountPercent(product: ProductListItem): number {
  const price = toNumber(product.price);
  const compareAtPrice = toNumber(product.compareAtPrice);

  if (price <= 0 || compareAtPrice <= 0 || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function getSafeImageUrl(product: ProductListItem): string | null {
  const byUtil = getMainImageUrl(product as any);
  if (byUtil) return byUtil;

  if (product.mainImageUrl) return product.mainImageUrl;
  if (product.thumbnailUrl) return product.thumbnailUrl;

  const firstImage = Array.isArray(product.images)
    ? product.images.find((img) => img?.isMain) || product.images[0]
    : null;

  return firstImage?.url || null;
}

function getCategoryIcon(name?: string | null): string {
  const text = (name || '').toLowerCase();

  if (text.includes('điện thoại') || text.includes('phone')) return '📱';
  if (text.includes('laptop') || text.includes('máy tính')) return '💻';
  if (text.includes('điện tử')) return '🎧';
  if (text.includes('gia dụng')) return '🏠';
  if (text.includes('thời trang') || text.includes('quần') || text.includes('áo')) return '👕';
  if (text.includes('sức khỏe') || text.includes('làm đẹp')) return '💄';
  if (text.includes('mẹ') || text.includes('bé')) return '🧸';
  if (text.includes('sách') || text.includes('văn phòng')) return '📚';
  if (text.includes('thể thao')) return '⚽';
  if (text.includes('xe')) return '🛵';

  return '🛍️';
}

function normalizeProductsPayload(
  res: ApiResponse<PaginatedResult<ProductListItem>> | any,
): { items: ProductListItem[]; total: number } {
  const data = res?.data;
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  const total = toNumber(data?.total ?? data?.meta?.total ?? items.length);
  return { items, total };
}

function isProductNew(product: ProductListItem): boolean {
  if (!product.createdAt) return false;
  const createdTime = new Date(product.createdAt).getTime();
  if (!Number.isFinite(createdTime)) return false;

  const sevenDays = 1000 * 60 * 60 * 24 * 7;
  return Date.now() - createdTime <= sevenDays;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [myShop, setMyShop] = useState<Shop | null>(null);

  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState(0);
  const [expandedParentId, setExpandedParentId] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuick, setActiveQuick] = useState<QuickKey>('all');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFrom, setAuthFrom] = useState('/home');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q')?.trim() || '';
    const categoryId = Number(params.get('categoryId') || 0);
    const nextPage = Number(params.get('page') || 1);

    setSearchInput(q);
    setSearchQuery(q);
    setActiveCategoryId(Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 0);
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
  }, [location.search]);

  useEffect(() => {
    void loadUserAndShop();
    void loadCategories();
  }, []);

  useEffect(() => {
    const state = location.state as { authRequired?: boolean; from?: string } | null;

    if (state?.authRequired) {
      setAuthFrom(state.from || '/home');
      setShowAuthModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (activeCategoryId > 0) params.set('categoryId', String(activeCategoryId));
    if (page > 1) params.set('page', String(page));

    const nextSearch = params.toString() ? `?${params.toString()}` : '';

    if (nextSearch !== location.search) {
      navigate({ pathname: '/home', search: nextSearch }, { replace: true });
    }
  }, [activeCategoryId, location.search, navigate, page, searchQuery]);

  useEffect(() => {
    void loadProducts();
  }, [activeCategoryId, page, searchQuery]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!showMenu) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const loadUserAndShop = async () => {
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      setMyShop(null);
      localStorage.removeItem('current_user');
      return;
    }

    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem('current_user', JSON.stringify(me));

      try {
        const shopRes = await getMyShop();
        setMyShop(shopRes?.success && shopRes.data?.id ? shopRes.data : null);
      } catch (shopErr: any) {
        if (shopErr?.response?.status !== 404) console.error(shopErr);
        setMyShop(null);
      }
    } catch {
      clearAccessToken();
      setUser(null);
      setMyShop(null);
      localStorage.removeItem('current_user');
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);

    try {
      const res = await getPublicCategoryTree();
      const tree = Array.isArray(res?.data) ? res.data : [];

      if (res?.success) {
        setCategoryTree(tree);
        if (tree.length > 0) setExpandedParentId((current) => current || tree[0].id);
      } else {
        setCategoryTree([]);
      }
    } catch (err) {
      console.error(err);
      setCategoryTree([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);

    try {
      const res = await getPublicProducts({
        page,
        limit: LIMIT,
        q: searchQuery || undefined,
        categoryId: activeCategoryId || undefined,
      });

      if (res?.success) {
        const payload = normalizeProductsPayload(res);
        setProducts(payload.items);
        setTotal(payload.total);
      } else {
        setProducts([]);
        setTotal(0);
        setError(res?.message || 'Không tải được danh sách sản phẩm.');
      }
    } catch (err: any) {
      console.error(err);
      setProducts([]);
      setTotal(0);
      setError(err?.response?.data?.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const parentCategories = useMemo(() => categoryTree ?? [], [categoryTree]);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const allCategories = useMemo(() => {
    const list: Category[] = [];

    parentCategories.forEach((parent) => {
      list.push(parent);
      (parent.children ?? []).forEach((child) => list.push(child));
    });

    return list;
  }, [parentCategories]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId) return 'Tất cả sản phẩm';
    return allCategories.find((category) => category.id === activeCategoryId)?.name || 'Sản phẩm';
  }, [activeCategoryId, allCategories]);

  const displayedProducts = useMemo(() => {
    const items = [...products];

    switch (activeQuick) {
      case 'new':
        return items.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );

      case 'discount':
        return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));

      case 'sold':
        return items.sort((a, b) => toNumber(b.sold) - toNumber(a.sold));

      case 'suggest':
        return items.sort((a, b) => {
          const discountDiff = getDiscountPercent(b) - getDiscountPercent(a);
          if (discountDiff !== 0) return discountDiff;
          return toNumber(b.sold) - toNumber(a.sold);
        });

      case 'all':
      default:
        return items;
    }
  }, [activeQuick, products]);

  const userInitials = useMemo(() => {
    const raw = (user?.name || user?.email || '').trim();
    if (!raw) return 'U';

    return raw
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }, [user]);

  const productHint = useMemo(() => {
    const pieces: string[] = [];

    if (searchQuery) pieces.push(`Từ khóa: ${searchQuery}`);
    if (activeCategoryId) pieces.push(`Danh mục: ${activeCategoryName}`);

    const quickLabel = QUICK_ITEMS.find((item) => item.key === activeQuick)?.label;
    if (quickLabel && activeQuick !== 'all') pieces.push(`Sắp xếp: ${quickLabel}`);

    return pieces.join(' • ');
  }, [activeCategoryId, activeCategoryName, activeQuick, searchQuery]);

  const heroImageUrl = useMemo(() => {
    const productWithImage = displayedProducts.find((product) => getSafeImageUrl(product));
    return productWithImage ? getSafeImageUrl(productWithImage) : null;
  }, [displayedProducts]);

  const shopStatusText = (status?: ShopStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Shop của tôi';
      case 'PENDING':
        return 'Shop chờ duyệt';
      case 'SUSPENDED':
        return 'Shop tạm khóa';
      default:
        return 'Đăng ký bán hàng';
    }
  };

  const goToProtected = (path: string) => {
    if (!user) {
      setAuthFrom(path);
      setShowAuthModal(true);
      return;
    }

    navigate(path);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setActiveCategoryId(0);
    setActiveQuick('all');
    setPage(1);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const handleViewProduct = (productId: number, event?: ReactMouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    navigate(`/products/${productId}`);
  };

  const handleShopNavigation = () => {
    if (!user) {
      setAuthFrom('/shops/register');
      setShowAuthModal(true);
      return;
    }

    if (myShop?.id) {
      navigate('/shops/me');
      return;
    }

    navigate('/shops/register');
  };

  const handlePickAll = () => {
    setActiveCategoryId(0);
    setPage(1);
  };

  const handlePickParent = (parentId: number) => {
    setExpandedParentId((current) => (current === parentId ? 0 : parentId));
    setActiveCategoryId(parentId);
    setPage(1);
  };

  const handlePickChild = (parentId: number, childId: number) => {
    setExpandedParentId(parentId);
    setActiveCategoryId(childId);
    setPage(1);
  };

  const handleLogout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // Không cần chặn logout phía FE nếu API logout lỗi.
    } finally {
      localStorage.removeItem('current_user');
      clearAccessToken();
      setUser(null);
      setMyShop(null);
      setShowMenu(false);
      setMessage('Bạn đã đăng xuất.');
      navigate('/home');
    }
  };

  const renderProductCard = (product: ProductListItem) => {
    const imageUrl = getSafeImageUrl(product);
    const discountPercent = getDiscountPercent(product);
    const sold = toNumber(product.sold);
    const stock = product.stock === undefined || product.stock === null ? null : toNumber(product.stock);
    const outOfStock = stock === 0;
    const productShopName = (product as any)?.shop?.name || (product as any)?.shopName || null;

    return (
      <article
        key={product.id}
        className="home-product-card"
        role="button"
        tabIndex={0}
        onClick={() => handleProductClick(product.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleProductClick(product.id);
          }
        }}
      >
        <div className="home-product-image-wrapper">
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} className="home-product-image" loading="lazy" />
          ) : (
            <div className="home-product-image-placeholder">📦</div>
          )}

          <div className="home-product-badges">
            {discountPercent > 0 && (
              <span className="home-product-badge home-product-badge--sale">-{discountPercent}%</span>
            )}

            {isProductNew(product) && (
              <span className="home-product-badge home-product-badge--new">Mới</span>
            )}

            {outOfStock && (
              <span className="home-product-badge home-product-badge--muted">Hết hàng</span>
            )}
          </div>
        </div>

        <div className="home-product-info">
          <div className="home-product-category">{product.category?.name || 'Sản phẩm'}</div>
          <h3 className="home-product-title">{product.title}</h3>

          <div className="home-product-prices">
            <strong className="home-product-price">
              {formatPrice(product.price)}{product.currency || 'đ'}
            </strong>

            {toNumber(product.compareAtPrice) > toNumber(product.price) && (
              <span className="home-product-price-old">
                {formatPrice(product.compareAtPrice)}{product.currency || 'đ'}
              </span>
            )}
          </div>

          <div className="home-product-extra">
            <span>{sold > 0 ? `Đã bán ${formatCompactNumber(sold)}` : 'Mới lên kệ'}</span>
            {productShopName && <span>{productShopName}</span>}
          </div>

          <button
            type="button"
            className="home-product-view-button"
            onClick={(event) => handleViewProduct(product.id, event)}
          >
            Xem chi tiết
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-header-content">
          <button type="button" className="home-brand" onClick={() => navigate('/home')}>
            <span className="home-brand__logo">🛍️</span>
            <span className="home-brand__text">
              <span className="home-brand__name">Mini E</span>
              <span className="home-brand__sub">Mua sắm thông minh</span>
            </span>
          </button>

          <form className="home-search" onSubmit={handleSearchSubmit}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="home-search__input"
              placeholder="Tìm kiếm sản phẩm, danh mục..."
            />

            {searchInput.trim() && (
              <button type="button" className="home-search__clear" onClick={handleClearSearch}>
                ✕
              </button>
            )}

            <button type="submit" className="home-search__btn" aria-label="Tìm kiếm">
              🔍
            </button>
          </form>

          <div className="home-actions">
            <button type="button" className="home-cart-btn" onClick={() => goToProtected('/cart')}>
              <span className="home-cart-btn__icon">🛒</span>
              <span className="home-cart-btn__text">Giỏ hàng</span>
            </button>

            {user ? (
              <div className="home-user" ref={menuRef}>
                <button
                  type="button"
                  className="home-user__btn"
                  onClick={() => setShowMenu((current) => !current)}
                  aria-expanded={showMenu}
                >
                  {user.avatarUrl ? (
                    <img className="home-user__avatar-img" src={user.avatarUrl} alt={user.name || 'Avatar'} />
                  ) : (
                    <span className="home-user__avatar">{userInitials}</span>
                  )}

                  <span className="home-user__name">{user.name || user.email}</span>
                  <span className="home-user__chev">▾</span>
                </button>

                {showMenu && (
                  <div className="home-menu-dropdown">
                    <button
                      type="button"
                      className="home-menu-item"
                      onClick={() => {
                        navigate('/me');
                        setShowMenu(false);
                      }}
                    >
                      👤 Thông tin cá nhân
                    </button>

                    <button
                      type="button"
                      className="home-menu-item"
                      onClick={() => {
                        navigate('/addresses');
                        setShowMenu(false);
                      }}
                    >
                      📍 Địa chỉ của tôi
                    </button>

                    <button
                      type="button"
                      className="home-menu-item"
                      onClick={() => {
                        navigate('/orders');
                        setShowMenu(false);
                      }}
                    >
                      📦 Đơn hàng
                    </button>

                    <button
                      type="button"
                      className="home-menu-item"
                      onClick={() => {
                        handleShopNavigation();
                        setShowMenu(false);
                      }}
                    >
                      🏪 {shopStatusText(myShop?.status)}
                    </button>

                    <div className="home-menu-divider" />

                    <button
                      type="button"
                      className="home-menu-item home-menu-item--danger"
                      onClick={() => void handleLogout()}
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="home-login-button" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        <nav className="home-topnav">
          <div className="home-topnav__inner">
            {QUICK_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`home-topnav__item ${activeQuick === item.key ? 'home-topnav__item--active' : ''}`}
                onClick={() => setActiveQuick(item.key)}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-content">
          {error && <div className="home-error">{error}</div>}
          {message && <div className="home-message">{message}</div>}

          <section className="home-landing-grid">
            <aside className="home-category-panel">
              <div className="home-category-title">
                <span>☰</span>
                Danh mục sản phẩm
              </div>

              <button
                type="button"
                className={`home-category-row ${activeCategoryId === 0 ? 'home-category-row--active' : ''}`}
                onClick={handlePickAll}
              >
                <span className="home-category-row__icon">🛒</span>
                <span className="home-category-row__name">Tất cả sản phẩm</span>
                <span className="home-category-row__arrow">›</span>
              </button>

              {loadingCategories ? (
                <div className="home-category-loading">Đang tải danh mục...</div>
              ) : (
                <div className="home-category-list">
                  {parentCategories.map((parent) => {
                    const children = parent.children ?? [];
                    const expanded = expandedParentId === parent.id;
                    const active = activeCategoryId === parent.id;

                    return (
                      <div className="home-category-group" key={parent.id}>
                        <button
                          type="button"
                          className={`home-category-row ${active ? 'home-category-row--active' : ''}`}
                          onClick={() => handlePickParent(parent.id)}
                        >
                          <span className="home-category-row__icon">{getCategoryIcon(parent.name)}</span>
                          <span className="home-category-row__name">{parent.name}</span>
                          <span className="home-category-row__arrow">{children.length ? (expanded ? '⌄' : '›') : '›'}</span>
                        </button>

                        {expanded && children.length > 0 && (
                          <div className="home-category-children">
                            {children.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                className={`home-category-child ${
                                  activeCategoryId === child.id ? 'home-category-child--active' : ''
                                }`}
                                onClick={() => handlePickChild(parent.id, child.id)}
                              >
                                {child.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>

            <section className="home-hero">
              <div className="home-hero__content">
                <span className="home-hero__eyebrow">Ưu đãi mỗi ngày</span>
                <h1 className="home-hero__title">Mua sắm nhanh hơn với sản phẩm từ API</h1>
                <p className="home-hero__description">
                  Danh mục, tài khoản, ảnh đại diện và danh sách sản phẩm đều được lấy trực tiếp từ backend của bạn.
                </p>

                <div className="home-hero__actions">
                  <button type="button" className="home-hero__button" onClick={handleResetFilters}>
                    Xem sản phẩm
                  </button>
                  <button
                    type="button"
                    className="home-hero__button home-hero__button--light"
                    onClick={handleShopNavigation}
                  >
                    {myShop?.id ? 'Vào shop của tôi' : 'Mở shop'}
                  </button>
                </div>
              </div>

              <div className="home-hero__visual" aria-hidden>
                {heroImageUrl ? <img src={heroImageUrl} alt="" /> : <span>🛍️</span>}
              </div>
            </section>

            <aside className="home-service-panel">
              <div className="home-service-card">
                <span className="home-service-card__icon">🚚</span>
                <div>
                  <strong>Giao hàng tiện lợi</strong>
                  <span>Theo địa chỉ người dùng</span>
                </div>
              </div>

              <div className="home-service-card">
                <span className="home-service-card__icon">🔁</span>
                <div>
                  <strong>Đơn hàng rõ ràng</strong>
                  <span>Theo dõi trạng thái dễ dàng</span>
                </div>
              </div>

              <div className="home-service-card">
                <span className="home-service-card__icon">✅</span>
                <div>
                  <strong>Shop đã duyệt</strong>
                  <span>Bán hàng theo tài khoản shop</span>
                </div>
              </div>
            </aside>
          </section>

          <section className="home-shortcuts" aria-label="Tiện ích nhanh">
            {QUICK_ITEMS.slice(1).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`home-shortcut-card ${activeQuick === item.key ? 'home-shortcut-card--active' : ''}`}
                onClick={() => setActiveQuick(item.key)}
              >
                <span className="home-shortcut-card__icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            <button type="button" className="home-shortcut-card" onClick={handleShopNavigation}>
              <span className="home-shortcut-card__icon">🏪</span>
              <span>{myShop?.id ? 'Shop của tôi' : 'Đăng ký shop'}</span>
            </button>
          </section>

          <section className="home-products-section">
            <div className="home-products-header">
              <div>
                <span className="home-section-label">Danh sách sản phẩm</span>
                <h2 className="home-products-title">{activeCategoryName}</h2>
                <p className="home-products-sub">
                  {total} sản phẩm • Trang {page}/{totalPages}
                  {productHint ? ` • ${productHint}` : ''}
                </p>
              </div>

              <button
                type="button"
                className="home-reset-button"
                onClick={handleResetFilters}
                disabled={!searchQuery && activeCategoryId === 0 && activeQuick === 'all'}
              >
                Đặt lại
              </button>
            </div>

            {loadingProducts ? (
              <div className="home-products-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div className="home-product-card home-product-card--skeleton" key={index}>
                    <div className="home-skeleton home-skeleton--image" />
                    <div className="home-product-info">
                      <div className="home-skeleton home-skeleton--line" />
                      <div className="home-skeleton home-skeleton--line home-skeleton--short" />
                      <div className="home-skeleton home-skeleton--button" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="home-empty">
                <div className="home-empty__icon">🔎</div>
                <div className="home-empty__title">Không có sản phẩm phù hợp</div>
                <div className="home-empty__sub">Bạn thử đổi từ khóa, danh mục hoặc bấm đặt lại để xem tất cả.</div>
              </div>
            ) : (
              <div className="home-products-grid">{displayedProducts.map(renderProductCard)}</div>
            )}

            <div className="home-pagination">
              <button
                type="button"
                className="home-pagination-button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                ← Trước
              </button>

              <span className="home-pagination-info">Trang {page} / {totalPages}</span>

              <button
                type="button"
                className="home-pagination-button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Sau →
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <div className="home-footer-logo">🛍️ Mini E</div>
            <p>Nền tảng mua sắm trực tuyến dùng dữ liệu thật từ API: sản phẩm, danh mục, shop và tài khoản.</p>
          </div>

          <div className="home-footer-column">
            <strong>Về chúng tôi</strong>
            <button type="button" onClick={() => navigate('/home')}>Trang chủ</button>
            <button type="button" onClick={handleShopNavigation}>Kênh người bán</button>
          </div>

          <div className="home-footer-column">
            <strong>Hỗ trợ khách hàng</strong>
            <button type="button" onClick={() => goToProtected('/orders')}>Đơn hàng</button>
            <button type="button" onClick={() => goToProtected('/addresses')}>Địa chỉ</button>
          </div>

          <div className="home-footer-column">
            <strong>Tài khoản</strong>
            <button type="button" onClick={() => goToProtected('/me')}>Thông tin cá nhân</button>
            <button type="button" onClick={() => goToProtected('/cart')}>Giỏ hàng</button>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="auth-overlay" role="presentation" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__title">Bạn cần đăng nhập</div>
            <div className="auth-modal__desc">Đăng nhập hoặc tạo tài khoản mới để tiếp tục chức năng này.</div>

            <div className="auth-modal__actions">
              <button
                type="button"
                className="auth-btn auth-btn--primary"
                onClick={() => navigate('/login', { state: { from: authFrom } })}
              >
                Đăng nhập
              </button>

              <button
                type="button"
                className="auth-btn auth-btn--ghost"
                onClick={() => navigate('/register', { state: { from: authFrom } })}
              >
                Đăng ký
              </button>
            </div>

            <button type="button" className="auth-modal__close" onClick={() => setShowAuthModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
