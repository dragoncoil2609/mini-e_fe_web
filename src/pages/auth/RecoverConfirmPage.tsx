import {useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

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
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Xác nhận khôi phục tài khoản</h2>
      <p>Nhập mã OTP và mật khẩu mới để kích hoạt lại tài khoản.</p>

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
              Không có email. Vui lòng quay lại bước yêu cầu khôi phục.
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
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
          {loading ? 'Đang khôi phục...' : 'Khôi phục tài khoản'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}