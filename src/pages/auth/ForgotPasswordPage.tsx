import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await AuthApi.forgotPassword(identifier);

      navigate('/reset-password', {
        state: { identifier },
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không gửi được OTP. Vui lòng thử lại.';
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

        <h1 className="title">Quên mật khẩu</h1>

        <p className="description">
          Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc SĐT</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type="text"
              required
              className="input"
              placeholder="user@gmail.com hoặc 09xx..."
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Đã nhớ mật khẩu? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
