import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';

import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

import { getAccessToken } from '../api/authToken';
import { getMe } from '../api/users.api';
import type { User } from '../api/types';

/* =========================
   AUTH PAGES
   ========================= */
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RecoverRequestPage from '../pages/auth/RecoverRequestPage';
import RecoverConfirmPage from '../pages/auth/RecoverConfirmPage';

/* =========================
   PUBLIC / HOME
   ========================= */
import HomePage from '../pages/home/HomePage';

/* =========================
   ACCOUNT
   ========================= */
import MeProfilePage from '../pages/me/MeProfilePage';
import ChangePasswordPage from '../pages/me/ChangePasswordPage';
import AddressesPage from '../pages/addresses/AddressesPage';
import FavoriteProductsPage from '../pages/favorites/FavoriteProductsPage';

/* =========================
   CART / CHECKOUT / ORDERS
   ========================= */
import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';

import OrdersPage from '../pages/orders/OrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';

import PaymentResultPage from '../pages/payments/PaymentResultPage';

/* =========================
   PRODUCTS
   ========================= */
import ProductsListPage from '../pages/products/ProductsListPage';
import ProductCategoryPage from '../pages/products/ProductCategoryPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import ProductCreatePage from '../pages/products/ProductCreatePage';
import ProductEditPage from '../pages/products/ProductEditPage';
import ProductVariantsPage from '../pages/products/ProductVariantsPage';

/* =========================
   SHOPS
   ========================= */
import MyShopPage from '../pages/shops/MyShopPage';
import ShopRegisterPage from '../pages/shops/ShopRegisterPage';
import ShopDetailsPage from '../pages/shops/ShopDetailsPage';
import ShopProductsPage from '../pages/shops/ShopProductsPage';
import ShopOrdersPage from '../pages/shops/ShopOrdersPage';
import ShopRevenuePage from '../pages/shops/ShopRevenuePage';
import ShopReviewsPage from '../pages/shops/ShopReviewsPage';
import ShopSettingsPage from '../pages/shops/ShopSettingsPage';

/* =========================
   ADMIN
   ========================= */
import HomePageAdmin from '../pages/admin/HomePageAdmin';
import AdminUsersPage from '../pages/admin/users/AdminUsersPage';
import DeletedUsersPage from '../pages/admin/users/DeletedUsersPage';
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage';
import AdminShopsListPage from '../pages/admin/shops/AdminShopsListPage';
import AdminProductsPage from '../pages/admin/products/AdminProductsPage';
import AdminProductDetailPage from '../pages/admin/products/AdminProductDetailPage';

/* =========================
   HELPERS
   ========================= */

function unwrapApiData<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function getToken() {
  return (
    getAccessToken?.() ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
}

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/* =========================
   LOGIN REQUIRED PAGE
   ========================= */

function LoginRequiredPage() {
  const location = useLocation();

  return (
    <div style={loginRequiredStyles.page}>
      <div style={loginRequiredStyles.card}>
        <div style={loginRequiredStyles.icon}>🔐</div>

        <h2 style={loginRequiredStyles.title}>Vui lòng đăng nhập</h2>

        <p style={loginRequiredStyles.desc}>
          Bạn cần đăng nhập để sử dụng chức năng này.
        </p>

        <Link
          to="/login"
          state={{ from: location.pathname + location.search }}
          style={loginRequiredStyles.loginBtn}
        >
          Đăng nhập ngay
        </Link>

        <Link to="/home" style={loginRequiredStyles.backBtn}>
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}

const loginRequiredStyles = {
  page: {
    minHeight: '520px',
    padding: '70px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at top, rgba(255, 143, 179, 0.18), transparent 36%), #fff7fa',
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    padding: '38px 30px',
    borderRadius: '28px',
    background: '#ffffff',
    border: '1px solid #ffd6e3',
    boxShadow: '0 22px 60px rgba(255, 79, 135, 0.14)',
    textAlign: 'center' as const,
  },
  icon: {
    width: '72px',
    height: '72px',
    margin: '0 auto 18px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#fff1f6',
    fontSize: '34px',
  },
  title: {
    margin: 0,
    color: '#332027',
    fontSize: '28px',
    fontWeight: 950,
  },
  desc: {
    margin: '12px 0 26px',
    color: '#8a6571',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1.6,
  },
  loginBtn: {
    minHeight: '46px',
    padding: '0 24px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #ff4f87, #f73576)',
    fontSize: '15px',
    fontWeight: 900,
    boxShadow: '0 14px 28px rgba(255, 79, 135, 0.25)',
    textDecoration: 'none',
  },
  backBtn: {
    marginTop: '16px',
    display: 'block',
    color: '#ff4f87',
    fontSize: '14px',
    fontWeight: 850,
    textDecoration: 'none',
  },
};

/* =========================
   REQUIRE AUTH GATE
   ========================= */

function RequireAuth() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkLogin() {
      const token = getToken();

      if (!token) {
        if (!mounted) return;

        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        const response = await getMe();
        const user = unwrapApiData<User>(response);

        if (!mounted) return;

        if (user?.id || user?.email || user?.phone) {
          setAllowed(true);
        } else {
          clearAuthStorage();
          setAllowed(false);
        }
      } catch {
        if (!mounted) return;

        clearAuthStorage();
        setAllowed(false);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void checkLogin();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div style={routeLoadingStyles.page}>
        <span>Đang kiểm tra đăng nhập...</span>
      </div>
    );
  }

  if (!allowed) {
    return <LoginRequiredPage />;
  }

  return <Outlet />;
}

const routeLoadingStyles = {
  page: {
    minHeight: '360px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ff4f87',
    fontSize: '15px',
    fontWeight: 900,
  },
};

/* =========================
   ADMIN GATE
   ========================= */

function AdminGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const token = getToken();

      if (!token) {
        if (!mounted) return;

        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        const me = unwrapApiData<User>(response);

        if (!mounted) return;

        setUser(me);

        const role = String(me?.role ?? '').toUpperCase();
        setAllowed(role === 'ADMIN');
      } catch {
        if (!mounted) return;

        clearAuthStorage();
        setAllowed(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-route-loading">
        <span>Đang kiểm tra quyền quản trị...</span>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout currentUser={user} />;
}

/* =========================
   ROUTE ALIASES
   ========================= */

function ProductEditAlias() {
  const { id } = useParams();

  return <Navigate to={`/shops/me/products/${id}/edit`} replace />;
}

function ProductVariantsAlias() {
  const { id } = useParams();

  return <Navigate to={`/shops/me/products/${id}/variants`} replace />;
}

/* =========================
   APP ROUTES
   ========================= */

export default function AppRoutes() {
  return (
    <Routes>
      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* AUTH */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/auth/account/recover/request"
        element={<RecoverRequestPage />}
      />
      <Route
        path="/auth/account/recover/confirm"
        element={<RecoverConfirmPage />}
      />

      {/* MAIN USER LAYOUT */}
      <Route element={<MainLayout />}>
        {/* PUBLIC */}
        <Route path="/home" element={<HomePage />} />

        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/trend" element={<ProductsListPage />} />
        <Route
          path="/products/category/:categoryId"
          element={<ProductCategoryPage />}
        />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route path="/shops/:id" element={<ShopDetailsPage />} />

        <Route path="/payments/result" element={<PaymentResultPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* NEED LOGIN */}
        <Route element={<RequireAuth />}>
          {/* ACCOUNT */}
          <Route path="/me" element={<MeProfilePage />} />
          <Route path="/me/profile" element={<MeProfilePage />} />
          <Route path="/profile" element={<Navigate to="/me" replace />} />
          <Route path="/account" element={<Navigate to="/me" replace />} />

          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route
            path="/me/change-password"
            element={<Navigate to="/change-password" replace />}
          />

          <Route path="/addresses" element={<AddressesPage />} />
          <Route
            path="/address"
            element={<Navigate to="/addresses" replace />}
          />
          <Route
            path="/my-addresses"
            element={<Navigate to="/addresses" replace />}
          />

          <Route path="/favorites" element={<FavoriteProductsPage />} />
          <Route
            path="/me/favorites"
            element={<Navigate to="/favorites" replace />}
          />

          {/* CART / CHECKOUT */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ORDERS */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          {/* MY SHOP */}
          <Route path="/shops" element={<Navigate to="/shops/me" replace />} />
          <Route path="/shops/me" element={<MyShopPage />} />
          <Route path="/shops/register" element={<ShopRegisterPage />} />
          <Route path="/shops/me/products" element={<ShopProductsPage />} />
          <Route path="/shops/me/orders" element={<ShopOrdersPage />} />
          <Route path="/shops/me/revenue" element={<ShopRevenuePage />} />
          <Route path="/shops/me/reviews" element={<ShopReviewsPage />} />
          <Route path="/shops/me/settings" element={<ShopSettingsPage />} />

          {/* SELLER PRODUCTS */}
          <Route
            path="/shops/me/products/create"
            element={<ProductCreatePage />}
          />
          <Route
            path="/shops/me/products/:id/edit"
            element={<ProductEditPage />}
          />
          <Route
            path="/shops/me/products/:id/variants"
            element={<ProductVariantsPage />}
          />

          {/* OLD PRODUCT ROUTE ALIAS */}
          <Route
            path="/products/create"
            element={<Navigate to="/shops/me/products/create" replace />}
          />
          <Route path="/products/:id/edit" element={<ProductEditAlias />} />
          <Route
            path="/products/:id/variants"
            element={<ProductVariantsAlias />}
          />
        </Route>
      </Route>

      {/* ADMIN */}
      <Route path="/admin" element={<AdminGate />}>
        <Route index element={<HomePageAdmin />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/deleted" element={<DeletedUsersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="shops" element={<AdminShopsListPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/:id" element={<AdminProductDetailPage />} />
      </Route>

      {/* NOT FOUND */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}