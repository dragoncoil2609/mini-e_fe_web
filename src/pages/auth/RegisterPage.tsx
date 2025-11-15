import type { FormEvent } from 'react';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('Quoc Hiep');
  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('Aa123456!');
  const [confirmPassword, setConfirmPassword] = useState('Aa123456!');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      setLoading(false);
      return;
    }

    try {
      await AuthApi.register({
        name,
        email,
        password,
        confirmPassword,
      });

      setSuccess('Đăng ký thành công! Bạn có thể đăng nhập.');
      // Chờ 1 chút rồi về /login (tuỳ thích)
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Đăng ký tài khoản</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Họ và tên</label>
          <input
            style={{ width: '100%' }}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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

        <div style={{ marginBottom: 8 }}>
          <label>Mật khẩu</label>
          <input
            style={{ width: '100%' }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Nhập lại mật khẩu</label>
          <input
            style={{ width: '100%' }}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Đã có tài khoản?{' '}
        <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}