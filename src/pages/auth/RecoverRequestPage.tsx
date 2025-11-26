// src/pages/auth/RecoverRequestPage.tsx
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './RecoverRequestPage.css';

interface RecoverRequestState {
  email?: string;
}

export function RecoverRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RecoverRequestState | null;

  const [email, setEmail] = useState(state?.email || 'quochiep1610@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await AuthApi.recoverRequest(email);

      setSuccess(
        'Đã gửi yêu cầu khôi phục tài khoản. Vui lòng kiểm tra email để lấy OTP.'
      );

      // Sau khi gửi xong → sang bước confirm, mang theo email
      setTimeout(() => {
        navigate('/auth/account/recover/confirm', {
          state: { email },
        });
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không gửi được yêu cầu khôi phục. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="icon">🔄</div>
        </div>

        <h1 className="title">Khôi phục tài khoản</h1>

        <p className="description">
          Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng nhập email để nhận mã OTP
          khôi phục tài khoản.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
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
