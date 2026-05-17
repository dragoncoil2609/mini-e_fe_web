import { useState } from 'react';
import type { FormEvent } from "react";
import { useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import { getAuthErrorMessage } from './utils/authError';

import forgotPasswordSearch from '../../assets/brand/forgot_password_search.png';

import './style/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!identifier.trim()) {
      setMessageType('error');
      setMessage('Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = await AuthApi.forgotPassword(identifier.trim());

      navigate('/reset-password', {
        replace: true,
        state: {
          identifier: identifier.trim(),
          target: data.target ?? data.email ?? data.phone ?? identifier.trim(),
          expiresAt: data.expiresAt,
          devOtp: data.devOtp ?? data.otp,
        },
      });
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Không thể gửi mã đặt lại mật khẩu'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard variant="compact">
      <div className="auth-title-center">
        <img className="auth-art" src={forgotPasswordSearch} alt="Quên mật khẩu" />
      </div>

      <h1 className="auth-title auth-title-center">Quên mật khẩu</h1>
      <p className="auth-subtitle auth-subtitle-center">
        Nhập email hoặc số điện thoại để tìm tài khoản của bạn
      </p>

      <AuthMessage type={messageType} message={message} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-input-wrap">
            <span className="auth-input-icon">✉️</span>
            <input
              className="auth-input auth-input-has-icon"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email hoặc số điện thoại"
              autoComplete="username"
            />
          </span>
        </label>

        <button className="auth-btn" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Tiếp tục'}
        </button>

        <div className="auth-help-box">
          🛡️ Chúng tôi cam kết bảo mật thông tin của bạn theo chính sách bảo mật.
        </div>
      </form>
    </AuthCard>
  );
}