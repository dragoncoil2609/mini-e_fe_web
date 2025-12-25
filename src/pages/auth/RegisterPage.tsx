// src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // optional
  const [phone, setPhone] = useState(''); // optional
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const nameTrim = name.trim();
      const emailTrim = email.trim();
      const phoneTrim = phone.trim();

      if (!nameTrim) {
        setError('Vui lòng nhập họ tên.');
        return;
      }

      // ✅ ít nhất 1 trong 2
      if (!emailTrim && !phoneTrim) {
        setError('Vui lòng nhập Email hoặc Số điện thoại (ít nhất 1).');
        return;
      }

      if (password.length < 6) {
        setError('Mật khẩu tối thiểu 6 ký tự.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp.');
        return;
      }

      const payload: any = {
        name: nameTrim,
        password,
        confirmPassword,
      };

      // ✅ chỉ gửi field nếu có giá trị (tránh gửi "" làm BE validate fail)
      if (emailTrim) payload.email = emailTrim.toLowerCase();
      if (phoneTrim) payload.phone = phoneTrim;

      await AuthApi.register(payload);

      setSuccess('Đăng ký thành công! Bạn có thể đăng nhập.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label className="label">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="input"
            />
          </div>

          <div className="formGroup">
            <label className="label">Email (không bắt buộc)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="input"
              placeholder="vd: user@gmail.com"
            />
          </div>

          <div className="formGroup">
            <label className="label">Số điện thoại (không bắt buộc)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className="input"
              placeholder="vd: 0353xxxxxx"
            />
          </div>

          <div className="formGroup">
            <label className="label">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="input"
            />
          </div>

          <div className="formGroupLast">
            <label className="label">Confirm Password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              className="input"
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" disabled={loading} className="button">
            {loading ? 'Đang đăng ký...' : 'Register'}
          </button>
        </form>

        <div className="links">
          <Link to="/login" className="link">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
