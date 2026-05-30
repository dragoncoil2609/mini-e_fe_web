import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import PasswordInput from './components/PasswordInput';
import { getAuthErrorMessage } from './utils/authError';

import loginBunnyBear from '../../assets/brand/login_bunny_bear.png';
import basketChick from '../../assets/brand/basket_chick.png';

import './style/auth.css';

type LoginLocationState = {
  from?: string;
  message?: string;
  authRequired?: boolean;
};

function buildLoginPayload(identifier: string, password: string) {
  const value = identifier.trim();

  if (value.includes('@')) {
    return { email: value.toLowerCase(), password };
  }

  return { phone: value, password };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    locationState?.authRequired
      ? 'Bạn cần đăng nhập để sử dụng chức năng này.'
      : locationState?.message ?? '',
  );
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>(
    locationState?.message ? 'success' : 'info',
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setMessageType('error');
      setMessage('Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    if (!password) {
      setMessageType('error');
      setMessage('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = await AuthApi.login(buildLoginPayload(cleanIdentifier, password));

      // Phòng trường hợp sau này BE đổi về status 200 cho needRecover
      if (data.needRecover) {
        navigate('/auth/account/recover/request', {
          replace: true,
          state: {
            identifier: data.identifier ?? cleanIdentifier,
            via: data.via,
            needRecover: true,
          },
        });
        return;
      }

      if (data.verificationOnly || data.verify?.required || data.user?.isVerified === false) {
        navigate('/verify-account', {
          replace: true,
          state: {
            identifier: cleanIdentifier,
            verify: data.verify,
            from: locationState?.from ?? '/home',
          },
        });
        return;
      }

      navigate(locationState?.from ?? '/home', { replace: true });
    } catch (error: any) {
      const status = error?.response?.status;
      const responseData = error?.response?.data?.data;

      // BE đang trả 423 khi tài khoản bị soft-delete.
      // Axios sẽ nhảy vào catch, nên phải bắt riêng tại đây.
      if (status === 423) {
        navigate('/auth/account/recover/request', {
          replace: true,
          state: {
            identifier: responseData?.identifier ?? cleanIdentifier,
            via: responseData?.via,
            needRecover: true,
          },
        });
        return;
      }

      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard variant="wide">
      <div className="auth-card-split">
        <div>
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">Chào mừng bạn quay trở lại Mochi 💗</p>

          <AuthMessage type={messageType} message={message} />

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label">Email hoặc số điện thoại</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  className="auth-input auth-input-has-icon"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập email hoặc số điện thoại"
                  autoComplete="username"
                />
              </span>
            </label>

            <PasswordInput
              label="Mật khẩu"
              value={password}
              autoComplete="current-password"
              onChange={setPassword}
            />

            <div className="auth-options" style={{ justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" className="auth-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button className="auth-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="auth-link">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div>
          <img className="auth-art" src={loginBunnyBear} alt="Đăng nhập Mochi" />
        </div>
      </div>

      <div className="auth-bottom-art">
        <img src={basketChick} alt="Mochi cute basket" />
      </div>
    </AuthCard>
  );
}