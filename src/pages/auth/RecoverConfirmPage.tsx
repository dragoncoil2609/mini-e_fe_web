import {useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './RecoverConfirmPage.css';

interface RecoverConfirmState {
  email?: string;
}

export function RecoverConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RecoverConfirmState | null;

  const initialEmail = state?.email || '';

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState('950759');
  const [newPassword, setNewPassword] = useState('@Ngulon123');
  const [confirmPassword, setConfirmPassword] = useState('@Ngulon123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email) {
      setError('Thiếu email. Vui lòng quay lại bước yêu cầu khôi phục.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setLoading(false);
      return;
    }

    try {
      await AuthApi.recoverConfirm({
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      setSuccess('Khôi phục tài khoản thành công! Bạn có thể đăng nhập lại.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Khôi phục tài khoản thất bại. Vui lòng kiểm tra lại OTP / mật khẩu.';
      setError(msg);
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
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="inputReadonly"
            />
            {!email && (
              <div className="errorSmall">
                Không có email. Vui lòng quay lại bước yêu cầu khôi phục.
              </div>
            )}
          </div>

          <div className="formGroup">
            <label className="label">Mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="formGroup">
            <label className="label">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="formGroupLast">
            <label className="label">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input"
            />
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