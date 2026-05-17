import { useState } from 'react';
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import { getAuthErrorMessage } from './utils/authError';

import restoreBunnyBear from '../../assets/brand/restore_bunny_bear.png';
import restoreShield from '../../assets/brand/restore_shield.png';

import './style/auth.css';

type RecoverRequestState = {
  identifier?: string;
  needRecover?: boolean;
};

export default function RecoverRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as RecoverRequestState | null;

  const [identifier, setIdentifier] = useState(locationState?.identifier ?? '');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(
    locationState?.needRecover
      ? 'Tài khoản của bạn đang bị vô hiệu hóa. Vui lòng khôi phục để tiếp tục sử dụng.'
      : '',
  );
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
      const data = await AuthApi.recoverRequest(identifier.trim());

      navigate('/auth/account/recover/confirm', {
        replace: true,
        state: {
          identifier: identifier.trim(),
          expiresAt: data?.expiresAt,
          devOtp: data?.devOtp ?? data?.otp,
        },
      });
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Không thể gửi yêu cầu khôi phục'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard variant="hero">
      <div className="auth-hero-grid">
        <div className="auth-hero-left">
          <img className="auth-art-large" src={restoreBunnyBear} alt="Khôi phục tài khoản" />

          <div>
            <h1 className="auth-title">Khôi phục tài khoản</h1>
            <p className="auth-subtitle">
              Tài khoản của bạn đã bị xóa. Đừng lo! Bạn vẫn có thể khôi phục tài khoản
              và lấy lại toàn bộ dữ liệu trước đây.
            </p>

            <div className="auth-help-box">
              <div>♡ Bạn có 30 ngày kể từ ngày xóa để khôi phục tài khoản.</div>
              <div>♡ Sau thời gian này, tài khoản và dữ liệu sẽ bị xóa vĩnh viễn.</div>
            </div>

            <div style={{ height: 20 }} />

            <div className="auth-actions-row">
              <button
                className="auth-btn"
                type="button"
                onClick={() => {
                  const form = document.getElementById('recover-form-input');
                  form?.focus();
                }}
              >
                Khôi phục ngay
              </button>

              <Link to="/home" className="auth-btn-outline" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }}>
                Không, cảm ơn
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="auth-title-center">
            <img className="auth-art" src={restoreShield} alt="Xác minh khôi phục" />
          </div>

          <div className="auth-steps-note">Bước 1/3</div>
          <h2 className="auth-title auth-title-center" style={{ fontSize: 25 }}>
            Xác minh tài khoản
          </h2>

          <p className="auth-subtitle auth-subtitle-center">
            Nhập email hoặc số điện thoại của tài khoản đã bị xóa để bắt đầu khôi phục.
          </p>

          <AuthMessage type={messageType} message={message} />

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="recover-form-input"
                  className="auth-input auth-input-has-icon"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email hoặc số điện thoại"
                  autoComplete="username"
                />
              </span>
            </label>

            <button className="auth-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Tiếp tục'}
            </button>
          </form>
        </div>
      </div>
    </AuthCard>
  );
}