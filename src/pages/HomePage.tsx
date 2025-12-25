// src/pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  User,
  ProductListItem,
  PaginatedResult,
  ApiResponse,
  ProductVariant,
  Category,
} from '../api/types';
import { getPublicProducts, getProductVariants } from '../api/products.api';
import { getPublicCategoryTree } from '../api/categories.api';
import { CartApi } from '../api/cart.api';
import { getMe } from '../api/users.api';
import { AuthApi } from '../api/auth.api';
import { getMainImageUrl } from '../utils/productImage';
import './HomePage.css';

type TopTabKey = 'hot' | 'products' | 'fashion' | 'home' | 'more';

export function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [activeTab, setActiveTab] = useState<TopTabKey>('hot');

  // ✅ categories
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number>(0); // 0 = all
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0); // leaf or parent without children

  // cache variant mặc định theo productId để không gọi lại nhiều lần
  const defaultVariantCache = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    void loadUser();
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, activeCategoryId]);

  // đóng menu khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showMenu) return;
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMenu]);

  const loadUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem('current_user', JSON.stringify(me));
    } catch {
      const raw = localStorage.getItem('current_user');
      if (raw) {
        try {
          setUser(JSON.parse(raw) as User);
        } catch {
          // ignore
        }
      }
    }
  };

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await getPublicCategoryTree();
      if (res.success) {
        const tree = Array.isArray(res.data) ? res.data : [];
        setCategoryTree(tree);
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
        categoryId: activeCategoryId || undefined, // ✅ filter
      });

      if (res.success) {
        const payload = (res as unknown as ApiResponse<PaginatedResult<ProductListItem>>).data;
        setProducts(payload.items);
        setTotal(payload.total);
      } else {
        setError(res.message || 'Không tải được danh sách sản phẩm.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadProducts();
  };

  const pickDefaultVariantId = async (productId: number): Promise<number | null> => {
    const cached = defaultVariantCache.current.get(productId);
    if (cached) return cached;

    try {
      const res = await getProductVariants(productId);
      const list = (res as unknown as ApiResponse<ProductVariant[]>).data;
      const variants = Array.isArray(list) ? list : [];

      const inStock = variants.find((v) => Number((v as any).stock ?? 0) > 0) ?? variants[0];
      if (!inStock) return null;

      const vid = Number((inStock as any).id);
      if (!Number.isFinite(vid)) return null;

      defaultVariantCache.current.set(productId, vid);
      return vid;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleAddToCart = async (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart((prev) => new Set(prev).add(productId));
    setError(null);
    setMessage(null);

    try {
      const variantId = await pickDefaultVariantId(productId);
      if (!variantId) {
        setError('Không xác định được biến thể mặc định. Vui lòng vào chi tiết sản phẩm để chọn biến thể.');
        return;
      }

      const res = await CartApi.addItem({ productId, variantId, quantity: 1 });

      if (res.success) {
        setMessage('Đã thêm sản phẩm (biến thể mặc định) vào giỏ hàng!');
        setTimeout(() => setMessage(null), 2500);
      } else {
        setError(res.message || 'Thêm vào giỏ hàng thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) {
        navigate('/login');
        return;
      }
      setError(err?.response?.data?.message || 'Thêm vào giỏ hàng thất bại.');
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleProductClick = (productId: number) => navigate(`/products/${productId}`);

  const handleLogout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('current_user');
      navigate('/login');
    }
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  const sidebarItems = useMemo(
    () => ['Khuyến mãi hôm nay', 'Sản phẩm mới', 'Bán chạy', 'Giảm giá sốc', 'Thương hiệu', 'Gợi ý cho bạn'],
    [],
  );

  const parentCategories = useMemo(() => categoryTree ?? [], [categoryTree]);

  const activeParent = useMemo(() => {
    if (!activeParentId) return null;
    return parentCategories.find((p) => p.id === activeParentId) ?? null;
  }, [activeParentId, parentCategories]);

  const activeChildren = useMemo(() => {
    const kids = activeParent?.children;
    return Array.isArray(kids) ? kids : [];
  }, [activeParent]);

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

  const handlePickParent = (parentId: number) => {
    setPage(1);
    setSearchQuery('');
    defaultVariantCache.current.clear();

    if (!parentId) {
      setActiveParentId(0);
      setActiveCategoryId(0);
      return;
    }

    const p = parentCategories.find((x) => x.id === parentId);
    const kids = (p?.children ?? []) as Category[];
    setActiveParentId(parentId);
    if (kids.length) {
      setActiveCategoryId(kids[0].id);
    } else {
      setActiveCategoryId(parentId);
    }
  };

  const handlePickChild = (childId: number) => {
    setPage(1);
    defaultVariantCache.current.clear();
    setActiveCategoryId(childId);
  };

  const renderProductCard = (product: ProductListItem) => {
    const isAdding = addingToCart.has(product.id);
    const imageUrl = getMainImageUrl(product);

    return (
      <div
        key={product.id}
        className="home-product-card"
        onClick={() => handleProductClick(product.id)}
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

          <div className="home-product-price">
            {formatPrice(product.price)} {product.currency}
          </div>

          <button
            type="button"
            onClick={(e) => void handleAddToCart(product.id, e)}
            disabled={isAdding}
            className="home-product-add-button"
          >
            {isAdding ? 'Đang thêm...' : '🛒 Thêm vào giỏ'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      {/* HEADER */}
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-header-left">
            <h1 className="home-header-logo" onClick={() => navigate('/home')}>
              🛍️ Mini E
            </h1>
          </div>

          <form onSubmit={handleSearch} className="home-header-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kim heo..."
              className="home-search-input"
            />
            <button type="submit" className="home-search-button" aria-label="Search">
              🔍
            </button>
          </form>

          <div className="home-header-right">
            <div className="home-header-actions">
              <button type="button" className="home-icon-button" onClick={() => navigate('/cart')}>
                🛒
              </button>
              <button type="button" className="home-icon-button" onClick={() => navigate('/me')}>
                👤
              </button>
            </div>

            {user ? (
              <div className="home-user-menu" ref={menuRef}>
                <button type="button" onClick={() => setShowMenu((s) => !s)} className="home-user-button">
                  {user.name || user.email}
                  <span className="home-user-arrow">▼</span>
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

                    {user.role === 'SELLER' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/shops/me');
                          setShowMenu(false);
                        }}
                        className="home-menu-item"
                      >
                        🏪 Shop của tôi
                      </button>
                    )}

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
              <button type="button" onClick={() => navigate('/login')} className="home-login-button">
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* TOP NAV (tabs) */}
        <div className="home-top-nav">
          <button
            type="button"
            className={`home-top-nav-item ${activeTab === 'hot' ? 'home-top-nav-item--active' : ''}`}
            onClick={() => setActiveTab('hot')}
          >
            Sản hot
          </button>
          <button
            type="button"
            className={`home-top-nav-item ${activeTab === 'products' ? 'home-top-nav-item--active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Sản phẩm
          </button>
          <button
            type="button"
            className={`home-top-nav-item ${activeTab === 'fashion' ? 'home-top-nav-item--active' : ''}`}
            onClick={() => setActiveTab('fashion')}
          >
            Về phẩm
          </button>
          <button
            type="button"
            className={`home-top-nav-item ${activeTab === 'home' ? 'home-top-nav-item--active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Nội thất
          </button>
          <button
            type="button"
            className={`home-top-nav-item ${activeTab === 'more' ? 'home-top-nav-item--active' : ''}`}
            onClick={() => setActiveTab('more')}
          >
            Dân cốt
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="home-main">
        <div className="home-content">
          {/* CATEGORY NAV */}
          <section className="home-catnav">
            <div className="home-catnav__title">Danh mục</div>
            <div className="home-catnav__row" role="tablist" aria-label="Danh mục cha">
              <button
                type="button"
                className={`home-catnav__pill ${activeParentId === 0 ? 'home-catnav__pill--active' : ''}`}
                onClick={() => handlePickParent(0)}
                aria-pressed={activeParentId === 0}
              >
                Tất cả
              </button>

              {loadingCats ? (
                <div className="home-catnav__loading">Đang tải danh mục...</div>
              ) : (
                parentCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`home-catnav__pill ${activeParentId === c.id ? 'home-catnav__pill--active' : ''}`}
                    onClick={() => handlePickParent(c.id)}
                    aria-pressed={activeParentId === c.id}
                    title={c.name}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>

            {activeChildren.length > 0 && (
              <div className="home-catnav__row home-catnav__row--sub" role="tablist" aria-label="Danh mục con">
                {activeChildren.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`home-catnav__chip ${activeCategoryId === c.id ? 'home-catnav__chip--active' : ''}`}
                    onClick={() => handlePickChild(c.id)}
                    aria-pressed={activeCategoryId === c.id}
                    title={c.name}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          {error && <div className="home-error">{error}</div>}
          {message && <div className="home-message">{message}</div>}

          {loading ? (
            <div className="home-loading">Đang tải sản phẩm...</div>
          ) : (
            <div className="home-layout">
              {/* SIDEBAR (trái) */}
              <aside className="home-sidebar">
                <div className="home-sidebar-title">Danh mục nhanh</div>
                <ul className="home-sidebar-list">
                  {sidebarItems.map((it) => (
                    <li key={it} className="home-sidebar-item">
                      {it}
                    </li>
                  ))}
                </ul>
              </aside>

              {/* MAIN COLUMN (phải) */}
              <section className="home-main-column">
                {/* HERO / BANNER */}
                <div className="home-hero">
                  <div className="home-hero-text">
                    <div className="home-hero-badge">Khuyến mãi</div>
                    <div className="home-hero-title">Khuyến Mãi Mùa Hè</div>
                    <div className="home-hero-sub">Săn deal mỗi ngày – thêm vào giỏ nhanh, giao hàng tiện lợi.</div>
                    <button
                      type="button"
                      className="home-hero-button"
                      onClick={() => {
                        setPage(1);
                        setSearchQuery('');
                        setActiveCategoryId(0);
                      }}
                    >
                      Mua ngay
                    </button>
                  </div>

                  <div className="home-hero-illustration">🧴🧼🧴</div>
                </div>

                {/* CATEGORIES */}
                <div className="home-section">
                  <div className="home-section-header">
                    <h2 className="home-section-title">Đang xem: {resolveCategoryName}</h2>
                    <button
                      type="button"
                      className="home-section-link"
                      onClick={() => {
                        handlePickParent(0);
                        setActiveTab('products');
                      }}
                    >
                      Xem tất cả →
                    </button>
                  </div>
                </div>

                {/* FEATURED PRODUCTS */}
                <div className="home-section">
                  <div className="home-section-header">
                    <h2 className="home-section-title">Sản Phẩm Nổi Bật</h2>
                    <button
                      type="button"
                      className="home-section-link"
                      onClick={() => navigate('/products')}
                    >
                      Xem thêm →
                    </button>
                  </div>

                  <div className="home-featured-grid">
                    {featuredProducts.map((p) => (
                      <div key={p.id}>{renderProductCard(p)}</div>
                    ))}
                  </div>
                </div>

                {/* ALL PRODUCTS */}
                <div className="home-section">
                  <div className="home-products-header">
                    <h2 className="home-products-title">Sản Phẩm</h2>
                    <div className="home-products-count">
                      {total} sản phẩm • Trang {page}/{totalPages}
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="home-empty">Không có sản phẩm phù hợp.</div>
                  ) : (
                    <div className="home-products-grid">{products.map(renderProductCard)}</div>
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

      {/* FOOTER */}
      <footer className="home-footer">
          <div className="home-footer-inner">
          <div className="home-footer-column">
            <div className="home-footer-heading">Home</div>
            <button className="home-footer-link" onClick={() => navigate('/home')}>
              Trang chủ
            </button>
            <button className="home-footer-link" onClick={() => navigate('/about')}>
              About
            </button>
            <button className="home-footer-link" onClick={() => navigate('/me')}>
              Thông tin
            </button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Categories</div>
              {(parentCategories.slice(0, 3) || []).map((c) => (
              <button
                key={c.id}
                className="home-footer-link"
                onClick={() => {
                    handlePickParent(c.id);
                  setPage(1);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Contact</div>
            <button className="home-footer-link">Liên kết</button>
            <button className="home-footer-link">Hỗ trợ</button>
            <button className="home-footer-link">Hotline</button>
          </div>

          <div className="home-footer-column">
            <div className="home-footer-heading">Logon</div>
            <button className="home-footer-link" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
            <button className="home-footer-link" onClick={() => navigate('/register')}>
              Đăng ký
            </button>
            <button className="home-footer-link" onClick={() => navigate('/shops/register')}>
              Mở shop
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
