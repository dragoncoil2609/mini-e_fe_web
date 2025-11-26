import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('quochiep1610@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Gửi yêu cầu OTP
      await AuthApi.forgotPassword(email);

      // 👉 Sau khi gửi OTP thành công, chuyển sang /reset-password
      // và truyền kèm email đã nhập
      navigate('/reset-password', {
        state: { email },
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
          <div className="icon">🔒</div>
        </div>

        <h1 className="title">Quên mật khẩu</h1>

        <p className="description">
          Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="input"
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
