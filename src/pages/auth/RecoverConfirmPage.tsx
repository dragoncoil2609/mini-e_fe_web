import type { FormEvent, KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import PasswordInput from './components/PasswordInput';
import { getAuthErrorMessage } from './utils/authError';

import otpPhone from '../../assets/brand/otp_phone.png';
import newPasswordLock from '../../assets/brand/new_password_lock.png';
import restoreSuccessHeart from '../../assets/brand/restore_success_heart.png';

import './style/auth.css';

type RecoverConfirmState = {
  identifier?: string;
  devOtp?: string;
  expiresAt?: string;
};

export default function RecoverConfirmPage() {
  const location = useLocation();
  const locationState = location.state as RecoverConfirmState | null;

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [stage, setStage] = useState<'otp' | 'password' | 'success'>('otp');

  const [identifier, setIdentifier] = useState(locationState?.identifier ?? '');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(
    locationState?.devOtp ? 'Mã khôi phục đã được gửi. Bạn có thể dùng OTP test bên dưới.' : '',
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
      setMessage('Vui lòng nhập email hoặc số điện thoại');
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

  async function handleRecover(e: FormEvent) {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessageType('error');
      setMessage('Vui lòng nhập đầy đủ mật khẩu mới');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('Xác nhận mật khẩu chưa khớp');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await AuthApi.recoverConfirm({
        email: identifier.trim(),
        otp,
        newPassword,
        confirmPassword,
      });

      setStage('success');
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Khôi phục tài khoản thất bại'));
    } finally {
      setLoading(false);
    }
  }

  if (stage === 'success') {
    return (
      <AuthCard variant="compact">
        <div className="auth-title-center">
          <img className="auth-art" src={restoreSuccessHeart} alt="Khôi phục thành công" />
        </div>

        <div className="auth-steps-note">Bước 3/3</div>
        <h1 className="auth-title auth-title-center">Khôi phục thành công</h1>

        <p className="auth-subtitle auth-subtitle-center">
          Tài khoản của bạn đã được khôi phục thành công! Bạn có thể đăng nhập và tiếp tục sử dụng.
        </p>

        <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }}>
          Đăng nhập ngay
        </Link>

        <div className="auth-resend">
          <Link to="/home" className="auth-link">
            Quay về trang chủ
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (stage === 'password') {
    return (
      <AuthCard variant="compact">
        <div className="auth-title-center">
          <img className="auth-art" src={newPasswordLock} alt="Mật khẩu mới" />
        </div>

        <div className="auth-steps-note">Bước 3/3</div>
        <h1 className="auth-title auth-title-center">Tạo mật khẩu mới</h1>

        <AuthMessage type={messageType} message={message} />

        <form className="auth-form" onSubmit={handleRecover}>
          <PasswordInput
            label="Mật khẩu mới"
            value={newPassword}
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
            onChange={setNewPassword}
          />

          <PasswordInput
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            onChange={setConfirmPassword}
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? 'Đang khôi phục...' : 'Khôi phục tài khoản'}
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

      <div className="auth-steps-note">Bước 2/3</div>
      <h1 className="auth-title auth-title-center">Nhập mã xác thực</h1>

      <div className="auth-otp-target">
        Mã OTP đã được gửi đến
        <br />
        <strong>{identifier || 'tài khoản của bạn'}</strong>
      </div>

      <AuthMessage type={messageType} message={message} devOtp={locationState?.devOtp} />

      <form className="auth-form" onSubmit={handleConfirmOtp}>
        {!locationState?.identifier && (
          <label className="auth-field">
            <span className="auth-label">Email hoặc số điện thoại</span>
            <span className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                className="auth-input auth-input-has-icon"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email hoặc số điện thoại"
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
    </AuthCard>
  );
}