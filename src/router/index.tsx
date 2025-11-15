import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { VerifyAccountPage } from '../pages/auth/VerifyAccountPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Mặc định điều hướng về /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />

      {/* Route không tồn tại → đưa về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}