import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage, getBeStatus } from '../../api/apiError';
import { AuthCard } from './components/AuthCard';
import { PasswordInput } from './components/PasswordInput';
import { AuthMessage } from './components/AuthMessage';
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

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
    <AuthCard
      title="Đăng nhập"
      description="Nhập email hoặc số điện thoại và mật khẩu để tiếp tục."
    >
      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label">Email hoặc Số điện thoại</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            placeholder="vd: user@gmail.com hoặc 0353xxxxxx"
            className={`auth-input ${fieldErrors.identifier ? 'auth-input-error' : ''}`}
            autoComplete="username"
          />
          {fieldErrors.identifier && (
            <div className="auth-field-error">{fieldErrors.identifier}</div>
          )}
        </div>

        <PasswordInput
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          error={fieldErrors.password ?? null}
        />

        <AuthMessage type="error" text={error} />

        {recoverInfo && (
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={handleRecoverAccount} className="auth-btn-warning">
              Khôi phục tài khoản
            </button>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </form>

      <div className="auth-links">
        <Link to="/register" className="auth-link">
          Tạo tài khoản
        </Link>
        <Link to="/forgot-password" className="auth-link">
          Quên mật khẩu?
        </Link>
      </div>
    </AuthCard>
  );
}