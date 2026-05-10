import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { AuthCard } from './components/AuthCard';
import { PasswordInput } from './components/PasswordInput';
import { AuthMessage } from './components/AuthMessage';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

function normalizePhone(raw: string) {
  let v = raw.trim().replace(/[\s.-]/g, '');
  if (!v) return v;
  if (v.startsWith('+')) return v;
  if (v.startsWith('0')) return `+84${v.slice(1)}`;
  if (v.startsWith('84')) return `+${v}`;
  return v;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<
      Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'identifier', string>
    >
  >({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const nameTrim = name.trim();
      const emailTrim = email.trim();
      const phoneTrim = normalizePhone(phone);

      if (!nameTrim) {
        const msg = 'Vui lòng nhập họ tên.';
        setError(msg);
        setFieldErrors({ name: msg });
        return;
      }

      if (!emailTrim && !phoneTrim) {
        const msg = 'Vui lòng nhập Email hoặc Số điện thoại.';
        setError(msg);
        setFieldErrors({ identifier: msg });
        return;
      }

      const payload: any = {
        name: nameTrim,
        password,
        confirmPassword,
      };

      if (emailTrim) payload.email = emailTrim.toLowerCase();
      if (phoneTrim) payload.phone = phoneTrim;

      await AuthApi.register(payload);

      setSuccess('Đăng ký thành công! Bạn có thể đăng nhập.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      const msg = getBeMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.');
      setError(msg);

      const beField = guessAuthFieldFromMessage(msg);
      const mappedField =
        beField === 'email' ||
        beField === 'phone' ||
        beField === 'name' ||
        beField === 'password' ||
        beField === 'confirmPassword'
          ? beField
          : beField === 'identifier'
            ? 'identifier'
            : null;

      setFieldErrors(mappedField ? { [mappedField]: msg } : {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Đăng ký tài khoản" description="Điền thông tin bên dưới để tạo tài khoản mới.">
      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label">Họ tên</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            className={`auth-input ${fieldErrors.name ? 'auth-input-error' : ''}`}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
          />
          {fieldErrors.name && <div className="auth-field-error">{fieldErrors.name}</div>}
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
            placeholder="user@gmail.com"
            autoComplete="email"
          />
          {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="text"
            className={`auth-input ${
              fieldErrors.phone || fieldErrors.identifier ? 'auth-input-error' : ''
            }`}
            placeholder="0353xxxxxx"
            autoComplete="tel"
          />
          {fieldErrors.phone && <div className="auth-field-error">{fieldErrors.phone}</div>}
          {!fieldErrors.phone && fieldErrors.identifier && (
            <div className="auth-field-error">{fieldErrors.identifier}</div>
          )}
        </div>

        <PasswordInput
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu"
          autoComplete="new-password"
          error={fieldErrors.password ?? null}
        />

        <PasswordInput
          label="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword ?? null}
        />

        <AuthMessage type="error" text={error} />
        <AuthMessage type="success" text={success} />

        <div style={{ marginTop: 18 }}>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </div>
      </form>

      <div className="auth-link-center">
        <Link to="/login" className="auth-link">
          Đã có tài khoản? Đăng nhập
        </Link>
      </div>
    </AuthCard>
  );
}