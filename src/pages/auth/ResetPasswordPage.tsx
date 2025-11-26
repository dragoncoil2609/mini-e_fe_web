import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './ResetPasswordPage.css';

interface ResetLocationState {
  email?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetLocationState | null;

  // Lấy email từ state (truyền từ ForgotPasswordPage)
  const initialEmail = state?.email || '';

  const [email] = useState(initialEmail); // không cho sửa
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('@Ngulon123');
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
      setError('Thiếu email. Vui lòng quay lại bước Quên mật khẩu.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      setLoading(false);
      return;
    }

    try {
      const data = await AuthApi.resetPassword({
        email,
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
      const msg =
        err?.response?.data?.message ||
        'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="icon">🔑</div>
        </div>

        <h1 className="title">Đặt lại mật khẩu</h1>

        <p className="description">
          Nhập mã OTP và mật khẩu mới cho tài khoản.
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
                Không có email. Vui lòng quay lại bước Quên mật khẩu.
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
