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

function getShortName(name?: string | null) {
  const cleanName = (name ?? '').trim();

  if (!cleanName) return '';

  const parts = cleanName.split(/\s+/);
  return parts[parts.length - 1];
}

function getParentCategories(categories: Category[]) {
  // API /categories/tree trả về mảng ngoài là category cha.
  // children vẫn có trong object nhưng MainLayout không render children.
  return categories.slice(0, 10);
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountAvatar, setAccountAvatar] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const token = getFallbackToken();
  const isLoggedIn = Boolean(token);

  const parentCategories = useMemo(() => {
    return getParentCategories(categories);
  }, [categories]);

  const activeCategorySlug = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') ?? '';
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setKeyword(params.get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      const currentToken = getFallbackToken();

      if (!currentToken) {
        setAccountName('');
        setAccountAvatar('');
        return;
      }

      try {
        const user = await getMe();

        if (!mounted) return;

        setAccountName(user.name || user.email || user.phone || '');
        setAccountAvatar(user.avatarUrl || '');
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

    async function loadCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError('');

        const res = await getPublicCategoryTree();

        if (!mounted) return;

        setCategories(res.data ?? []);
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

  const accountPath = isLoggedIn ? '/me' : '/login';

  const accountLabel = useMemo(() => {
    if (!isLoggedIn) return 'Đăng nhập';

    const shortName = getShortName(accountName);

    if (shortName) return shortName;

    return 'Tài khoản';
  }, [accountName, isLoggedIn]);

  return (
    <div className="main-layout">
      {/* Thanh thông tin nhỏ phía trên */}
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

      {/* Header chính */}
      <header className="mochi-header">
        <div className="mochi-container mochi-header-inner">
          {/* Logo */}
          <Link to="/" className="mochi-logo" aria-label="Mochi home">
            <img src={logoImg} alt="Mochi" />
            <div>
              <strong>Mochi</strong>
              <span>Cute things for you ♡</span>
            </div>
          </Link>

          {/* Search sản phẩm */}
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

          {/* Action */}
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
                  <strong>{accountLabel}</strong>
                ) : (
                  <strong>Đăng nhập</strong>
                )}
              </span>
            </Link>

            <Link to="/cart" className="header-action">
              <span className="header-action-icon">🛒</span>
              <span>Giỏ hàng</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Menu chính */}
      <nav className="mochi-nav">
        <div className="mochi-container mochi-nav-inner">
          <NavLink to="/" end>
            🏠 Trang chủ
          </NavLink>

          <NavLink to="/products">🧸 Sản phẩm</NavLink>

          <NavLink to="/shops/me">🏪 Cửa hàng</NavLink>

          <NavLink to="/orders">📦 Đơn hàng</NavLink>

          <NavLink to="/me">💗 Tài khoản</NavLink>

          <NavLink to="/cart">🛒 Giỏ hàng</NavLink>
        </div>
      </nav>

      {/* Category cha */}
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
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} />
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
    </div>
  );
}