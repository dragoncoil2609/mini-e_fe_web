import { useState } from 'react';
import type { FormEvent } from "react";
import { Link, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import PasswordInput from './components/PasswordInput';
import { getAuthErrorMessage } from './utils/authError';

import registerBunnyGift from '../../assets/brand/register_bunny_gift.png';

import './style/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('error');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!name.trim()) {
      setMessageType('error');
      setMessage('Vui lòng nhập họ và tên');
      return;
    }

    if (!cleanEmail && !cleanPhone) {
      setMessageType('error');
      setMessage('Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Xác nhận mật khẩu chưa khớp');
      return;
    }

    if (!agree) {
      setMessageType('error');
      setMessage('Bạn cần đồng ý với điều khoản sử dụng');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await AuthApi.register({
        name: name.trim(),
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        password,
        confirmPassword,
      });

      const loginData = await AuthApi.login(
        cleanEmail
          ? { email: cleanEmail, password }
          : { phone: cleanPhone, password },
      );

      navigate('/verify-account', {
        replace: true,
        state: {
          identifier: cleanEmail || cleanPhone,
          verify: loginData.verify,
          from: '/home',
        },
      });
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard variant="wide">
      <div className="auth-card-split auth-card-split-register">
        <div>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tham gia cùng Mochi ngay hôm nay 💗</p>

          <AuthMessage type={messageType} message={message} />

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
              <label className="auth-field">
                <span className="auth-label">Họ và tên</span>
                <span className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    className="auth-input auth-input-has-icon"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    autoComplete="name"
                  />
                </span>
              </label>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <span className="auth-input-wrap">
                  <span className="auth-input-icon">✉️</span>
                  <input
                    className="auth-input auth-input-has-icon"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    autoComplete="email"
                  />
                </span>
              </label>
            </div>

            <label className="auth-field">
              <span className="auth-label">Số điện thoại</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon">📞</span>
                <input
                  className="auth-input auth-input-has-icon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại nếu muốn đăng ký bằng SĐT"
                  autoComplete="tel"
                />
              </span>
            </label>

            <PasswordInput
              label="Mật khẩu"
              value={password}
              placeholder="Tạo mật khẩu"
              autoComplete="new-password"
              onChange={setPassword}
            />

            <PasswordInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              onChange={setConfirmPassword}
            />

            <label className="auth-check">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                Tôi đồng ý với{' '}
                <button type="button" className="auth-link">
                  Điều khoản sử dụng
                </button>{' '}
                và{' '}
                <button type="button" className="auth-link">
                  Chính sách bảo mật
                </button>
              </span>
            </label>

            <button className="auth-btn" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="auth-footer">
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-link">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div>
          <img className="auth-art" src={registerBunnyGift} alt="Đăng ký Mochi" />
        </div>
      </div>
    </AuthCard>
  );
}