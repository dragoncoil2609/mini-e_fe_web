import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import { getBeMessage } from '../../api/apiError';
import { AuthCard } from './components/AuthCard';
import { PasswordInput } from './components/PasswordInput';
import { AuthMessage } from './components/AuthMessage';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface ResetLocationState {
  email?: string;
  identifier?: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetLocationState | null;

  const initialEmail = (state?.email ?? state?.identifier ?? '').trim();

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'otp' | 'password' | 'confirmPassword' | 'email', string>>
  >({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    if (!email) {
      const msg = 'Thiếu email. Vui lòng quay lại bước Quên mật khẩu.';
      setError(msg);
      setFieldErrors({ email: msg });
      setLoading(false);
      return;
    }

    try {
      const data = await AuthApi.resetPassword({
        email,
        otp: otp.trim(),
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
      const msg = getBeMessage(err, 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.');
      setError(msg);

      const beField = guessAuthFieldFromMessage(msg);
      const mapped =
        beField === 'otp' || beField === 'password' || beField === 'confirmPassword'
          ? beField
          : beField === 'email'
            ? 'email'
            : null;

      setFieldErrors(mapped ? { [mapped]: msg } : {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Đặt lại mật khẩu" description="Nhập mã OTP và mật khẩu mới cho email của bạn.">
      <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label className="auth-label">Email</label>
          <input type="text" value={email} readOnly className="auth-input-readonly" />
          {!email && (
            <div className="auth-error-small">
              Không có email. Vui lòng quay lại bước Quên mật khẩu.
            </div>
          )}
          {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Mã OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={`auth-input ${fieldErrors.otp ? 'auth-input-error' : ''}`}
            placeholder="Nhập mã OTP 6 số"
            inputMode="numeric"
          />
          {fieldErrors.otp && <div className="auth-field-error">{fieldErrors.otp}</div>}
        </div>

        <PasswordInput
          label="Mật khẩu mới"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu mới"
          autoComplete="new-password"
          error={fieldErrors.password ?? null}
        />

        <PasswordInput
          label="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword ?? null}
        />

        <AuthMessage type="error" text={error} />
        <AuthMessage type="success" text={success} />

        <div style={{ marginTop: 18 }}>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </div>
      </form>

      <div className="auth-links">
        <Link to="/login" className="auth-link">
          Đã đặt lại xong? Đăng nhập
        </Link>
        <Link to="/forgot-password" className="auth-link">
          Chưa có OTP?
        </Link>
      </div>
    </AuthCard>
  );
}