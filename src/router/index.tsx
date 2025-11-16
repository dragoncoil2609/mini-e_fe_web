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

            <Route
        path="/auth/account/recover/request"
        element={<RecoverRequestPage />}
      />
      <Route
        path="/auth/account/recover/confirm"
        element={<RecoverConfirmPage />}
      />

      {/* Home sau khi login & verify xong */}
      <Route path="/home" element={<HomePage />} />

      {/* Route không tồn tại → quay về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
