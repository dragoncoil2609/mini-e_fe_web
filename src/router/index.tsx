import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

import { getMe } from '../api/users.api';
import type { User } from '../api/types';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RecoverRequestPage from '../pages/auth/RecoverRequestPage';
import RecoverConfirmPage from '../pages/auth/RecoverConfirmPage';

import HomePage from '../pages/home/HomePage';
import MeProfilePage from '../pages/me/MeProfilePage';
import ChangePasswordPage from '../pages/me/ChangePasswordPage';
import AddressesPage from '../pages/addresses/AddressesPage';

import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';

import OrdersPage from '../pages/orders/OrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';

import PaymentResultPage from '../pages/payments/PaymentResultPage';

import ProductsListPage from '../pages/products/ProductsListPage';
import ProductCategoryPage from '../pages/products/ProductCategoryPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import ProductCreatePage from '../pages/products/ProductCreatePage';
import ProductEditPage from '../pages/products/ProductEditPage';
import ProductVariantsPage from '../pages/products/ProductVariantsPage';

import MyShopPage from '../pages/shops/MyShopPage';
import ShopRegisterPage from '../pages/shops/ShopRegisterPage';
import ShopDetailsPage from '../pages/shops/ShopDetailsPage';
import ShopProductsPage from '../pages/shops/ShopProductsPage';
import ShopOrdersPage from '../pages/shops/ShopOrdersPage';
import ShopRevenuePage from '../pages/shops/ShopRevenuePage';
import ShopReviewsPage from '../pages/shops/ShopReviewsPage';
import ShopSettingsPage from '../pages/shops/ShopSettingsPage';

import HomePageAdmin from '../pages/admin/HomePageAdmin';
import AdminUsersPage from '../pages/admin/users/AdminUsersPage';
import DeletedUsersPage from '../pages/admin/users/DeletedUsersPage';
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage';
import AdminShopsListPage from '../pages/admin/shops/AdminShopsListPage';
import AdminProductsPage from '../pages/admin/products/AdminProductsPage';
import AdminProductDetailPage from '../pages/admin/products/AdminProductDetailPage';

function ProductEditAlias() {
  const { id } = useParams();
  return <Navigate to={`/shops/me/products/${id}/edit`} replace />;
}

function ProductVariantsAlias() {
  const { id } = useParams();
  return <Navigate to={`/shops/me/products/${id}/variants`} replace />;
}

function AdminGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const me = await getMe();

        if (!mounted) return;

        setUser(me);
        setAllowed(me.role === 'ADMIN');
      } catch {
        if (!mounted) return;

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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

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

      <Route element={<MainLayout />}>
        <Route path="/home" element={<HomePage />} />

        <Route path="/me" element={<MeProfilePage />} />
        <Route path="/me/profile" element={<MeProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route
          path="/me/change-password"
          element={<Navigate to="/change-password" replace />}
        />
        <Route path="/addresses" element={<AddressesPage />} />

        <Route path="/profile" element={<Navigate to="/me" replace />} />
        <Route path="/account" element={<Navigate to="/me" replace />} />
        <Route path="/address" element={<Navigate to="/addresses" replace />} />
        <Route
          path="/my-addresses"
          element={<Navigate to="/addresses" replace />}
        />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        <Route path="/payments/result" element={<PaymentResultPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />

        <Route path="/shops" element={<Navigate to="/shops/me" replace />} />
        <Route path="/shops/me" element={<MyShopPage />} />
        <Route path="/shops/register" element={<ShopRegisterPage />} />
        <Route path="/shops/me/products" element={<ShopProductsPage />} />
        <Route path="/shops/me/orders" element={<ShopOrdersPage />} />
        <Route path="/shops/me/revenue" element={<ShopRevenuePage />} />
        <Route path="/shops/me/reviews" element={<ShopReviewsPage />} />
        <Route path="/shops/me/settings" element={<ShopSettingsPage />} />
        <Route path="/shops/me/products/create" element={<ProductCreatePage />} />
        <Route path="/shops/me/products/:id/edit" element={<ProductEditPage />} />
        <Route
          path="/shops/me/products/:id/variants"
          element={<ProductVariantsPage />}
        />

        <Route path="/shops/:id" element={<ShopDetailsPage />} />

        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/trend" element={<ProductsListPage />} />

        <Route
          path="/products/category/:categoryId"
          element={<ProductCategoryPage />}
        />

        <Route
          path="/products/create"
          element={<Navigate to="/shops/me/products/create" replace />}
        />

        <Route path="/products/:id/edit" element={<ProductEditAlias />} />
        <Route path="/products/:id/variants" element={<ProductVariantsAlias />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Route>

      <Route path="/admin" element={<AdminGate />}>
        <Route index element={<HomePageAdmin />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/deleted" element={<DeletedUsersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="shops" element={<AdminShopsListPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/:id" element={<AdminProductDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}