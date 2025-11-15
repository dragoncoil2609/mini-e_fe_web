// src/pages/auth/ForgotPasswordPage.tsx
import type { FormEvent } from 'react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { ForgotPasswordResponse } from '../../api/types';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('you@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await AuthApi.forgotPassword(email);
      setResult(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không gửi được OTP. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Quên mật khẩu</h2>
      <p>Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            style={{ width: '100%' }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 4 }}>{error}</p>
        )}

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 16, padding: 10, border: '1px solid #ddd' }}>
          <p>Đã gửi OTP tới: <b>{result.email}</b></p>
          {/* Dev có thể thấy OTP trong response */}
          {result.otp && (
            <p>OTP (dev): <code>{result.otp}</code></p>
          )}
          {result.expiresAt && (
            <p>Hết hạn lúc: {result.expiresAt}</p>
          )}
          <p style={{ marginTop: 8 }}>
            Sau khi có OTP, bạn cần tạo thêm trang
            <b> ResetPasswordPage </b> để gọi API
            <code> /auth/reset-password </code>.
          </p>
        </div>
      )}

      <p style={{ marginTop: 16 }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
