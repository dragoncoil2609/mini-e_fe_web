import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface ResetLocationState {
  identifier?: string;
  email?: string; // backward compatible
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetLocationState | null;

  const initialIdentifier = (state?.identifier ?? state?.email ?? '').trim();

  const [identifier] = useState(initialIdentifier); // không cho sửa
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'otp' | 'password' | 'confirmPassword' | 'identifier', string>>
  >({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    if (!identifier) {
      const msg = 'Thiếu thông tin tài khoản. Vui lòng quay lại bước Quên mật khẩu.';
      setError(msg);
      setFieldErrors({ identifier: msg });
      setLoading(false);
      return;
    }

    try {
      const data = await AuthApi.resetPassword({
        email: identifier, // BE đang dùng field email
        otp,
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
          : beField === 'email' || beField === 'phone' || beField === 'identifier'
            ? 'identifier'
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

        <p className="description">
          Nhập mã OTP và mật khẩu mới cho tài khoản.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc SĐT</label>
            <input
              type="text"
              value={identifier}
              readOnly
              className="inputReadonly"
            />
            {!identifier && (
              <div className="errorSmall">
                Không có thông tin tài khoản. Vui lòng quay lại bước Quên mật khẩu.
              </div>
            )}
          </div>

          <div className="formGroup">
            <label className="label">Mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`input ${fieldErrors.otp ? 'inputError' : ''}`}
            />
            {fieldErrors.otp && <div className="fieldError">{fieldErrors.otp}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Mật khẩu mới</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input ${fieldErrors.password ? 'inputError' : ''}`}
            />
            {fieldErrors.password && <div className="fieldError">{fieldErrors.password}</div>}
          </div>

          <div className="formGroupLast">
            <label className="label">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input ${fieldErrors.confirmPassword ? 'inputError' : ''}`}
            />
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
