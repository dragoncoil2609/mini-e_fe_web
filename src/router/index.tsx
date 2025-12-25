import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { VerifyAccountPage } from '../pages/auth/VerifyAccountPage';
import { HomePage } from '../pages/HomePage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { RecoverConfirmPage } from '../pages/auth/RecoverConfirmPage';
import { RecoverRequestPage } from '../pages/auth/RecoverRequestPage';
import { HomePageAdmin } from '../pages/admin/HomePageAdmin';
import MeProfilePage from '../pages/me/MeProfilePage';
import UsersListPage from '../pages/admin/users/UsersListPage';
import DeletedUsersPage from '../pages/admin/users/DeletedUsersPage';
import AdminShopsListPage from '../pages/admin/shops/AdminShopsListPage';
import AdminCategoriesPage from '../pages/admin/categories/AdminCategoriesPage';
import AdminProductsPage from '../pages/admin/products/AdminProductsPage';
import ShopRegisterPage from '../pages/shops/ShopRegisterPage';
import MyShopPage from '../pages/shops/MyShopPage';
import ProductsListPage from '../pages/products/ProductsListPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import MyProductsPage from '../pages/products/MyProductsPage';
import ProductEditPage from '../pages/products/ProductEditPage';
import ProductVariantsPage from '../pages/products/ProductVariantsPage';
import CartPage from '../pages/cart/CartPage';
import OrdersPage from '../pages/orders/OrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';
import AddressesPage from '../pages/addresses/AddressesPage';
import ProductCreatePage from '../pages/products/ProductCreatePage';
import ShopDetailsPage from '../pages/shops/ShopDetailsPage';

import CheckoutPage from '../pages/checkout/CheckoutPage';
import PaymentResultPage from '../pages/payments/PaymentResultPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/auth/account/recover/request" element={<RecoverRequestPage />} />
      <Route path="/auth/account/recover/confirm" element={<RecoverConfirmPage />} />

      <Route path="/home" element={<HomePage />} />
      <Route path="/admin" element={<HomePageAdmin />} />
      <Route path="/me" element={<MeProfilePage />} />
      <Route path="/admin/users" element={<UsersListPage />} />
      <Route path="/admin/users/deleted" element={<DeletedUsersPage />} />
      <Route path="/admin/categories" element={<AdminCategoriesPage />} />
      <Route path="/admin/products" element={<AdminProductsPage />} />

      <Route path="/shops/register" element={<ShopRegisterPage />} />
      <Route path="/shops/me" element={<MyShopPage />} />
      <Route path="/shops/:id" element={<ShopDetailsPage />} />

      <Route path="/products" element={<ProductsListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />

      <Route path="/me/products" element={<MyProductsPage />} />
      <Route path="/me/products/new" element={<ProductCreatePage />} />
      <Route path="/me/products/:id/edit" element={<ProductEditPage />} />
      <Route path="/me/products/:id/variants" element={<ProductVariantsPage />} />

      <Route path="/admin/shops" element={<AdminShopsListPage />} />

      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetailPage />} />

      <Route path="/addresses" element={<AddressesPage />} />

      <Route path="/payment-result" element={<PaymentResultPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
