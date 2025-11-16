// src/pages/auth/RecoverRequestPage.tsx
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

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
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Khôi phục tài khoản</h2>
      <p>
        Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng nhập email để nhận mã OTP
        khôi phục tài khoản.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            style={{ width: '100%' }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 4 }}>{error}</p>
        )}

        {success && (
          <p style={{ color: 'green', marginTop: 4 }}>{success}</p>
        )}

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu khôi phục'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
