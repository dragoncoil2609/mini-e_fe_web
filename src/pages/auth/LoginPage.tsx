// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './LoginPage.css';

interface RecoverInfo {
  identifier: string;
  via?: string; // 'email' | 'phone' | ...
}

function looksLikeEmail(v: string) {
  // đủ dùng cho phân biệt FE
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizePhone(raw: string) {
  // normalize nhẹ để match kiểu +84... (không bắt buộc, nhưng giúp login ổn định)
  let v = raw.trim().replace(/[\s.-]/g, '');
  if (!v) return v;
  if (v.startsWith('+')) return v;
  if (v.startsWith('0')) return `+84${v.slice(1)}`;
  if (v.startsWith('84')) return `+${v}`;
  return v;
}

export function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(''); // ✅ email hoặc sđt
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recoverInfo, setRecoverInfo] = useState<RecoverInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverInfo(null);
    setLoading(true);

    try {
      const id = identifier.trim();

      if (!id) {
        setError('Vui lòng nhập Email hoặc Số điện thoại.');
        return;
      }

      const payload = looksLikeEmail(id)
        ? { email: id.toLowerCase(), password }
        : { phone: normalizePhone(id), password };

      const data = await AuthApi.login(payload);

      // ✅ lưu user luôn (kể cả chưa verify) để FE khỏi mất state
      try {
        localStorage.setItem('current_user', JSON.stringify(data.user));
      } catch (e) {
        console.error('Cannot save user to localStorage', e);
      }

      // Nếu chưa verify → đi verify trước
      if (!data.user.isVerified) {
        navigate('/verify-account');
        return;
      }

      // Điều hướng theo role
      if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/home');
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

        if (identifier) setRecoverInfo({ identifier, via });
        else setRecoverInfo(null);
      } else {
        const msg = payload?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại.';
        setError(msg);
        setRecoverInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverAccount() {
    // luồng recover hiện tại của bạn đang dùng email → chỉ cho bấm nếu via=email
    if (!recoverInfo?.identifier) return;
    if (recoverInfo.via && recoverInfo.via !== 'email') {
      setError('Khôi phục hiện tại chỉ hỗ trợ qua email.');
      return;
    }

    navigate('/auth/account/recover/request', {
      state: { email: recoverInfo.identifier },
    });
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc Số điện thoại</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type="text" // ✅ quan trọng: không dùng type="email" nữa
              placeholder="vd: user@gmail.com hoặc 0353xxxxxx"
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
