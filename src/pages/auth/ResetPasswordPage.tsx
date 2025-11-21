import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

interface ResetLocationState {
  email?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetLocationState | null;

  // Lấy email từ state (truyền từ ForgotPasswordPage)
  const initialEmail = state?.email || '';

  const [email] = useState(initialEmail); // không cho sửa
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('@Ngulon123');
  const [confirmPassword, setConfirmPassword] = useState('@Ngulon123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email) {
      setError('Thiếu email. Vui lòng quay lại bước Quên mật khẩu.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      setLoading(false);
      return;
    }

    try {
      const data = await AuthApi.resetPassword({
        email,
        otp,
        password,
        confirmPassword,
      });

      if (data.reset) {
        setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError('Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.';
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
            🔑
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
          Đặt lại mật khẩu
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px',
            fontSize: '14px',
          }}
        >
          Nhập mã OTP và mật khẩu mới cho tài khoản.
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
              readOnly
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
                background: '#f3f4f6',
                color: '#6b7280',
              }}
            />
            {!email && (
              <div
                style={{
                  color: '#dc2626',
                  marginTop: '4px',
                  fontSize: '14px',
                  padding: '8px',
                  background: '#fee2e2',
                  borderRadius: '8px',
                }}
              >
                Không có email. Vui lòng quay lại bước Quên mật khẩu.
              </div>
            )}
          </div>

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
              Mã OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Nhập lại mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
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
            to="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Đã đặt lại xong? Đăng nhập
          </Link>
          <Link
            to="/forgot-password"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Chưa có OTP?
          </Link>
        </div>
      </div>
    </div>
  );
}
