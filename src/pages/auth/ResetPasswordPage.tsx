import { useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import PasswordInput from './components/PasswordInput';
import { getAuthErrorMessage } from './utils/authError';

import otpPhone from '../../assets/brand/otp_phone.png';
import newPasswordLock from '../../assets/brand/new_password_lock.png';

import './style/auth.css';

type ResetState = {
  identifier?: string;
  target?: string;
  devOtp?: string;
  expiresAt?: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ResetState | null;

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [stage, setStage] = useState<'otp' | 'password'>('otp');

  const [identifier, setIdentifier] = useState(locationState?.identifier ?? '');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(
    locationState?.devOtp ? 'Mã xác thực đã được gửi. Bạn có thể dùng OTP test bên dưới.' : '',
  );
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const otp = useMemo(() => otpValues.join(''), [otpValues]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtpValues((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleConfirmOtp(e: FormEvent) {
    e.preventDefault();

    if (!identifier.trim()) {
      setMessageType('error');
      setMessage('Vui lòng nhập email tài khoản');
      return;
    }

    if (otp.length !== 6) {
      setMessageType('error');
      setMessage('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setMessage('');
    setStage('password');
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessageType('error');
      setMessage('Vui lòng nhập đầy đủ mật khẩu mới');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Xác nhận mật khẩu chưa khớp');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await AuthApi.resetPassword({
        email: identifier.trim(),
        otp,
        password,
        confirmPassword,
      });

      navigate('/login', {
        replace: true,
        state: {
          message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
        },
      });
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Không thể đặt lại mật khẩu'));
    } finally {
      setLoading(false);
    }
  }

  if (stage === 'password') {
    return (
      <AuthCard variant="compact">
        <div className="auth-title-center">
          <img className="auth-art" src={newPasswordLock} alt="Tạo mật khẩu mới" />
        </div>

        <h1 className="auth-title auth-title-center">Tạo mật khẩu mới</h1>

        <AuthMessage type={messageType} message={message} />

        <form className="auth-form" onSubmit={handleResetPassword}>
          <PasswordInput
            label="Mật khẩu mới"
            value={password}
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
            onChange={setPassword}
          />

          <PasswordInput
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            onChange={setConfirmPassword}
          />

          <div className="auth-rules">
            <div className="auth-rule">Ít nhất 8 ký tự</div>
            <div className="auth-rule">
              Bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
            </div>
          </div>

          <button className="auth-btn" disabled={loading}>
            {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard variant="compact">
      <div className="auth-title-center">
        <img className="auth-art" src={otpPhone} alt="Nhập mã xác thực" />
      </div>

      <h1 className="auth-title auth-title-center">Nhập mã xác thực</h1>

      <div className="auth-otp-target">
        Mã OTP đã được gửi đến
        <br />
        <strong>{(locationState?.target ?? identifier) || 'email của bạn'}</strong>
      </div>

      <AuthMessage type={messageType} message={message} devOtp={locationState?.devOtp} />

      <form className="auth-form" onSubmit={handleConfirmOtp}>
        {!locationState?.identifier && (
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <span className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                className="auth-input auth-input-has-icon"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập email của bạn"
              />
            </span>
          </label>
        )}

        <div className="auth-otp-grid">
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="auth-otp-input"
              value={value}
              inputMode="numeric"
              maxLength={1}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <button className="auth-btn">Xác nhận</button>
      </form>

      <div className="auth-resend">
        Nhớ mật khẩu?{' '}
        <Link to="/login" className="auth-link">
          Đăng nhập
        </Link>
      </div>
    </AuthCard>
  );
}