import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { AuthCard } from './components/AuthCard';
import { AuthMessage } from './components/AuthMessage';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setLoading(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      const msg = 'Email không được để trống';
      setError(msg);
      setFieldError(msg);
      setLoading(false);
      return;
    }

    try {
      await AuthApi.forgotPassword(trimmedEmail);

      navigate('/reset-password', {
        state: { email: trimmedEmail },
      });
    } catch (err: any) {
      const msg = getBeMessage(err, 'Không gửi được OTP. Vui lòng thử lại.');
      setError(msg);

      const beField = guessAuthFieldFromMessage(msg);
      const mapped = beField === 'email' ? 'email' : null;
      setFieldError(mapped ? msg : null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Quên mật khẩu" description="Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.">
      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className={`auth-input ${fieldError ? 'auth-input-error' : ''}`}
            placeholder="user@gmail.com"
            autoComplete="email"
          />
          {fieldError && <div className="auth-field-error">{fieldError}</div>}
        </div>

        <AuthMessage type="error" text={error} />

        <div style={{ marginTop: 18 }}>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
          </button>
        </div>
      </form>

      <div className="auth-link-center">
        <Link to="/login" className="auth-link">
          Đã nhớ mật khẩu? Đăng nhập
        </Link>
      </div>
    </AuthCard>
  );
}