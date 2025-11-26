// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './LoginPage.css';

interface RecoverInfo {
  email: string;
  via?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thông tin khôi phục nếu tài khoản bị vô hiệu hoá
  const [recoverInfo, setRecoverInfo] = useState<RecoverInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverInfo(null);
    setLoading(true);
    try {
      const data = await AuthApi.login({ email, password });

      // Nếu chưa verify → đi verify trước
      if (!data.user.isVerified) {
        navigate('/verify-account');
        return;
      }

      // ✅ Đã verify: lưu thông tin user để Home / Admin dùng
      try {
        localStorage.setItem('current_user', JSON.stringify(data.user));
      } catch (e) {
        console.error('Cannot save user to localStorage', e);
      }

      // ✅ Điều hướng theo role
      if (data.user.role === 'ADMIN') {
        // Trang home admin
        navigate('/admin');
      } else {
        // USER hoặc SELLER
        navigate('/home');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const payload = err?.response?.data;

      // 🔒 Trường hợp tài khoản bị vô hiệu hoá (status 423)
      if (status === 423 && payload?.data?.needRecover) {
        const identifier = payload.data.identifier as string | undefined;
        const via = payload.data.via as string | undefined;

        setError(
          payload?.message ||
            'Tài khoản đã bị vô hiệu hoá. Vui lòng khôi phục trước khi đăng nhập.',
        );

        if (identifier) {
          setRecoverInfo({
            email: identifier,
            via,
          });
        } else {
          setRecoverInfo(null);
        }
      } else {
        // Lỗi bình thường
        const msg =
          payload?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại.';
        setError(msg);
        setRecoverInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverAccount() {
    if (!recoverInfo?.email) return;
    navigate('/auth/account/recover/request', {
      state: { email: recoverInfo.email },
    });
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
          <div className="icon">🏪</div>
        </div>

        <h1 className="title">Login</h1>

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

          <div className="formGroupLast">
            <label className="label">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="input"
            />
          </div>

          {error && <div className="error">{error}</div>}

          {recoverInfo && (
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleRecoverAccount}
                className="recoverButton"
              >
                Khôi phục tài khoản
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đăng nhập...' : 'Login'}
          </button>
        </form>

        <div className="links">
          <Link to="/register" className="link">
            Create an account
          </Link>
          <Link to="/forgot-password" className="link">
            Forget password?
          </Link>
        </div>
      </div>
    </div>
  );
}
