import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { RequestVerifyResponse } from '../../api/types';
import { getBeMessage } from '../../api/apiError';
import { AuthCard } from './components/AuthCard';
import { AuthMessage } from './components/AuthMessage';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

interface VerifyLocationState {
  verifyInfo?: RequestVerifyResponse | null;
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export function VerifyAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyLocationState | null;

  const [otp, setOtp] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  const [info, setInfo] = useState<RequestVerifyResponse | null>(
    state?.verifyInfo ?? {
      sent: true,
    },
  );

  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(
    typeof state?.verifyInfo?.cooldownRemaining === 'number'
      ? state.verifyInfo.cooldownRemaining
      : 0,
  );

  useEffect(() => {
    if (typeof info?.cooldownRemaining === 'number') {
      setCountdown(info.cooldownRemaining);
    }
  }, [info?.cooldownRemaining]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const sentTo = useMemo(() => {
    if (!info?.target) return null;
    return `${info.via === 'phone' ? 'Số điện thoại' : 'Email'}: ${info.target}`;
  }, [info]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setVerified(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      const msg = 'Vui lòng nhập mã OTP.';
      setError(msg);
      setFieldError(msg);
      return;
    }

    setLoadingVerify(true);

    try {
      const data = await AuthApi.verifyAccount(trimmedOtp);
      const ok = Boolean(data.verified || data.isVerified);

      setVerified(ok);

      if (ok) {
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (err: any) {
      const msg = getBeMessage(err, 'Xác minh thất bại. Vui lòng kiểm tra lại OTP.');
      setError(msg);

      const beField = guessAuthFieldFromMessage(msg);
      setFieldError(beField === 'otp' ? msg : null);
      setVerified(false);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function handleResendOtp() {
    if (loadingResend) return;

    setError(null);
    setFieldError(null);
    setVerified(null);
    setResendMessage(null);
    setLoadingResend(true);

    try {
      const data = await AuthApi.requestVerify();
      setInfo(data);

      if (data.isVerified) {
        setVerified(true);
        setResendMessage('Tài khoản đã được xác minh.');
        setTimeout(() => navigate('/home'), 800);
        return;
      }

      if (data.sent === true) {
        setResendMessage('Đã gửi mã mới. Vui lòng chờ để lấy mã khác.');
      } else if (data.sent === false && typeof data.cooldownRemaining === 'number') {
        setResendMessage(
          `Đã gửi mã trước đó, vui lòng chờ ${data.cooldownRemaining}s để lấy mã khác.`,
        );
      } else {
        setResendMessage('Yêu cầu gửi mã đã được xử lý.');
      }
    } catch (err: any) {
      const msg = getBeMessage(err, 'Không gửi được mã mới. Vui lòng thử lại.');
      setError(msg);
    } finally {
      setLoadingResend(false);
    }
  }

  const hero = <div className="auth-verify-icon">🛡️</div>;

  return (
    <AuthCard
      title="Xác minh tài khoản"
      description="Mã xác minh đã được gửi đến tài khoản của bạn. Vui lòng nhập mã OTP để hoàn tất xác minh."
      hero={hero}
    >
      <div className="auth-info-box">
        {sentTo && <p className="auth-info-text">{sentTo}</p>}

        {info?.sent === true && (
          <p className="auth-info-text-success">Mã xác minh đã được gửi thành công.</p>
        )}

        {info?.expiresAt && (
          <p className="auth-info-text">Mã OTP hết hạn lúc: {formatDateTime(info.expiresAt)}</p>
        )}

        {countdown > 0 && (
          <p className="auth-info-text">
            Bạn có thể yêu cầu mã mới sau{' '}
            <code className="auth-info-code">{countdown}s</code>.
          </p>
        )}
      </div>

      <form onSubmit={handleVerify}>
        <div className="auth-form-group">
          <label className="auth-label">Mã OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={`auth-input ${fieldError ? 'auth-input-error' : ''}`}
            placeholder="Nhập mã OTP 6 số"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
          />
          {fieldError && <div className="auth-field-error">{fieldError}</div>}
        </div>

        <AuthMessage type="error" text={error} />
        <AuthMessage type="success" text={resendMessage} />
        <AuthMessage
          type="verified"
          text={verified === true ? 'Xác minh thành công. Đang chuyển vào trang chính...' : null}
        />
        <AuthMessage
          type="not-verified"
          text={verified === false ? 'Xác minh thất bại. Vui lòng kiểm tra lại mã OTP.' : null}
        />

        <div style={{ marginTop: 18 }}>
          <button type="submit" disabled={loadingVerify} className="auth-btn">
            {loadingVerify ? 'Đang xác minh...' : 'Xác minh tài khoản'}
          </button>
        </div>
      </form>

      <div className="auth-resend-wrap">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={loadingResend}
          className="auth-resend-btn"
        >
          {loadingResend
            ? 'Đang gửi mã mới...'
            : countdown > 0
              ? `Bạn chưa nhận được mã? Lấy mã mới sau ${countdown}s`
              : 'Bạn chưa nhận được mã? Lấy mã mới'}
        </button>
      </div>

      <div className="auth-link-center" style={{ marginTop: 8 }}>
        <Link to="/login" className="auth-link">
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthCard>
  );
}