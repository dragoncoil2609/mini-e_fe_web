// src/pages/auth/ResetPasswordPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface ResetLocationState {
  email?: string;
  identifier?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetLocationState | null;

  const initialEmail = (state?.email ?? state?.identifier ?? '').trim();

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'otp' | 'password' | 'confirmPassword' | 'email', string>>
  >({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    if (!email) {
      const msg = 'Thiếu email. Vui lòng quay lại bước Quên mật khẩu.';
      setError(msg);
      setFieldErrors({ email: msg });
      setLoading(false);
      return;
    }

    try {
      const data = await AuthApi.resetPassword({
        email,
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      if (data.reset) {
        setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError('Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      const msg = getBeMessage(err, 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.');
      setError(msg);

      const beField = guessAuthFieldFromMessage(msg);
      const mapped =
        beField === 'otp' || beField === 'password' || beField === 'confirmPassword'
          ? beField
          : beField === 'email'
            ? 'email'
            : null;

      setFieldErrors(mapped ? { [mapped]: msg } : {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <h1 className="title">Đặt lại mật khẩu</h1>
        <p className="description">Nhập mã OTP và mật khẩu mới cho email của bạn.</p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email</label>
            <input type="text" value={email} readOnly className="inputReadonly" />
            {!email && (
              <div className="errorSmall">
                Không có email. Vui lòng quay lại bước Quên mật khẩu.
              </div>
            )}
            {fieldErrors.email && <div className="fieldError">{fieldErrors.email}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`input ${fieldErrors.otp ? 'inputError' : ''}`}
              placeholder="Nhập mã OTP 6 số"
              inputMode="numeric"
            />
            {fieldErrors.otp && <div className="fieldError">{fieldErrors.otp}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Mật khẩu mới</label>

            <div className="passwordWrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input passwordInput ${fieldErrors.password ? 'inputError' : ''}`}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            {fieldErrors.password && <div className="fieldError">{fieldErrors.password}</div>}
          </div>

          <div className="formGroupLast">
            <label className="label">Nhập lại mật khẩu mới</label>

            <div className="passwordWrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input passwordInput ${fieldErrors.confirmPassword ? 'inputError' : ''}`}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>

            {fieldErrors.confirmPassword && (
              <div className="fieldError">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="links">
          <Link to="/login" className="link">
            Đã đặt lại xong? Đăng nhập
          </Link>
          <Link to="/forgot-password" className="link">
            Chưa có OTP?
          </Link>
        </div>
      </div>
    </div>
  );
}