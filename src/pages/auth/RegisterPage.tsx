// src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // optional
  const [phone, setPhone] = useState(''); // optional
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      const phoneTrim = phone.trim();

      const payload: any = {
        name: nameTrim,
        password,
        confirmPassword,
      };

      // ✅ chỉ gửi field nếu có giá trị (tránh gửi "" làm BE validate fail)
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
        beField === 'email' || beField === 'phone' || beField === 'name' || beField === 'password' || beField === 'confirmPassword'
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
        <h1 className="title">Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              className={`input ${fieldErrors.name ? 'inputError' : ''}`}
            />
            {fieldErrors.name && <div className="fieldError">{fieldErrors.name}</div>}
          </div>

          <div className="formGroup">
            <label className="label">Email (không bắt buộc)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={`input ${fieldErrors.email || fieldErrors.identifier ? 'inputError' : ''}`}
              placeholder="vd: user@gmail.com"
            />
            {(fieldErrors.email || fieldErrors.identifier) && (
              <div className="fieldError">{fieldErrors.email ?? fieldErrors.identifier}</div>
            )}
          </div>

          <div className="formGroup">
            <label className="label">Số điện thoại (không bắt buộc)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className={`input ${fieldErrors.phone || fieldErrors.identifier ? 'inputError' : ''}`}
              placeholder="vd: 0353xxxxxx"
            />
            {(fieldErrors.phone || fieldErrors.identifier) && (
              <div className="fieldError">{fieldErrors.phone ?? fieldErrors.identifier}</div>
            )}
          </div>

          <div className="formGroup">
            <label className="label">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={`input ${fieldErrors.password ? 'inputError' : ''}`}
            />
            {fieldErrors.password && <div className="fieldError">{fieldErrors.password}</div>}
          </div>

          <div className="formGroupLast">
            <label className="label">Confirm Password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className={`input ${fieldErrors.confirmPassword ? 'inputError' : ''}`}
            />
            {fieldErrors.confirmPassword && (
              <div className="fieldError">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đăng ký...' : 'Register'}
          </button>
        </form>

        <div className="links">
          <Link to="/login" className="link">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
