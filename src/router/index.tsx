// src/router/index.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RecoverRequestPage from '../pages/auth/RecoverRequestPage';
import RecoverConfirmPage from '../pages/auth/RecoverConfirmPage';

function HomeTestPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#fff4f8',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(520px, 92%)',
          padding: 32,
          borderRadius: 24,
          background: '#fff',
          boxShadow: '0 20px 60px rgba(239, 75, 131, 0.18)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#ef4b83', marginBottom: 12 }}>Mochi Home Test</h1>
        <p style={{ color: '#6b5d63', marginBottom: 24 }}>
          Trang home tạm để test giao diện auth.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <a href="/login">Đăng nhập</a>
          <a href="/register">Đăng ký</a>
          <a href="/forgot-password">Quên mật khẩu</a>
          <a href="/verify-account">Xác thực tài khoản</a>
          <a href="/reset-password">Đặt lại mật khẩu</a>
          <a href="/auth/account/recover/request">Khôi phục tài khoản</a>
          <a href="/auth/account/recover/confirm">Xác nhận khôi phục</a>
        </div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/home" element={<HomeTestPage />} />

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

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}