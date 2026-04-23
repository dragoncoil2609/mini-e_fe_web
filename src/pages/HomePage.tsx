// src/pages/HomePage.tsx
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

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [myShop, setMyShop] = useState<Shop | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

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
  const [authFrom, setAuthFrom] = useState<string>('/home');

  useEffect(() => {
    void loadUserAndShop();
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = location.state as any;
    if (st?.authRequired) {
      setAuthFrom(st.from || '/home');
      setShowAuthModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    void loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, activeCategoryId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showMenu) return;
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) setShowMenu(false);
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
        if (tree.length) setExpandedParentId(tree[0].id);
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
        limit,
        q: searchQuery || undefined,
        status: 'ACTIVE',
        categoryId: activeCategoryId || undefined,
      });

      if (res.success) {
        const payload = (res as unknown as ApiResponse<
          PaginatedResult<ProductListItem>
        >).data;
        setProducts(payload.items);
        setTotal(payload.total);
      } else {
        setError(res.message || 'Không tải được danh sách sản phẩm.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Không tải được danh sách sản phẩm.',
      );
    } finally {
      setLoading(false);
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

  const handleProductClick = (productId: number) => navigate(`/products/${productId}`);

  const handleAddToCart = async (productId: number, e?: React.MouseEvent) => {
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

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const parentCategories = useMemo(() => categoryTree ?? [], [categoryTree]);

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

  const handlePickAll = () => {
    setPage(1);
    setActiveCategoryId(0);
  };

  const handlePickParent = (parentId: number) => {
    setPage(1);
    setExpandedParentId((cur) => (cur === parentId ? 0 : parentId));

    const p = parentCategories.find((x) => x.id === parentId);
    const kids = (p?.children ?? []) as Category[];

    if (kids.length) {
      setActiveCategoryId(kids[0].id);
    } else {
      setActiveCategoryId(parentId);
    }
  };

  const handlePickChild = (childId: number) => {
    setPage(1);
    setActiveCategoryId(childId);
  };

  const renderProductCard = (product: ProductListItem) => {
    const imageUrl = getMainImageUrl(product);

    return (
      <div
        key={product.id}
        className="home-product-card"
        onClick={() => handleProductClick(product.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleProductClick(product.id);
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
        </div>

        <div className="home-product-info">
          <h3 className="home-product-title">{product.title}</h3>

          <div className="home-product-meta">
            <div className="home-product-price">
              {formatPrice(product.price)} {product.currency}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => void handleAddToCart(product.id, e)}
            className="home-product-add-button"
          >
            Xem & chọn biến thể
          </button>
        </div>
      </div>
    );
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
                aria-label="Clear"
              >
                ✕
              </button>
            )}
            <button type="submit" className="home-search__btn" aria-label="Search">
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
                        setShowMenu(false);
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
                          <span className="home-sidebar-quickitem__icon">
                            {quickIcon(it)}
                          </span>
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

                        return (
                          <div key={p.id} className="home-cat-group">
                            <button
                              type="button"
                              className="home-cat-parent"
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
                                      activeCategoryId === c.id
                                        ? 'home-cat-child--active'
                                        : ''
                                    }`}
                                    onClick={() => handlePickChild(c.id)}
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
                      Tìm sản phẩm nhanh • Xem chi tiết rõ ràng • Chọn biến thể dễ
                      dàng • Thanh toán thuận tiện.
                    </div>

                    <div className="home-hero-actions">
                      <button
                        type="button"
                        className="home-hero-button"
                        onClick={() => {
                          handlePickAll();
                          setSearchInput('');
                          setSearchQuery('');
                        }}
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
                    </div>

                    <div className="home-products-header-right">
                      <button
                        type="button"
                        className="home-soft-btn"
                        onClick={handleClearSearch}
                        disabled={!searchQuery}
                      >
                        Xóa tìm kiếm
                      </button>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="home-empty">Không có sản phẩm phù hợp.</div>
                  ) : (
                    <div className="home-products-grid">
                      {products.map(renderProductCard)}
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
            <button className="home-footer-link" onClick={() => navigate('/home')}>
              Trang chủ
            </button>
            <button
              className="home-footer-link"
              onClick={() => navigate('/products')}
            >
              Sản phẩm
            </button>
            <button className="home-footer-link" onClick={() => navigate('/cart')}>
              Giỏ hàng
            </button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Tài khoản</div>
            <button className="home-footer-link" onClick={() => navigate('/me')}>
              Thông tin cá nhân
            </button>
            <button
              className="home-footer-link"
              onClick={() => navigate('/orders')}
            >
              Đơn hàng
            </button>
            <button
              className="home-footer-link"
              onClick={() => navigate('/addresses')}
            >
              Địa chỉ
            </button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Hỗ trợ</div>
            <button className="home-footer-link">Hotline</button>
            <button className="home-footer-link">Chính sách</button>
            <button className="home-footer-link">Liên hệ</button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Bắt đầu</div>

            {!user ? (
              <>
                <button
                  className="home-footer-link"
                  onClick={() => navigate('/login', { state: { from: '/home' } })}
                >
                  Đăng nhập
                </button>
                <button
                  className="home-footer-link"
                  onClick={() => navigate('/register', { state: { from: '/home' } })}
                >
                  Đăng ký
                </button>
                <button
                  className="home-footer-link"
                  onClick={() => navigate('/shops/register')}
                >
                  Mở shop
                </button>
              </>
            ) : (
              <>
                <button className="home-footer-link" onClick={() => navigate('/me')}>
                  Tài khoản của tôi
                </button>
                <button className="home-footer-link" onClick={handleShopNavigation}>
                  {myShop?.id ? shopStatusText(myShop.status) : 'Đăng ký bán hàng'}
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div
          className="auth-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAuthModal(false)}
        >
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal__title">Bạn cần đăng nhập</div>
            <div className="auth-modal__desc">
              Trang này yêu cầu tài khoản. Đăng nhập/đăng ký để tiếp tục.
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
              Tiếp tục xem trang chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}