// src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
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

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'identifier', string>>
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
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <h1 className="title">Đăng ký tài khoản</h1>
        <p className="description">
          Điền thông tin bên dưới để tạo tài khoản mới.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              className={`input ${fieldErrors.name ? 'inputError' : ''}`}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />
            {fieldErrors.name && <div className="fieldError">{fieldErrors.name}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={`input ${fieldErrors.email ? 'inputError' : ''}`}
              placeholder="user@gmail.com"
              autoComplete="email"
            />
            {fieldErrors.email && <div className="fieldError">{fieldErrors.email}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="text"
              className={`input ${
                fieldErrors.phone || fieldErrors.identifier ? 'inputError' : ''
              }`}
              placeholder="0353xxxxxx"
              autoComplete="tel"
            />
            {fieldErrors.phone && <div className="fieldError">{fieldErrors.phone}</div>}
            {!fieldErrors.phone && fieldErrors.identifier && (
              <div className="fieldError">{fieldErrors.identifier}</div>
            )}
          </div>

          <div className="formGroup">
            <label className="label">Mật khẩu</label>

            <div className="passwordWrapper">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                className={`input passwordInput ${fieldErrors.password ? 'inputError' : ''}`}
                autoComplete="new-password"
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

          <div className="formGroupLast">
            <label className="label">Nhập lại mật khẩu</label>

            <div className="passwordWrapper">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input passwordInput ${fieldErrors.confirmPassword ? 'inputError' : ''}`}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>

            {fieldErrors.confirmPassword && (
              <div className="fieldError">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}