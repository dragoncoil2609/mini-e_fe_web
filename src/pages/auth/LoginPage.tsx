import type { FormEvent } from 'react';
import React, { useState } from 'react';
import { AuthApi } from '../../api/auth.api';

export function LoginPage() {
  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('Aa123456!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await AuthApi.login({ email, password });
      console.log('Login success:', data.user);
      // TODO: điều hướng sang trang home hoặc /me
      // navigate('/');  // nếu dùng react-router
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            style={{ width: '100%' }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Mật khẩu</label>
          <input
            style={{ width: '100%' }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 8 }}>{error}</p>
        )}

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
