import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('quochiep1610@gmail.com');
  const [password, setPassword] = useState('Aa123456!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await AuthApi.login({ email, password });

      // 👉 Sau khi login, check isVerified
      if (data.user.isVerified) {
        // Đã xác minh → vào Home
        navigate('/home');
      } else {
        // Chưa xác minh → sang trang verify
        navigate('/verify-account');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Đăng nhập thất bại, vui lòng kiểm tra lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Đăng nhập Mini E</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            style={{ width: '100%' }}
            required
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Mật khẩu</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: '100%' }}
            required
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 8 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 12, width: '100%' }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <p>
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký</Link>
        </p>
        <p>
          Quên mật khẩu?{' '}
          <Link to="/forgot-password">Quên mật khẩu</Link>
        </p>
      </div>
    </div>
  );
}