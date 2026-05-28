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

import { getAccessToken } from '../../api/authToken';
import { getMe } from '../../api/users.api';
import { CartApi } from '../../api/cart.api';
import {
  getPublicCategoryTree,
  type Category,
} from '../../api/categories.api';

import './MainLayout.css';

function getFallbackToken() {
  return (
    getAccessToken?.() ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
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

function getParentCategories(categories: Category[]) {
  return categories.slice(0, 10);
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

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountAvatar, setAccountAvatar] = useState('');
  const [cartQuantity, setCartQuantity] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const isLoggedIn = Boolean(getFallbackToken());

  const parentCategories = useMemo(() => {
    return getParentCategories(categories);
  }, [categories]);

  const activeCategorySlug = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') ?? '';
  }, [location.search]);

  const accountPath = isLoggedIn ? '/me' : '/login';

  const accountLabel = useMemo(() => {
    if (!isLoggedIn) return 'Đăng nhập';

    const shortName = getShortName(accountName);

    if (shortName) return shortName;

    return 'Tài khoản';
  }, [accountName, isLoggedIn]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setKeyword(params.get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      const currentToken = getFallbackToken();

      if (!currentToken) {
        if (!mounted) return;

        setAccountName('');
        setAccountAvatar('');
        return;
      }

      try {
        const response = await getMe();
        const user = unwrapApiData<any>(response);

        if (!mounted) return;

        setAccountName(user?.name || user?.email || user?.phone || '');
        setAccountAvatar(user?.avatarUrl || '');
      } catch {
        if (!mounted) return;

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

      if (!currentToken) {
        if (mounted) {
          setCartQuantity(0);
        }

        return;
      }

      try {
        /**
         * cart.api.ts hiện có:
         * CartApi.getCart()
         *
         * API BE:
         * GET /cart
         *
         * Response thường là:
         * {
         *   success: true,
         *   data: {
         *     id,
         *     itemsCount,
         *     itemsQuantity,
         *     subtotal,
         *     items: []
         *   }
         * }
         */
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

    /**
     * Khi ProductDetailPage / CartPage thêm, sửa, xóa sản phẩm
     * thì dispatch event này để MainLayout gọi lại GET /cart.
     */
    window.addEventListener('mochi-cart-updated', loadCartQuantity);

    /**
     * Dùng khi login/logout hoặc token thay đổi ở tab khác.
     */
    window.addEventListener('storage', loadCartQuantity);

    return () => {
      mounted = false;
      window.removeEventListener('mochi-cart-updated', loadCartQuantity);
      window.removeEventListener('storage', loadCartQuantity);
    };
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError('');

        const res = await getPublicCategoryTree();

        if (!mounted) return;

        const data = unwrapApiData<Category[]>(res);
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;

        setCategories([]);
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
            <Link to={accountPath} className="header-action account-action">
              <span className="header-avatar-wrap">
                <img
                  src={
                    isLoggedIn
                      ? accountAvatar || defaultAvatarImg
                      : defaultAvatarImg
                  }
                  alt="Avatar"
                  className="header-avatar"
                />
              </span>

              <span className="header-action-text">
                {isLoggedIn ? (
                  <>
                    <small>Tài khoản</small>
                    <strong>{accountLabel}</strong>
                  </>
                ) : (
                  <strong>Đăng nhập</strong>
                )}
              </span>
            </Link>

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

          <NavLink to="/orders">📦 Đơn hàng</NavLink>

          <NavLink to="/me">💗 Tài khoản</NavLink>

          <NavLink to="/cart">🛒 Giỏ hàng</NavLink>
        </div>
      </nav>

      <section className="mochi-category-bar">
        <div className="mochi-container">
          <div className="mochi-category-header">
            <span>Danh mục nổi bật</span>

            {categoryLoading && <small>Đang tải...</small>}
            {!categoryLoading && categoryError && <small>{categoryError}</small>}
          </div>

          {!categoryLoading && parentCategories.length > 0 && (
            <div className="mochi-category-scroll">
              {parentCategories.map((category) => {
                const isActive = activeCategorySlug === category.slug;
                const categoryImage = category.imageUrl ||'';

                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${encodeURIComponent(
                      category.slug,
                    )}`}
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