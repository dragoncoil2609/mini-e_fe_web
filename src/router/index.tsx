// src/router/index.tsx
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
import ShopRegisterPage from '../pages/shops/ShopRegisterPage';
import MyShopPage from '../pages/shops/MyShopPage';
import ProductsListPage from '../pages/products/ProductsListPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import MyProductsPage from '../pages/products/MyProductsPage';
import ProductEditPage from '../pages/products/ProductEditPage';
import ProductVariantsPage from '../pages/products/ProductVariantsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Mở root "/" sẽ về login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/auth/account/recover/request" element={<RecoverRequestPage />}/>
      <Route path="/auth/account/recover/confirm" element={<RecoverConfirmPage />}/>

      <Route path="/home" element={<HomePage />} />
      <Route path="/admin" element={<HomePageAdmin />} />
      <Route path="/me" element={<MeProfilePage />} />
      <Route path="/admin/users" element={<UsersListPage />} />
      <Route path="/admin/users/deleted" element={<DeletedUsersPage/>} />

      {/* --- SHOP (user/seller) --- */}
      <Route path="/shops/register" element={<ShopRegisterPage />} />
      <Route path="/shops/me" element={<MyShopPage />} />

      {/* PUBLIC PRODUCT */}
      <Route path="/products" element={<ProductsListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/me/products/:id/variants" element={<ProductVariantsPage />} />

      {/* SELLER / ADMIN PRODUCT (quản lý của mình) */}
      <Route path="/me/products" element={<MyProductsPage />} />
      <Route path="/me/products/new" element={<ProductEditPage />} />
      <Route path="/me/products/:id/edit" element={<ProductEditPage />} />

      {/* --- ADMIN: Quản lý shop --- */}
      <Route path="/admin/shops" element={<AdminShopsListPage />} />

      {/* Route không tồn tại → quay về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
