// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, ProductListItem, PaginatedResult, ApiResponse } from '../api/types';
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
        const payload = (res as unknown as ApiResponse<PaginatedResult<ProductListItem>>).data;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadProducts();
  };

  const handleAddToCart = async (productId: number, e: React.MouseEvent) => {
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
        err?.response?.data?.message || 'Thêm vào giỏ hàng thất bại. Vui lòng đăng nhập.',
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

  return (
    <div className="home-container">
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
              placeholder="Tìm kiếm sản phẩm..."
              className="home-search-input"
            />
            <button type="submit" className="home-search-button">
              🔍
            </button>
          </form>

          <div className="home-header-right">
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
              <div className="home-products-header">
                <h2 className="home-products-title">
                  {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Tất cả sản phẩm'}
                </h2>
                <div className="home-products-count">
                  {total} sản phẩm
                </div>
              </div>

              {products.length === 0 ? (
                <div className="home-empty">
                  {searchQuery
                    ? `Không tìm thấy sản phẩm nào với từ khóa "${searchQuery}"`
                    : 'Chưa có sản phẩm nào.'}
                </div>
              ) : (
                <>
                  <div className="home-products-grid">
                    {products.map((product) => {
                      const isAdding = addingToCart.has(product.id);
                      const imageUrl = getMainImageUrl(product);

                      return (
                        <div
                          key={product.id}
                          className="home-product-card"
                        >
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
                              <div className="home-product-image-placeholder">
                                📦
                              </div>
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
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="home-pagination">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="home-pagination-button"
                      >
                        Trang sau →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
