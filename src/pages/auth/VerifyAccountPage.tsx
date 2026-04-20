// src/pages/auth/VerifyAccountPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { RequestVerifyResponse } from '../../api/types';
import { getBeMessage } from '../../api/apiError';
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
        setResendMessage('Đã gửi mã mới. Vui lòng kiểm tra email/SMS của bạn.');
      } else if (data.sent === false && typeof data.cooldownRemaining === 'number') {
        setResendMessage(
          `Đã gửi mã trước đó. Vui lòng chờ ${data.cooldownRemaining}s để lấy mã khác.`,
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

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginBottom: 18,
            paddingTop: 8,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 12px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              fontSize: 30,
              background: 'rgba(79, 70, 229, 0.10)',
              border: '1px solid rgba(79, 70, 229, 0.16)',
            }}
          >
            🛡️
          </div>

          <h1 className="title" style={{ marginBottom: 8 }}>
            Xác minh tài khoản
          </h1>

          <p className="description" style={{ marginBottom: 0 }}>
            Mã xác minh đã được gửi đến tài khoản của bạn. Vui lòng nhập mã OTP để hoàn tất xác minh.
          </p>
        </div>

        <div
          className="infoBox"
          style={{
            marginBottom: 18,
            background: 'rgba(79, 70, 229, 0.04)',
            borderColor: 'rgba(79, 70, 229, 0.12)',
          }}
        >
          {sentTo && <p className="infoText">{sentTo}</p>}

          {info?.sent === true && (
            <p className="infoTextSuccess">Mã xác minh đã được gửi thành công.</p>
          )}

          {info?.expiresAt && (
            <p className="infoText">Mã OTP hết hạn lúc: {formatDateTime(info.expiresAt)}</p>
          )}

          {countdown > 0 && (
            <p className="infoText">
              Bạn có thể yêu cầu mã mới sau <code className="infoCode">{countdown}s</code>.
            </p>
          )}
        </div>

        <form onSubmit={handleVerify}>
          <div className="formGroup">
            <label className="label">Mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`input ${fieldError ? 'inputError' : ''}`}
              placeholder="Nhập mã OTP 6 số"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
            />
            {fieldError && <div className="fieldError">{fieldError}</div>}
          </div>

          {error && <div className="error">{error}</div>}
          {resendMessage && <div className="success">{resendMessage}</div>}

          {verified === true && (
            <div className="verified">Xác minh thành công. Đang chuyển vào trang chính...</div>
          )}

          {verified === false && (
            <div className="notVerified">Xác minh thất bại. Vui lòng kiểm tra lại mã OTP.</div>
          )}

          <button type="submit" disabled={loadingVerify} className="button">
            {loadingVerify ? 'Đang xác minh...' : 'Xác minh tài khoản'}
          </button>
        </form>

        <div className="linkContainer" style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loadingResend}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(79, 70, 229, 0.95)',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: loadingResend ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              opacity: loadingResend ? 0.7 : 1,
            }}
          >
            {loadingResend
              ? 'Đang gửi mã mới...'
              : countdown > 0
                ? `Bạn chưa nhận được mã? Lấy mã mới sau ${countdown}s`
                : 'Bạn chưa nhận được mã? Lấy mã mới'}
          </button>
        </div>

        <div className="linkContainer" style={{ marginTop: 8 }}>
          <Link to="/login" className="link">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}