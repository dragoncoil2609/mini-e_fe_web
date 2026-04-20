import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
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
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <h1 className="title">Quên mật khẩu</h1>

        <p className="description">
          Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={`input ${fieldError ? 'inputError' : ''}`}
              placeholder="user@gmail.com"
              autoComplete="email"
            />
            {fieldError && <div className="fieldError">{fieldError}</div>}
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Đã nhớ mật khẩu? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}