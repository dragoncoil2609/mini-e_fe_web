// src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

interface RecoverInfo {
  email: string;
  via?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('quochiep1610@gmail.com');
  const [password, setPassword] = useState('Aa123456!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thông tin khôi phục nếu tài khoản bị vô hiệu hoá
  const [recoverInfo, setRecoverInfo] = useState<RecoverInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverInfo(null);
    setLoading(true);
    try {
      const data = await AuthApi.login({ email, password });

      // Nếu chưa verify → đi verify trước
      if (!data.user.isVerified) {
        navigate('/verify-account');
        return;
      }

      // ✅ Đã verify: lưu thông tin user để Home / Admin dùng
      try {
        localStorage.setItem('current_user', JSON.stringify(data.user));
      } catch (e) {
        console.error('Cannot save user to localStorage', e);
      }

      // ✅ Điều hướng theo role
      if (data.user.role === 'ADMIN') {
        // Trang home admin
        navigate('/admin');
      } else {
        // USER hoặc SELLER
        navigate('/home');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const payload = err?.response?.data;

      // 🔒 Trường hợp tài khoản bị vô hiệu hoá (status 423)
      if (status === 423 && payload?.data?.needRecover) {
        const identifier = payload.data.identifier as string | undefined;
        const via = payload.data.via as string | undefined;

        setError(
          payload?.message ||
            'Tài khoản đã bị vô hiệu hoá. Vui lòng khôi phục trước khi đăng nhập.',
        );

        if (identifier) {
          setRecoverInfo({
            email: identifier,
            via,
          });
        } else {
          setRecoverInfo(null);
        }
      } else {
        // Lỗi bình thường
        const msg =
          payload?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại.';
        setError(msg);
        setRecoverInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverAccount() {
    if (!recoverInfo?.email) return;
    navigate('/auth/account/recover/request', {
      state: { email: recoverInfo.email },
    });
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
            🏪
          </div>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center',
            color: '#1a1a1a',
          }}
        >
          Login
        </h1>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
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

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
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

          {recoverInfo && (
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleRecoverAccount}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Khôi phục tài khoản
              </button>
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
            {loading ? 'Đang đăng nhập...' : 'Login'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            marginTop: '20px',
          }}
        >
          <Link
            to="/register"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Create an account
          </Link>
          <Link
            to="/forgot-password"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Forget password?
          </Link>
        </div>
      </div>
    </div>
  );
}
