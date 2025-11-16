import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

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
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Đặt lại mật khẩu</h2>
      <p style={{ marginBottom: 12 }}>
        Nhập mã OTP và mật khẩu mới cho tài khoản.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            style={{ width: '100%' }}
            type="email"
            value={email}
            readOnly
          />
          {!email && (
            <small style={{ color: 'red' }}>
              Không có email. Vui lòng quay lại bước Quên mật khẩu.
            </small>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Mã OTP</label>
          <input
            style={{ width: '100%' }}
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Mật khẩu mới</label>
          <input
            style={{ width: '100%' }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Nhập lại mật khẩu mới</label>
          <input
            style={{ width: '100%' }}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 4 }}>{error}</p>
        )}

        {success && (
          <p style={{ color: 'green', marginTop: 4 }}>{success}</p>
        )}

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <p>
          Đã đặt lại xong?{' '}
          <Link to="/login">Đăng nhập</Link>
        </p>
        <p>
          Chưa có OTP?{' '}
          <Link to="/forgot-password">Quên mật khẩu (yêu cầu OTP)</Link>
        </p>
      </div>
    </div>
  );
}
