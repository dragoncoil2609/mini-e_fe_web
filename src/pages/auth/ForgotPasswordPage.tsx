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
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>(
    'info',
  );

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

      /**
       * Phòng trường hợp sau này BE đổi từ status 423 sang status 200.
       */
      if ((data as any)?.needRecover) {
        navigate('/auth/account/recover/request', {
          replace: true,
          state: {
            identifier: (data as any).identifier ?? cleanEmail,
            via: (data as any).via ?? 'email',
            needRecover: true,
            message:
              (data as any).message ??
              'Tài khoản đang bị vô hiệu hóa. Vui lòng khôi phục tài khoản trước.',
          },
        });
        return;
      }

      navigate('/reset-password', {
        replace: true,
        state: {
          identifier: cleanEmail,
          target: data.target ?? data.email ?? cleanEmail,
          expiresAt: data.expiresAt,
          devOtp: data.devOtp ?? data.otp,
        },
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const responseData = error?.response?.data?.data;

      /**
       * BE trả 423 khi tài khoản bị soft-delete.
       * Axios sẽ nhảy vào catch, nên phải lấy data ở đây.
       */
      if (status === 423 && responseData?.needRecover) {
        navigate('/auth/account/recover/request', {
          replace: true,
          state: {
            identifier: responseData.identifier ?? cleanEmail,
            via: responseData.via ?? 'email',
            needRecover: true,
            message:
              responseData.message ??
              'Tài khoản đang bị vô hiệu hóa. Vui lòng khôi phục tài khoản trước.',
          },
        });
        return;
      }

      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Không thể gửi mã đặt lại mật khẩu'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard variant="compact">
      <div className="auth-title-center">
        <img
          className="auth-art"
          src={forgotPasswordSearch}
          alt="Quên mật khẩu"
        />
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
          {loading ? 'Đang xử lý...' : 'Tiếp tục'}
        </button>

        <div className="auth-help-box">
          🛡️ Nếu tài khoản đang bị vô hiệu hóa, hệ thống sẽ chuyển bạn sang bước
          khôi phục tài khoản.
        </div>
      </form>
    </AuthCard>
  );
}