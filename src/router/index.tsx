// src/router/index.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import type { CSSProperties } from 'react';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RecoverRequestPage from '../pages/auth/RecoverRequestPage';
import RecoverConfirmPage from '../pages/auth/RecoverConfirmPage';

import MeProfilePage from '../pages/me/MeProfilePage';
import AddressesPage from '../pages/addresses/AddressesPage';

function HomeTestPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#fff4f8',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 'min(680px, 92%)',
          padding: 32,
          borderRadius: 24,
          background: '#fff',
          boxShadow: '0 20px 60px rgba(239, 75, 131, 0.18)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#ef4b83', marginBottom: 12 }}>
          Mochi Test Page
        </h1>

        <p style={{ color: '#6b5d63', marginBottom: 24 }}>
          Trang tạm để test giao diện auth, tài khoản và địa chỉ.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 12,
          }}
        >
          <a style={linkStyle} href="/login">
            Đăng nhập
          </a>

          <a style={linkStyle} href="/register">
            Đăng ký
          </a>

          <a style={linkStyle} href="/forgot-password">
            Quên mật khẩu
          </a>

          <a style={linkStyle} href="/verify-account">
            Xác thực tài khoản
          </a>

          <a style={linkStyle} href="/reset-password">
            Đặt lại mật khẩu
          </a>

          <a style={linkStyle} href="/auth/account/recover/request">
            Khôi phục tài khoản
          </a>

          <a style={linkStyle} href="/auth/account/recover/confirm">
            Xác nhận khôi phục
          </a>

          <div
            style={{
              height: 1,
              background: '#ffe1eb',
              margin: '8px 0',
            }}
          />

          <a
            style={{
              ...linkStyle,
              background: '#ef4b83',
              color: '#fff',
              borderColor: '#ef4b83',
            }}
            href="/me"
          >
            Test giao diện tài khoản /me
          </a>

          <a
            style={{
              ...linkStyle,
              background: '#ff6f9f',
              color: '#fff',
              borderColor: '#ff6f9f',
            }}
            href="/addresses"
          >
            Test giao diện địa chỉ /addresses
          </a>
        </div>

        <p
          style={{
            marginTop: 22,
            color: '#9b8b92',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Lưu ý: trang <b>/me</b> gọi API <b>GET /users/me</b>. Trang{' '}
          <b>/addresses</b> gọi API <b>GET /addresses</b>, nên nếu chưa đăng
          nhập hoặc chưa có token thì có thể báo lỗi tải dữ liệu.
        </p>
      </div>
    </div>
  );
}

const linkStyle: CSSProperties = {
  display: 'block',
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid #ffc9da',
  background: '#fff7fa',
  color: '#ef4b83',
  textDecoration: 'none',
  fontWeight: 700,
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Trang test tạm */}
      <Route path="/home" element={<HomeTestPage />} />

      {/* Auth */}
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

      {/* User profile test */}
      <Route path="/me" element={<MeProfilePage />} />
      <Route path="/profile" element={<Navigate to="/me" replace />} />
      <Route path="/account" element={<Navigate to="/me" replace />} />

      {/* Address test */}
      <Route path="/addresses" element={<AddressesPage />} />
      <Route path="/address" element={<Navigate to="/addresses" replace />} />
      <Route path="/my-addresses" element={<Navigate to="/addresses" replace />} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}