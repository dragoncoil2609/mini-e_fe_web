// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

interface RecoverInfo {
  email: string;
  via?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('quochiep1610@gmail.com');
  const [password, setPassword] = useState('Aa123456!');
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
          <p style={{ color: 'red', marginTop: 8 }}>{error}</p>
        )}

        {/* Nếu cần khôi phục tài khoản thì hiện thêm nút */}
        {recoverInfo && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={handleRecoverAccount}
              style={{ width: '100%' }}
            >
              Khôi phục tài khoản
            </button>
          </div>
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
