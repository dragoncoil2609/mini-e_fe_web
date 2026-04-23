import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  User,
  ProductListItem,
  PaginatedResult,
  ApiResponse,
  Category,
  Shop,
  ShopStatus,
} from '../api/types';
import { getPublicProducts } from '../api/products.api';
import { getPublicCategoryTree } from '../api/categories.api';
import { getMe } from '../api/users.api';
import { getMyShop } from '../api/shop.api';
import { AuthApi } from '../api/auth.api';
import { getAccessToken, clearAccessToken } from '../api/authToken';
import { getMainImageUrl } from '../utils/productImage';
import './HomePage.css';

type QuickKey =
  | 'Khuyến mãi hôm nay'
  | 'Sản phẩm mới'
  | 'Bán chạy'
  | 'Giảm giá sốc'
  | 'Thương hiệu'
  | 'Gợi ý cho bạn';

const LIMIT = 20;

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function formatPrice(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(toNumber(value));
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getDiscountPercent(product: ProductListItem): number {
  const price = toNumber(product.price);
  const compare = toNumber(product.compareAtPrice);
  if (compare <= 0 || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
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

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [myShop, setMyShop] = useState<Shop | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const sidebarItems = useMemo(
    () =>
      [
        'Khuyến mãi hôm nay',
        'Sản phẩm mới',
        'Bán chạy',
        'Giảm giá sốc',
        'Thương hiệu',
        'Gợi ý cho bạn',
      ] as QuickKey[],
    [],
  );
  const [activeQuick, setActiveQuick] =
    useState<QuickKey>('Khuyến mãi hôm nay');

  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [expandedParentId, setExpandedParentId] = useState<number>(0);

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
    const st = location.state as any;
    if (st?.authRequired) {
      setAuthFrom(st.from || '/home');
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
      navigate(
        {
          pathname: '/home',
          search: nextSearch,
        },
        { replace: true },
      );
    }
  }, [searchQuery, activeCategoryId, page, location.search, navigate]);

  useEffect(() => {
    void loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, page, activeCategoryId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showMenu) return;
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
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
        if (shopRes?.success && shopRes.data?.id) {
          setMyShop(shopRes.data);
        } else {
          setMyShop(null);
        }
      } catch (shopErr: any) {
        if (shopErr?.response?.status === 404) {
          setMyShop(null);
        } else {
          console.error(shopErr);
          setMyShop(null);
        }
      }
    } catch {
      clearAccessToken();
      setUser(null);
      setMyShop(null);
      localStorage.removeItem('current_user');
    }
  };

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await getPublicCategoryTree();
      if (res.success) {
        const tree = Array.isArray(res.data) ? res.data : [];
        setCategoryTree(tree);
        if (tree.length && !expandedParentId) {
          setExpandedParentId(tree[0].id);
        }
      } else {
        setCategoryTree([]);
      }
    } catch (e) {
      console.error(e);
      setCategoryTree([]);
    } finally {
      setLoadingCats(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getPublicProducts({
        page,
        limit: LIMIT,
        q: searchQuery || undefined,
        categoryId: activeCategoryId || undefined,
      });

      if (res.success) {
        const payload = (res as unknown as ApiResponse<PaginatedResult<ProductListItem>>).data;
        setProducts(Array.isArray(payload.items) ? payload.items : []);
        setTotal(Number(payload.total || 0));
      } else {
        setProducts([]);
        setTotal(0);
        setError(res.message || 'Không tải được danh sách sản phẩm.');
      }
    } catch (err: any) {
      console.error(err);
      setProducts([]);
      setTotal(0);
      setError(err?.response?.data?.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = useMemo(() => categoryTree ?? [], [categoryTree]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const resolveCategoryName = useMemo(() => {
    if (!activeCategoryId) return 'Tất cả sản phẩm';

    const stack: Category[] = [];
    parentCategories.forEach((p) => {
      stack.push(p);
      (p.children ?? []).forEach((c) => stack.push(c));
    });

    const found = stack.find((c) => c.id === activeCategoryId);
    return found?.name ?? 'Sản phẩm';
  }, [activeCategoryId, parentCategories]);

  const userInitials = useMemo(() => {
    const raw = (user?.name || user?.email || '').trim();
    if (!raw) return 'U';
    const parts = raw.split(/\s+/).slice(0, 2);
    const initials = parts.map((p) => p[0]?.toUpperCase()).join('');
    return initials || 'U';
  }, [user]);

  const displayedProducts = useMemo(() => {
    const items = [...products];

    switch (activeQuick) {
      case 'Khuyến mãi hôm nay':
        return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));

      case 'Sản phẩm mới':
        return items.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );

      case 'Bán chạy':
        return items.sort((a, b) => toNumber(b.sold) - toNumber(a.sold));

      case 'Giảm giá sốc':
        return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));

      case 'Thương hiệu':
        return items.sort((a, b) => a.title.localeCompare(b.title, 'vi'));

      case 'Gợi ý cho bạn':
        return items.sort((a, b) => {
          const soldDiff = toNumber(b.sold) - toNumber(a.sold);
          if (soldDiff !== 0) return soldDiff;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

      default:
        return items;
    }
  }, [products, activeQuick]);

  const resultsHint = useMemo(() => {
    const bits: string[] = [];

    if (searchQuery) bits.push(`Từ khóa: "${searchQuery}"`);
    if (activeCategoryId) bits.push(`Danh mục: ${resolveCategoryName}`);
    if (activeQuick) bits.push(`Chế độ xem: ${activeQuick}`);

    return bits.join(' • ');
  }, [searchQuery, activeCategoryId, resolveCategoryName, activeQuick]);

  const quickIcon = (key: QuickKey) => {
    switch (key) {
      case 'Khuyến mãi hôm nay':
        return '⚡';
      case 'Sản phẩm mới':
        return '🆕';
      case 'Bán chạy':
        return '🔥';
      case 'Giảm giá sốc':
        return '💸';
      case 'Thương hiệu':
        return '🏷️';
      case 'Gợi ý cho bạn':
        return '✨';
      default:
        return '•';
    }
  };

  const shopStatusText = (status?: ShopStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Shop của tôi (đang chờ duyệt)';
      case 'ACTIVE':
        return 'Shop của tôi';
      case 'SUSPENDED':
        return 'Shop của tôi (tạm khóa)';
      default:
        return 'Đăng ký bán hàng';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setPage(1);
    setActiveQuick('Khuyến mãi hôm nay');
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const handleViewProduct = (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/products/${productId}`);
  };

  const handleLogout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // ignore
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
    setPage(1);
    setActiveCategoryId(0);
  };

  const handlePickParent = (parentId: number) => {
    setPage(1);
    setExpandedParentId((cur) => (cur === parentId ? 0 : parentId));
    setActiveCategoryId(parentId);
  };

  const handlePickChild = (parentId: number, childId: number) => {
    setPage(1);
    setExpandedParentId(parentId);
    setActiveCategoryId(childId);
  };

  const renderProductCard = (product: ProductListItem) => {
    const imageUrl = getSafeImageUrl(product);
    const discountPercent = getDiscountPercent(product);
    const sold = toNumber(product.sold);
    const stock = toNumber(product.stock);
    const outOfStock = stock > 0 ? false : stock === 0;
    const isNew =
      Date.now() - new Date(product.createdAt || 0).getTime() <= 1000 * 60 * 60 * 24 * 7;

    return (
      <div
        key={product.id}
        className="home-product-card"
        onClick={() => handleProductClick(product.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick(product.id);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="home-product-image-wrapper">
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} className="home-product-image" />
          ) : (
            <div className="home-product-image-placeholder">📦</div>
          )}

          <div className="home-product-badges">
            {discountPercent > 0 && (
              <span className="home-product-badge home-product-badge--sale">
                -{discountPercent}%
              </span>
            )}
            {isNew && (
              <span className="home-product-badge home-product-badge--new">Mới</span>
            )}
            {outOfStock && (
              <span className="home-product-badge home-product-badge--muted">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        <div className="home-product-info">
          <h3 className="home-product-title">{product.title}</h3>

          <div className="home-product-prices">
            <div className="home-product-price">
              {formatPrice(product.price)} {product.currency}
            </div>

            {toNumber(product.compareAtPrice) > toNumber(product.price) && (
              <div className="home-product-price-old">
                {formatPrice(product.compareAtPrice)} {product.currency}
              </div>
            )}
          </div>

          <div className="home-product-extra">
            <span>{sold > 0 ? `Đã bán ${formatCompactNumber(sold)}` : 'Mới lên kệ'}</span>
            <span>{product.category?.name || 'Danh mục khác'}</span>
          </div>

          <button
            type="button"
            onClick={(e) => handleViewProduct(product.id, e)}
            className="home-product-add-button"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-header-content">
          <button
            type="button"
            className="home-brand"
            onClick={() => navigate('/home')}
            aria-label="Mini E Home"
          >
            <span className="home-brand__logo">🛍️</span>
            <span className="home-brand__text">
              <span className="home-brand__name">Mini E</span>
              <span className="home-brand__sub">Mua sắm nhanh • Giá tốt</span>
            </span>
          </button>

          <form onSubmit={handleSearchSubmit} className="home-search">
            <span className="home-search__icon">🔎</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, shop, từ khóa..."
              className="home-search__input"
            />

            {searchInput.trim().length > 0 && (
              <button
                type="button"
                className="home-search__clear"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}

            <button type="submit" className="home-search__btn" aria-label="Tìm kiếm">
              Tìm
            </button>
          </form>

          <div className="home-actions">
            <button
              type="button"
              className="home-cart-btn"
              onClick={() => navigate('/cart')}
              aria-label="Cart"
            >
              <span className="home-cart-btn__icon">🛒</span>
              <span className="home-cart-btn__text">Giỏ hàng</span>
            </button>

            {user ? (
              <div className="home-user" ref={menuRef}>
                <button
                  type="button"
                  className="home-user__btn"
                  onClick={() => setShowMenu((s) => !s)}
                  aria-expanded={showMenu}
                >
                  <span className="home-user__avatar">{userInitials}</span>
                  <span className="home-user__name">{user.name || user.email}</span>
                  <span className="home-user__chev">▾</span>
                </button>

                {showMenu && (
                  <div className="home-menu-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/me');
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      📝 Thông tin cá nhân
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigate('/addresses');
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      📍 Địa chỉ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigate('/orders');
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      📦 Đơn hàng
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleShopNavigation();
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      🏪 {shopStatusText(myShop?.status)}
                    </button>

                    <div className="home-menu-divider" />

                    <button
                      type="button"
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="home-menu-item home-menu-item--danger"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="home-login-button"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        <div className="home-quicknav">
          <div className="home-quicknav__inner">
            {sidebarItems.map((it) => (
              <button
                key={it}
                type="button"
                className={`home-quicknav__item ${
                  activeQuick === it ? 'home-quicknav__item--active' : ''
                }`}
                onClick={() => setActiveQuick(it)}
                aria-pressed={activeQuick === it}
              >
                <span className="home-quicknav__icon">{quickIcon(it)}</span>
                <span className="home-quicknav__text">{it}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="home-content">
          {error && <div className="home-error">{error}</div>}
          {message && <div className="home-message">{message}</div>}

          {loading ? (
            <div className="home-loading">Đang tải sản phẩm...</div>
          ) : (
            <div className="home-layout">
              <aside className="home-sidebar">
                <div className="home-sidebar-block">
                  <div className="home-sidebar-title">Khám phá</div>
                  <ul className="home-sidebar-quicklist">
                    {sidebarItems.map((it) => (
                      <li key={it}>
                        <button
                          type="button"
                          className={`home-sidebar-quickitem ${
                            activeQuick === it ? 'home-sidebar-quickitem--active' : ''
                          }`}
                          onClick={() => setActiveQuick(it)}
                        >
                          <span className="home-sidebar-quickitem__icon">{quickIcon(it)}</span>
                          <span className="home-sidebar-quickitem__text">{it}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="home-sidebar-divider" />

                <div className="home-sidebar-block">
                  <div className="home-sidebar-title">Danh mục sản phẩm</div>

                  <button
                    type="button"
                    className={`home-cat-item ${
                      activeCategoryId === 0 ? 'home-cat-item--active' : ''
                    }`}
                    onClick={handlePickAll}
                  >
                    Tất cả
                  </button>

                  {loadingCats ? (
                    <div className="home-sidebar-muted">Đang tải danh mục...</div>
                  ) : (
                    <div className="home-cat-tree">
                      {parentCategories.map((p) => {
                        const kids = (p.children ?? []) as Category[];
                        const expanded = expandedParentId === p.id;
                        const parentActive = activeCategoryId === p.id;

                        return (
                          <div key={p.id} className="home-cat-group">
                            <button
                              type="button"
                              className={`home-cat-parent ${
                                parentActive ? 'home-cat-parent--active' : ''
                              }`}
                              onClick={() => handlePickParent(p.id)}
                              title={p.name}
                            >
                              <span className="home-cat-parent__name">{p.name}</span>
                              <span className="home-cat-parent__chev">
                                {kids.length ? (expanded ? '▾' : '▸') : ''}
                              </span>
                            </button>

                            {expanded && kids.length > 0 && (
                              <div className="home-cat-children">
                                {kids.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    className={`home-cat-child ${
                                      activeCategoryId === c.id ? 'home-cat-child--active' : ''
                                    }`}
                                    onClick={() => handlePickChild(p.id, c.id)}
                                    title={c.name}
                                  >
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <section className="home-main-column">
                <div className="home-hero">
                  <div className="home-hero-text">
                    <div className="home-hero-badge">{activeQuick}</div>
                    <div className="home-hero-title">
                      Mua sắm tiện lợi, giá tốt mỗi ngày
                    </div>
                    <div className="home-hero-sub">
                      Tìm sản phẩm nhanh • Xem chi tiết rõ ràng • Chọn biến thể dễ dàng •
                      Thanh toán thuận tiện.
                    </div>

                    <div className="home-hero-actions">
                      <button
                        type="button"
                        className="home-hero-button"
                        onClick={handleResetFilters}
                      >
                        Xem tất cả sản phẩm
                      </button>

                      <button
                        type="button"
                        className="home-hero-button home-hero-button--ghost"
                        onClick={handleShopNavigation}
                      >
                        {myShop?.id ? 'Xem shop của tôi →' : 'Mở shop →'}
                      </button>
                    </div>
                  </div>

                  <div className="home-hero-illustration" aria-hidden>
                    🧴🧼🛒
                  </div>
                </div>

                <div className="home-section">
                  <div className="home-products-header">
                    <div className="home-products-header-left">
                      <h2 className="home-products-title">{resolveCategoryName}</h2>
                      <div className="home-products-sub">
                        {total} sản phẩm • Trang {page}/{totalPages}
                      </div>
                      {resultsHint && (
                        <div className="home-products-hint">{resultsHint}</div>
                      )}
                    </div>

                    <div className="home-products-header-right">
                      <button
                        type="button"
                        className="home-soft-btn"
                        onClick={handleResetFilters}
                        disabled={!searchQuery && activeCategoryId === 0}
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </div>

                  {displayedProducts.length === 0 ? (
                    <div className="home-empty">
                      <div className="home-empty__title">Không có sản phẩm phù hợp.</div>
                      <div className="home-empty__sub">
                        Hãy thử đổi từ khóa, danh mục hoặc quay về tất cả sản phẩm.
                      </div>
                    </div>
                  ) : (
                    <div className="home-products-grid">
                      {displayedProducts.map(renderProductCard)}
                    </div>
                  )}

                  <div className="home-pagination">
                    <button
                      type="button"
                      className="home-pagination-button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      ← Trước
                    </button>

                    <div className="home-pagination-info">
                      Trang {page} / {totalPages}
                    </div>

                    <button
                      type="button"
                      className="home-pagination-button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-column">
            <div className="home-footer-heading">Mini E</div>
            <button type="button" className="home-footer-link" onClick={() => navigate('/home')}>
              Trang chủ
            </button>
            <button type="button" className="home-footer-link" onClick={() => navigate('/cart')}>
              Giỏ hàng
            </button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Tài khoản</div>
            <button type="button" className="home-footer-link" onClick={() => navigate('/me')}>
              Hồ sơ cá nhân
            </button>
            <button type="button" className="home-footer-link" onClick={() => navigate('/orders')}>
              Đơn hàng
            </button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Bán hàng</div>
            <button type="button" className="home-footer-link" onClick={handleShopNavigation}>
              {myShop?.id ? 'Shop của tôi' : 'Mở shop'}
            </button>
            <button
              type="button"
              className="home-footer-link"
              onClick={() => navigate('/shops/register')}
            >
              Đăng ký shop
            </button>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div
          className="auth-overlay"
          onClick={() => setShowAuthModal(false)}
          role="presentation"
        >
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__title">Bạn cần đăng nhập</div>
            <div className="auth-modal__desc">
              Để tiếp tục tới trang này, bạn hãy đăng nhập hoặc tạo tài khoản mới.
            </div>

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

            <button
              type="button"
              className="auth-modal__close"
              onClick={() => setShowAuthModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}