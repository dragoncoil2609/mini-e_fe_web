// src/components/layout/MainLayout.tsx
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import logoImg from '../../assets/brand/bunny_bear_original.png';
import defaultAvatarImg from '../../assets/brand/login_bunny_bear.png';

import {
  getAccessToken,
  clearAccessToken,
} from '../../api/authToken';
import { AuthApi } from '../../api/auth.api';
import { getMe } from '../../api/users.api';
import { CartApi } from '../../api/cart.api';
import { OrdersApi } from '../../api/orders.api';
import {
  getHomeCategories,
  type Category,
} from '../../api/categories.api';

import './MainLayout.css';

const CATEGORY_PAGE_SIZE = 10;

function getFallbackToken() {
  return (
    getAccessToken?.() ||
    localStorage.getItem('mini_e_access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
}

function clearAuthStorage() {
  clearAccessToken();

  localStorage.removeItem('mini_e_access_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  sessionStorage.removeItem('user');
}

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getShortName(name?: string | null) {
  const cleanName = (name ?? '').trim();

  if (!cleanName) return '';

  const parts = cleanName.split(/\s+/);
  return parts[parts.length - 1];
}

function getSafeCartQuantity(cart: any): number {
  const itemsQuantity = Number(cart?.itemsQuantity ?? 0);

  if (Number.isFinite(itemsQuantity) && itemsQuantity > 0) {
    return itemsQuantity;
  }

  if (Array.isArray(cart?.items)) {
    return cart.items.reduce((sum: number, item: any) => {
      const quantity = Number(item?.quantity ?? 0);
      return sum + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }

  return 0;
}

function getSafeOrdersTotal(result: any): number {
  const total = Number(result?.total ?? 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountAvatar, setAccountAvatar] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const [cartQuantity, setCartQuantity] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryPage, setCategoryPage] = useState(0);

  const activeCategoryId = useMemo(() => {
    const match = location.pathname.match(/^\/products\/category\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  const categoryTotalPages = useMemo(() => {
    return Math.max(Math.ceil(categories.length / CATEGORY_PAGE_SIZE), 1);
  }, [categories.length]);

  const visibleCategories = useMemo(() => {
    const start = categoryPage * CATEGORY_PAGE_SIZE;
    return categories.slice(start, start + CATEGORY_PAGE_SIZE);
  }, [categories, categoryPage]);

  const canPrevCategory = categoryPage > 0;
  const canNextCategory = categoryPage < categoryTotalPages - 1;

  const accountLabel = useMemo(() => {
    const shortName = getShortName(accountName);

    if (shortName) return shortName;

    return 'Tài khoản';
  }, [accountName]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setKeyword(params.get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    if (categoryPage > categoryTotalPages - 1) {
      setCategoryPage(Math.max(categoryTotalPages - 1, 0));
    }
  }, [categoryPage, categoryTotalPages]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      const currentToken = getFallbackToken();

      if (!currentToken) {
        if (!mounted) return;

        setIsLoggedIn(false);
        setAccountName('');
        setAccountAvatar('');
        return;
      }

      try {
        const response = await getMe();
        const user = unwrapApiData<any>(response);

        if (!mounted) return;

        if (!user?.id && !user?.email && !user?.phone && !user?.name) {
          clearAuthStorage();
          setIsLoggedIn(false);
          setAccountName('');
          setAccountAvatar('');
          return;
        }

        setIsLoggedIn(true);
        setAccountName(user?.name || user?.email || user?.phone || '');
        setAccountAvatar(user?.avatarUrl || user?.avatar || '');
      } catch {
        if (!mounted) return;

        clearAuthStorage();
        setIsLoggedIn(false);
        setAccountName('');
        setAccountAvatar('');
      }
    }

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    async function loadCartQuantity() {
      const currentToken = getFallbackToken();

      if (!currentToken || !isLoggedIn) {
        if (mounted) {
          setCartQuantity(0);
        }

        return;
      }

      try {
        const response = await CartApi.getCart();
        const cart = unwrapApiData<any>(response);

        if (!mounted) return;

        setCartQuantity(getSafeCartQuantity(cart));
      } catch {
        if (!mounted) return;

        setCartQuantity(0);
      }
    }

    void loadCartQuantity();

    window.addEventListener('mochi-cart-updated', loadCartQuantity);
    window.addEventListener('storage', loadCartQuantity);

    return () => {
      mounted = false;
      window.removeEventListener('mochi-cart-updated', loadCartQuantity);
      window.removeEventListener('storage', loadCartQuantity);
    };
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    let mounted = true;

    async function loadOrdersTotal() {
      const currentToken = getFallbackToken();

      if (!currentToken || !isLoggedIn) {
        if (mounted) {
          setOrdersTotal(0);
        }

        return;
      }

      try {
        const response = await OrdersApi.getMyOrders({ page: 1, limit: 1 });
        const result = unwrapApiData<any>(response);

        if (!mounted) return;

        setOrdersTotal(getSafeOrdersTotal(result));
      } catch {
        if (!mounted) return;

        setOrdersTotal(0);
      }
    }

    void loadOrdersTotal();

    window.addEventListener('mochi-orders-updated', loadOrdersTotal);
    window.addEventListener('storage', loadOrdersTotal);

    return () => {
      mounted = false;
      window.removeEventListener('mochi-orders-updated', loadOrdersTotal);
      window.removeEventListener('storage', loadOrdersTotal);
    };
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError('');

        const res = await getHomeCategories();

        if (!mounted) return;

        const data = unwrapApiData<Category[]>(res);
        setCategories(Array.isArray(data) ? data : []);
        setCategoryPage(0);
      } catch {
        if (!mounted) return;

        setCategories([]);
        setCategoryPage(0);
        setCategoryError('Không tải được danh mục');
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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const q = keyword.trim();

    if (!q) {
      navigate('/products');
      return;
    }

    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  function goPrevCategoryPage() {
    setCategoryPage((prev) => Math.max(prev - 1, 0));
  }

  function goNextCategoryPage() {
    setCategoryPage((prev) => Math.min(prev + 1, categoryTotalPages - 1));
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await AuthApi.logout();
    } catch {
      // Nếu API logout lỗi vẫn xóa token ở FE để user thoát được.
    } finally {
      clearAuthStorage();

      setIsLoggedIn(false);
      setAccountName('');
      setAccountAvatar('');
      setCartQuantity(0);
      setOrdersTotal(0);
      setLoggingOut(false);

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('mochi-cart-updated'));
      window.dispatchEvent(new Event('mochi-orders-updated'));

      navigate('/login', {
        replace: true,
        state: {
          message: 'Bạn đã đăng xuất thành công.',
        },
      });
    }
  }

  return (
    <div className="main-layout">
      <div className="mochi-topbar">
        <div className="mochi-container mochi-topbar-inner">
          <div className="topbar-left">
            <span>🚚 Miễn phí vận chuyển cho đơn hàng từ 300k</span>
            <span>🛡️ Đổi trả trong 7 ngày</span>
          </div>

          <div className="topbar-right">
            <Link to="/support">♡ Hỗ trợ</Link>
            <Link to="/faq">ⓘ Câu hỏi thường gặp</Link>
          </div>
        </div>
      </div>

      <header className="mochi-header">
        <div className="mochi-container mochi-header-inner">
          <Link to="/home" className="mochi-logo" aria-label="Mochi home">
            <img src={logoImg} alt="Mochi" />
            <div>
              <strong>Mochi</strong>
              <span>Cute things for you ♡</span>
            </div>
          </Link>

          <form className="mochi-search" onSubmit={handleSearch}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Bạn tìm gì hôm nay?"
              aria-label="Tìm kiếm sản phẩm"
            />

            <button type="submit" aria-label="Tìm kiếm">
              🔍
            </button>
          </form>

          <div className="mochi-header-actions">
            {isLoggedIn ? (
              <div className="account-menu-wrap">
                <Link to="/me" className="header-action account-action">
                  <span className="header-avatar-wrap">
                    <img
                      src={accountAvatar || defaultAvatarImg}
                      alt="Avatar"
                      className="header-avatar"
                    />
                  </span>

                  <span className="header-action-text">
                    <small>Tài khoản</small>
                    <strong>{accountLabel}</strong>
                  </span>
                </Link>

                <div className="account-dropdown">
                  <Link to="/me">Tài Khoản Của Tôi</Link>
                  <Link to="/orders">Đơn Mua</Link>

                  <button
                    onClick={handleLogout}  
                  >
                    {loggingOut ? 'Đang đăng xuất...' : 'Đăng Xuất'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="guest-auth-actions">
                <Link to="/login" className="guest-auth-btn guest-auth-login">
                  Đăng nhập
                </Link>

                <Link
                  to="/register"
                  className="guest-auth-btn guest-auth-register"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            <Link to="/cart" className="header-action cart-header-action">
              <span className="header-action-icon">🛒</span>
              <span className="header-action-label">Giỏ hàng</span>

              {cartQuantity > 0 ? (
                <span className="cart-badge">
                  {cartQuantity > 99 ? '99+' : cartQuantity}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <nav className="mochi-nav">
        <div className="mochi-container mochi-nav-inner">
          <NavLink to="/home">🏠 Trang chủ</NavLink>

          <NavLink to="/products">🧸 Sản phẩm</NavLink>

          <NavLink to="/shops/me">🏪 Cửa hàng</NavLink>

          <NavLink to="/orders">
            📦 Đơn hàng
            {ordersTotal > 0 ? (
              <small style={{ marginLeft: 6 }}>
                ({ordersTotal > 99 ? '99+' : ordersTotal})
              </small>
            ) : null}
          </NavLink>

          <NavLink to="/me">💗 Tài khoản</NavLink>

          <NavLink to="/cart">🛒 Giỏ hàng</NavLink>
        </div>
      </nav>

      <section className="mochi-category-bar">
        <div className="mochi-container">
          {categoryLoading || categoryError ? (
            <div className="mochi-category-state">
              {categoryLoading ? 'Đang tải danh mục...' : categoryError}
            </div>
          ) : null}

          {!categoryLoading && visibleCategories.length > 0 && (
            <div className="mochi-category-row">
              {categories.length > CATEGORY_PAGE_SIZE ? (
                <button
                  type="button"
                  className="mochi-category-side-btn"
                  onClick={goPrevCategoryPage}
                  disabled={!canPrevCategory}
                  aria-label="Danh mục trước"
                >
                  ‹
                </button>
              ) : null}

              <div className="mochi-category-scroll">
                {visibleCategories.map((category) => {
                  const isActive = activeCategoryId === category.id;
                  const categoryImage = category.imageUrl || '';

                  return (
                    <Link
                      key={category.id}
                      to={`/products/category/${category.id}`}
                      className={`mochi-category-pill ${
                        isActive ? 'active' : ''
                      }`}
                    >
                      <span className="mochi-category-thumb">
                        {categoryImage ? (
                          <img src={categoryImage} alt={category.name} />
                        ) : (
                          <span>🐰</span>
                        )}
                      </span>

                      <span className="mochi-category-name">
                        {category.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {categories.length > CATEGORY_PAGE_SIZE ? (
                <button
                  type="button"
                  className="mochi-category-side-btn"
                  onClick={goNextCategoryPage}
                  disabled={!canNextCategory}
                  aria-label="Danh mục tiếp theo"
                >
                  ›
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <main className="main-layout-main">
        <Outlet />
      </main>

      <footer className="mochi-footer">
        <div className="mochi-container mochi-footer-inner">
          <div className="mochi-footer-brand">
            <Link to="/home" className="mochi-footer-logo">
              <img src={logoImg} alt="Mochi" />
              <div>
                <strong>Mochi</strong>
                <span>Cute things for you ♡</span>
              </div>
            </Link>

            <p>Những món đồ nhỏ xinh, dễ thương và đáng yêu dành cho bạn.</p>
          </div>

          <div className="mochi-footer-col">
            <h3>Về Mochi</h3>
            <Link to="/about">Giới thiệu</Link>
            <Link to="/jobs">Tuyển dụng</Link>
            <Link to="/news">Tin tức</Link>
          </div>

          <div className="mochi-footer-col">
            <h3>Chính sách</h3>
            <Link to="/privacy">Chính sách bảo mật</Link>
            <Link to="/returns">Chính sách đổi trả</Link>
            <Link to="/terms">Điều khoản sử dụng</Link>
          </div>

          <div className="mochi-footer-col">
            <h3>Hỗ trợ</h3>
            <Link to="/support">Trung tâm trợ giúp</Link>
            <Link to="/guide">Hướng dẫn mua hàng</Link>
            <Link to="/contact">Liên hệ với chúng tôi</Link>
          </div>

          <div className="mochi-footer-col">
            <h3>Kết nối với chúng tôi</h3>

            <div className="mochi-socials">
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="Instagram">
                ◎
              </a>
              <a href="#" aria-label="TikTok">
                ♪
              </a>
              <a href="#" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>
        </div>

        <div className="mochi-container mochi-footer-bottom">
          © 2024 Mochi Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}