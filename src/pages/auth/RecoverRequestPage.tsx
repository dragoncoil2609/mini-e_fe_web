// src/pages/auth/RecoverRequestPage.tsx
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface RecoverRequestState {
  identifier?: string;
  email?: string; // backward compatible
}

export function RecoverRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RecoverRequestState | null;

  const [identifier, setIdentifier] = useState((state?.identifier ?? state?.email ?? '').trim());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldError(null);
    setLoading(true);

    try {
      await AuthApi.recoverRequest(identifier);

      setSuccess(
        'Đã gửi yêu cầu khôi phục tài khoản. Vui lòng kiểm tra Email/SMS để lấy OTP.',
      );

      setTimeout(() => {
        navigate('/auth/account/recover/confirm', {
          state: { identifier },
        });
      }, 1000);
    } catch (err: any) {
      const msg = getBeMessage(err, 'Không gửi được yêu cầu khôi phục. Vui lòng thử lại.');
      setError(msg);
      const beField = guessAuthFieldFromMessage(msg);
      const mapped =
        beField === 'email' || beField === 'phone' || beField === 'identifier' ? 'identifier' : null;
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

        <h1 className="title">Khôi phục tài khoản</h1>

        <p className="description">
          Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng nhập Email hoặc SĐT để nhận mã OTP khôi phục tài khoản.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email hoặc SĐT</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`input ${fieldError ? 'inputError' : ''}`}
              placeholder="user@gmail.com hoặc 09xx..."
            />
            {fieldError && <div className="fieldError">{fieldError}</div>}
          </div>

          {error && <div className="error">{error}</div>}

          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu khôi phục'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
