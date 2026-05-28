// src/router/index.tsx
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// ==================== LAYOUT ====================
import MainLayout from '../components/layout/MainLayout';

// ==================== AUTH ====================
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RecoverRequestPage from '../pages/auth/RecoverRequestPage';
import RecoverConfirmPage from '../pages/auth/RecoverConfirmPage';

// ==================== USER / MAIN ====================
import HomePage from '../pages/home/HomePage';
import MeProfilePage from '../pages/me/MeProfilePage';
import ChangePasswordPage from '../pages/me/ChangePasswordPage';
import AddressesPage from '../pages/addresses/AddressesPage';

// ==================== CART / CHECKOUT ====================
import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';

// ==================== ORDERS ====================
import OrdersPage from '../pages/orders/OrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';

// ==================== PAYMENT ====================
import PaymentResultPage from '../pages/payments/PaymentResultPage';

// ==================== PRODUCTS ====================
import ProductsListPage from '../pages/products/ProductsListPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import ProductCreatePage from '../pages/products/ProductCreatePage';
import ProductEditPage from '../pages/products/ProductEditPage';
import ProductVariantsPage from '../pages/products/ProductVariantsPage';

// ==================== SHOPS ====================
import MyShopPage from '../pages/shops/MyShopPage';
import ShopRegisterPage from '../pages/shops/ShopRegisterPage';
import ShopDetailsPage from '../pages/shops/ShopDetailsPage';
import ShopProductsPage from '../pages/shops/ShopProductsPage';
import ShopOrdersPage from '../pages/shops/ShopOrdersPage';
import ShopRevenuePage from '../pages/shops/ShopRevenuePage';
import ShopReviewsPage from '../pages/shops/ShopReviewsPage';
import ShopSettingsPage from '../pages/shops/ShopSettingsPage';

// ==================== ADMIN ====================
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage';
import AdminShopsListPage from '../pages/admin/shops/AdminShopsListPage';

function ProductEditAlias() {
  const { id } = useParams();

  return <Navigate to={`/shops/me/products/${id}/edit`} replace />;
}

function ProductVariantsAlias() {
  const { id } = useParams();

  return <Navigate to={`/shops/me/products/${id}/variants`} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ==================== ROOT ==================== */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* ==================== AUTH ROUTES ==================== */}
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

      {/* ==================== MAIN LAYOUT ROUTES ==================== */}
      <Route element={<MainLayout />}>
        {/* ---------- HOME ---------- */}
        <Route path="/home" element={<HomePage />} />

        {/* ---------- USER ACCOUNT ---------- */}
        <Route path="/me" element={<MeProfilePage />} />
        <Route path="/me/profile" element={<MeProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="/me/change-password"
          element={<Navigate to="/change-password" replace />}
        />

        <Route path="/addresses" element={<AddressesPage />} />

        {/* Alias user cũ */}
        <Route path="/profile" element={<Navigate to="/me" replace />} />
        <Route path="/account" element={<Navigate to="/me" replace />} />
        <Route path="/address" element={<Navigate to="/addresses" replace />} />
        <Route
          path="/my-addresses"
          element={<Navigate to="/addresses" replace />}
        />

        {/* ---------- CART / CHECKOUT ---------- */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* ---------- ORDERS ---------- */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        {/* ---------- PAYMENT ---------- */}
        <Route path="/payments/result" element={<PaymentResultPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* ---------- SHOP OWNER ---------- */}
        <Route path="/shops" element={<Navigate to="/shops/me" replace />} />
        <Route path="/shops/me" element={<MyShopPage />} />
        <Route path="/shops/register" element={<ShopRegisterPage />} />

        <Route path="/shops/me/products" element={<ShopProductsPage />} />
        <Route path="/shops/me/orders" element={<ShopOrdersPage />} />
        <Route path="/shops/me/revenue" element={<ShopRevenuePage />} />
        <Route path="/shops/me/reviews" element={<ShopReviewsPage />} />
        <Route path="/shops/me/settings" element={<ShopSettingsPage />} />

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

        {/* Xem trước shop public */}
        <Route path="/shops/:id" element={<ShopDetailsPage />} />

        {/* ---------- PRODUCT PUBLIC / ALIAS ---------- */}
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route
          path="/products/create"
          element={<Navigate to="/shops/me/products/create" replace />}
        />

        <Route path="/products/:id/edit" element={<ProductEditAlias />} />

        <Route
          path="/products/:id/variants"
          element={<ProductVariantsAlias />}
        />

        {/* ---------- ADMIN TẠM THỜI ---------- */}
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/shops" element={<AdminShopsListPage />} />
      </Route>

      {/* ==================== FALLBACK ==================== */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}