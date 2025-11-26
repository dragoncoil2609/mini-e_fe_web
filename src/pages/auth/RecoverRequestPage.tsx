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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#f8f9fa',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            🔄
          </div>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
            color: '#1a1a1a',
          }}
        >
          Khôi phục tài khoản
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px',
            fontSize: '14px',
          }}
        >
          Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng nhập email để nhận mã OTP
          khôi phục tài khoản.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          {error && (
            <div
              style={{
                color: '#dc2626',
                marginBottom: '16px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                color: '#16a34a',
                marginBottom: '16px',
                padding: '12px',
                background: '#dcfce7',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              marginBottom: '20px',
            }}
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu khôi phục'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '20px',
          }}
        >
          <Link
            to="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
