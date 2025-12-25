import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface RecoverConfirmState {
  identifier?: string;
  email?: string; // backward compatible
}

export function RecoverConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RecoverConfirmState | null;

  const initialIdentifier = (state?.identifier ?? state?.email ?? '').trim();

  const [identifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'otp' | 'newPassword' | 'confirmPassword' | 'identifier', string>>
  >({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    if (!identifier) {
      const msg = 'Thiếu thông tin tài khoản. Vui lòng quay lại bước yêu cầu khôi phục.';
      setError(msg);
      setFieldErrors({ identifier: msg });
      setLoading(false);
      return;
    }

    try {
      await AuthApi.recoverConfirm({
        email: identifier, // BE dùng field email
        otp,
        newPassword,
        confirmPassword,
      });

      setSuccess('Khôi phục tài khoản thành công! Bạn có thể đăng nhập lại.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      const msg = getBeMessage(err, 'Khôi phục tài khoản thất bại. Vui lòng kiểm tra lại OTP / mật khẩu.');
      setError(msg);
      const beField = guessAuthFieldFromMessage(msg);
      const mapped =
        beField === 'otp' || beField === 'newPassword' || beField === 'confirmPassword'
          ? beField
          : beField === 'password'
            ? 'newPassword'
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

        <h1 className="title">Xác nhận khôi phục tài khoản</h1>

        <p className="description">
          Nhập mã OTP và mật khẩu mới để kích hoạt lại tài khoản.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc SĐT</label>
            <input type="text" value={identifier} readOnly className="inputReadonly" />
            {!identifier && (
              <div className="errorSmall">
                Không có thông tin tài khoản. Vui lòng quay lại bước yêu cầu khôi phục.
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`input ${fieldErrors.newPassword ? 'inputError' : ''}`}
            />
            {fieldErrors.newPassword && <div className="fieldError">{fieldErrors.newPassword}</div>}
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
            {loading ? 'Đang khôi phục...' : 'Khôi phục tài khoản'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
