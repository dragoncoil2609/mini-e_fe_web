import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('quochiep1610@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Gửi yêu cầu OTP
      await AuthApi.forgotPassword(email);

      // 👉 Sau khi gửi OTP thành công, chuyển sang /reset-password
      // và truyền kèm email đã nhập
      navigate('/reset-password', {
        state: { email },
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không gửi được OTP. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Quên mật khẩu</h2>
      <p>Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.</p>

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

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Đã nhớ mật khẩu?{' '}
        <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
