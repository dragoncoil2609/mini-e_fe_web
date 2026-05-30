import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import { getAuthErrorMessage } from './utils/authError';

import forgotPasswordSearch from '../../assets/brand/forgot_password_search.png';

import './style/auth.css';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessageType('error');
      setMessage('Vui lòng nhập email');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessageType('error');
      setMessage('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = await AuthApi.forgotPassword(cleanEmail);

      navigate('/reset-password', {
        replace: true,
        state: {
          identifier: cleanEmail,
          target: data.target ?? data.email ?? cleanEmail,
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
        Nhập email của tài khoản để nhận mã đặt lại mật khẩu
      </p>

      <AuthMessage type={messageType} message={message} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-input-wrap">
            <span className="auth-input-icon">✉️</span>
            <input
              className="auth-input auth-input-has-icon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              autoComplete="email"
            />
          </span>
        </label>

        <button className="auth-btn" disabled={loading}>
          {loading ? 'Đang gửi mã...' : 'Gửi mã đặt lại mật khẩu'}
        </button>

        <div className="auth-help-box">
          🛡️ Mã đặt lại mật khẩu sẽ được gửi qua email. Vui lòng kiểm tra cả hộp thư spam
          nếu chưa thấy email.
        </div>
      </form>
    </AuthCard>
  );
}