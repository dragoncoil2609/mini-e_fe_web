// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  User,
  ProductListItem,
  PaginatedResult,
  ApiResponse,
} from '../api/types';
import { getPublicProducts } from '../api/products.api';
import { CartApi } from '../api/cart.api';
import { getMe } from '../api/users.api';
import { AuthApi } from '../api/auth.api';
import { getMainImageUrl } from '../utils/productImage';
import './HomePage.css';

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, page]);

  const loadUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem('current_user', JSON.stringify(me));
    } catch (err) {
      const raw = localStorage.getItem('current_user');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as User;
          setUser(parsed);
        } catch (e) {
          console.error('Cannot parse current_user from localStorage', e);
        }
      }
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
      });
      if (res.success) {
        const payload = (
          res as unknown as ApiResponse<PaginatedResult<ProductListItem>>
        ).data;
        setProducts(payload.items);
        setTotal(payload.total);
      } else {
        setError(res.message || 'Không tải được danh sách sản phẩm.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Không tải được danh sách sản phẩm.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadProducts();
  };

  const handleAddToCart = async (
    productId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart((prev) => new Set(prev).add(productId));
    setError(null);
    setMessage(null);

    try {
      const res = await CartApi.addItem({ productId, quantity: 1 });
      if (res.success) {
        setMessage('Đã thêm sản phẩm vào giỏ hàng!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(res.message || 'Thêm vào giỏ hàng thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Thêm vào giỏ hàng thất bại. Vui lòng đăng nhập.',
      );
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const handleLogout = async () => {
    try {
      await AuthApi.logout();
      localStorage.removeItem('current_user');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('current_user');
      navigate('/login');
    }
  };

  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const featuredProducts = products.slice(0, 4);

  const renderProductCard = (product: ProductListItem) => {
    const isAdding = addingToCart.has(product.id);
    const imageUrl = getMainImageUrl(product);

    return (
      <div key={product.id} className="home-product-card">
        <div
          className="home-product-image-wrapper"
          onClick={() => handleProductClick(product.id)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="home-product-image"
            />
          ) : (
            <div className="home-product-image-placeholder">📦</div>
          )}
        </div>
        <div className="home-product-info">
          <h3
            className="home-product-title"
            onClick={() => handleProductClick(product.id)}
          >
            {product.title}
          </h3>
          <div className="home-product-price">
            {formatPrice(product.price)} {product.currency}
          </div>
          <button
            type="button"
            onClick={(e) => handleAddToCart(product.id, e)}
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
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-header-left">
            <h1
              className="home-header-logo"
              onClick={() => navigate('/home')}
            >
              🛍️ Mini E
            </h1>
          </div>

          <form onSubmit={handleSearch} className="home-header-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="home-search-input"
            />
            <button type="submit" className="home-search-button">
              🔍
            </button>
          </form>

          <div className="home-header-right">
            <div className="home-header-actions">
              <button
                type="button"
                className="home-icon-button"
                onClick={() => navigate('/cart')}
              >
                🛒
              </button>
              <button
                type="button"
                className="home-icon-button"
                onClick={() => navigate('/orders')}
              >
                📦
              </button>
            </div>

            {user ? (
              <div className="home-user-menu">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="home-user-button"
                >
                  👤 {user.name || user.email}
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
                        navigate('/cart');
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      🛒 Giỏ hàng
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
                        navigate('/addresses');
                        setShowMenu(false);
                      }}
                      className="home-menu-item"
                    >
                      📍 Địa chỉ
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
                        handleLogout();
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
      </header>

      <main className="home-main">
        <div className="home-content">
          {error && <div className="home-error">{error}</div>}
          {message && <div className="home-message">{message}</div>}

          {loading ? (
            <div className="home-loading">Đang tải sản phẩm...</div>
          ) : (
            <>
              {/* Thanh tab dưới header */}
              <div className="home-top-nav">
                <button
                  type="button"
                  className="home-top-nav-item home-top-nav-item--active"
                >
                  Sản hot
                </button>
                <button type="button" className="home-top-nav-item">
                  Sản phẩm
                </button>
                <button type="button" className="home-top-nav-item">
                  Ví vớn
                </button>
                <button type="button" className="home-top-nav-item">
                  Nội thất
                </button>
                <button type="button" className="home-top-nav-item">
                  Đơn cũ
                </button>
              </div>

              <div className="home-layout">
                {/* Menu bên trái */}
                <aside className="home-sidebar">
                  <div className="home-sidebar-title">Danh mục</div>
                  <ul className="home-sidebar-list">
                    <li className="home-sidebar-item">Thời trang</li>
                    <li className="home-sidebar-item">Điện tử</li>
                    <li className="home-sidebar-item">Gia dụng</li>
                    <li className="home-sidebar-item">Nhà cửa &amp; đời sống</li>
                    <li className="home-sidebar-item">Sách &amp; VP phẩm</li>
                  </ul>
                </aside>

                <section className="home-main-column">
                  {/* Banner khuyến mãi */}
                  <section className="home-hero">
                    <div className="home-hero-text">
                      <p className="home-hero-badge">Khuyến Mãi Mùa Hè</p>
                      <h2 className="home-hero-title">
                        Sắm đồ mới, chill mùa nắng ☀️
                      </h2>
                      <p className="home-hero-sub">
                        Giảm giá cho hàng trăm sản phẩm chăm sóc cá nhân, thời
                        trang và gia dụng. Miễn phí giao hàng cho đơn từ
                        300.000&nbsp;đ.
                      </p>
                      <button
                        type="button"
                        className="home-hero-button"
                        onClick={() =>
                          document
                            .getElementById('featured-products-section')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                      >
                        Khám phá ngay
                      </button>
                    </div>
                    <div className="home-hero-illustration">
                      🧴🧼🧺
                    </div>
                  </section>

                  {/* Danh mục sản phẩm */}
                  <section className="home-section">
                    <h2 className="home-section-title">Danh mục sản phẩm</h2>
                    <div className="home-categories-row">
                      <button
                        type="button"
                        className="home-category-card"
                      >
                        <div className="home-category-icon">👕</div>
                        <div className="home-category-name">
                          Clothes + phẩm
                        </div>
                      </button>
                      <button
                        type="button"
                        className="home-category-card"
                      >
                        <div className="home-category-icon">📱</div>
                        <div className="home-category-name">Electronics</div>
                      </button>
                      <button
                        type="button"
                        className="home-category-card"
                      >
                        <div className="home-category-icon">📦</div>
                        <div className="home-category-name">Gửi phone</div>
                      </button>
                      <button
                        type="button"
                        className="home-category-card"
                      >
                        <div className="home-category-icon">🏠</div>
                        <div className="home-category-name">Home ỳ</div>
                      </button>
                    </div>
                  </section>

                  {/* Sản phẩm nổi bật */}
                  <section
                    className="home-section"
                    id="featured-products-section"
                  >
                    <div className="home-section-header">
                      <h2 className="home-section-title">
                        Sản phẩm nổi bật
                      </h2>
                      {products.length > 4 && (
                        <button
                          type="button"
                          className="home-section-link"
                          onClick={() => {
                            setPage(1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Xem tất cả →
                        </button>
                      )}
                    </div>

                    {products.length === 0 ? (
                      <div className="home-empty">
                        {searchQuery
                          ? `Không tìm thấy sản phẩm nào với từ khóa "${searchQuery}"`
                          : 'Chưa có sản phẩm nào.'}
                      </div>
                    ) : (
                      <div className="home-featured-grid">
                        {featuredProducts.map(renderProductCard)}
                      </div>
                    )}
                  </section>

                  {/* Tất cả sản phẩm + phân trang */}
                  {products.length > 4 && (
                    <section className="home-section">
                      <div className="home-products-header">
                        <h2 className="home-products-title">
                          {searchQuery
                            ? `Kết quả tìm kiếm: "${searchQuery}"`
                            : 'Tất cả sản phẩm'}
                        </h2>
                        <div className="home-products-count">
                          {total} sản phẩm
                        </div>
                      </div>

                      <div className="home-products-grid">
                        {products.map(renderProductCard)}
                      </div>

                      {totalPages > 1 && (
                        <div className="home-pagination">
                          <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                              setPage((prev) => Math.max(1, prev - 1))
                            }
                            className="home-pagination-button"
                          >
                            ← Trang trước
                          </button>
                          <span className="home-pagination-info">
                            Trang {page}/{totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() =>
                              setPage((prev) =>
                                Math.min(totalPages, prev + 1),
                              )
                            }
                            className="home-pagination-button"
                          >
                            Trang sau →
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                </section>
              </div>

              {/* Footer giống phác thảo */}
              <footer className="home-footer">
                <div className="home-footer-inner">
                  <div className="home-footer-column">
                    <div className="home-footer-heading">Home</div>
                    <button type="button" className="home-footer-link">
                      About us
                    </button>
                    <button type="button" className="home-footer-link">
                      Tính năng
                    </button>
                    <button type="button" className="home-footer-link">
                      Liên hệ
                    </button>
                  </div>
                  <div className="home-footer-column">
                    <div className="home-footer-heading">Categories</div>
                    <button type="button" className="home-footer-link">
                      Thời trang
                    </button>
                    <button type="button" className="home-footer-link">
                      Hành tinh
                    </button>
                    <button type="button" className="home-footer-link">
                      Career
                    </button>
                  </div>
                  <div className="home-footer-column">
                    <div className="home-footer-heading">Contact</div>
                    <button type="button" className="home-footer-link">
                      Liên hệ
                    </button>
                    <button type="button" className="home-footer-link">
                      Dịch vụ khách hàng
                    </button>
                    <button type="button" className="home-footer-link">
                      Hỗ trợ vận chuyển
                    </button>
                  </div>
                  <div className="home-footer-column">
                    <div className="home-footer-heading">Log out</div>
                    <button
                      type="button"
                      className="home-footer-link"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
