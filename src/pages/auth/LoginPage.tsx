// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage, getBeStatus } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface RecoverInfo {
  identifier: string;
  via?: string;
}

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizePhone(raw: string) {
  let v = raw.trim().replace(/[\s.-]/g, '');
  if (!v) return v;
  if (v.startsWith('+')) return v;
  if (v.startsWith('0')) return `+84${v.slice(1)}`;
  if (v.startsWith('84')) return `+${v}`;
  return v;
}

export function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'identifier' | 'password', string>>
  >({});
  const [recoverInfo, setRecoverInfo] = useState<RecoverInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setRecoverInfo(null);
    setLoading(true);

    try {
      const id = identifier.trim();

      if (!id) {
        const msg = 'Vui lòng nhập Email hoặc Số điện thoại.';
        setError(msg);
        setFieldErrors({ identifier: msg });
        return;
      }

      const payload = looksLikeEmail(id)
        ? { email: id.toLowerCase(), password }
        : { phone: normalizePhone(id), password };

      const data = await AuthApi.login(payload);

      if (!data.user) {
        setError('Phản hồi đăng nhập không hợp lệ. Thiếu thông tin người dùng.');
        return;
      }

      try {
        localStorage.setItem('current_user', JSON.stringify(data.user));
      } catch (e) {
        console.error('Cannot save user to localStorage', e);
      }

      if (!data.user.isVerified) {
        navigate('/verify-account', {
          state: {
            verifyInfo: data.verify ?? null,
          },
        });
        return;
      }

      if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/home');
    } catch (err: any) {
      const status = getBeStatus(err);
      const payload = err?.response?.data;

      if (status === 423 && payload?.data?.needRecover) {
        const identifier = payload.data.identifier as string | undefined;
        const via = payload.data.via as string | undefined;

        const msg = getBeMessage(
          err,
          'Tài khoản đã bị vô hiệu hoá. Vui lòng khôi phục trước khi đăng nhập.',
        );

        setError(msg);
        setFieldErrors({ identifier: msg });

        if (identifier) setRecoverInfo({ identifier, via });
        else setRecoverInfo(null);
      } else {
        const msg = getBeMessage(err, 'Đăng nhập thất bại, vui lòng kiểm tra lại.');
        setError(msg);

        const beField = guessAuthFieldFromMessage(msg);
        const mappedField =
          beField === 'email' || beField === 'phone' || beField === 'identifier'
            ? 'identifier'
            : beField === 'password'
              ? 'password'
              : null;

        setFieldErrors(mappedField ? { [mappedField]: msg } : {});
        setRecoverInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverAccount() {
    if (!recoverInfo?.identifier) return;

    navigate('/auth/account/recover/request', {
      state: { identifier: recoverInfo.identifier },
    });
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <h1 className="title">Đăng nhập</h1>
        <p className="description">Nhập email hoặc số điện thoại và mật khẩu để tiếp tục.</p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc Số điện thoại</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type="text"
              placeholder="vd: user@gmail.com hoặc 0353xxxxxx"
              className={`input ${fieldErrors.identifier ? 'inputError' : ''}`}
              autoComplete="username"
            />
            {fieldErrors.identifier && (
              <div className="fieldError">{fieldErrors.identifier}</div>
            )}
          </div>

          <div className="formGroupLast">
            <label className="label">Mật khẩu</label>

            <div className="passwordWrapper">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                className={`input passwordInput ${fieldErrors.password ? 'inputError' : ''}`}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            {fieldErrors.password && <div className="fieldError">{fieldErrors.password}</div>}
          </div>

          {error && <div className="error">{error}</div>}

          {recoverInfo && (
            <div style={{ marginBottom: 16 }}>
              <button type="button" onClick={handleRecoverAccount} className="recoverButton">
                Khôi phục tài khoản
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="links">
          <Link to="/register" className="link">
            Tạo tài khoản
          </Link>
          <Link to="/forgot-password" className="link">
            Quên mật khẩu?
          </Link>
        </div>
      </div>
    </div>
  );
}