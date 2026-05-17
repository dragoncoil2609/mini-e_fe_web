import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import { getAuthErrorMessage } from './utils/authError';

import verifyEnvelope from '../../assets/brand/verify_envelope.png';

import './style/auth.css';

type VerifyState = {
  identifier?: string;
  from?: string;
  verify?: {
    required: true;
    via: 'email' | 'phone';
    target: string;
    expiresAt: string;
    sent: boolean;
    cooldownRemaining?: number;
    devOtp?: string;
    otp?: string;
  };
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.max(0, totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getSecondsLeft(expiresAt?: string) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as VerifyState | null;

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [verifyInfo, setVerifyInfo] = useState(locationState?.verify ?? null);

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft(locationState?.verify?.expiresAt));

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState(
    locationState?.verify
      ? 'Mã xác thực đã được gửi. Vui lòng nhập mã để hoàn tất xác minh.'
      : '',
  );
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const otp = useMemo(() => otpValues.join(''), [otpValues]);
  const devOtp = verifyInfo?.devOtp ?? verifyInfo?.otp;

  useEffect(() => {
    if (verifyInfo?.expiresAt) {
      setSecondsLeft(getSecondsLeft(verifyInfo.expiresAt));
    }
  }, [verifyInfo?.expiresAt]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (locationState?.verify) return;

    AuthApi.requestVerify()
      .then((data) => {
        setVerifyInfo(data as any);
        setMessageType('info');
        setMessage('Mã xác thực đã được gửi đến tài khoản của bạn.');
      })
      .catch((error) => {
        setMessageType('error');
        setMessage(getAuthErrorMessage(error, 'Không thể gửi mã xác thực'));
      });
  }, []);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtpValues((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (otp.length !== 6) {
      setMessageType('error');
      setMessage('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await AuthApi.verifyAccount(otp);

      setMessageType('success');
      setMessage('Xác thực tài khoản thành công');

      navigate(locationState?.from ?? '/home', { replace: true });
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Xác thực thất bại'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setMessage('');

    try {
      const data = await AuthApi.requestVerify(verifyInfo?.via);
      setVerifyInfo(data as any);
      setOtpValues(['', '', '', '', '', '']);

      setMessageType('success');
      setMessage('Đã gửi lại mã xác thực');
      inputRefs.current[0]?.focus();
    } catch (error) {
      setMessageType('error');
      setMessage(getAuthErrorMessage(error, 'Không thể gửi lại mã'));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard variant="compact">
      <div className="auth-title-center">
        <img className="auth-art" src={verifyEnvelope} alt="Xác thực tài khoản" />
      </div>

      <h1 className="auth-title auth-title-center">Xác thực tài khoản</h1>

      <div className="auth-otp-target">
        Chúng tôi đã gửi mã xác thực đến
        <br />
        <strong>{verifyInfo?.target ?? locationState?.identifier ?? 'tài khoản của bạn'}</strong>
      </div>

      <AuthMessage type={messageType} message={message} devOtp={devOtp} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-otp-grid">
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="auth-otp-input"
              value={value}
              inputMode="numeric"
              maxLength={1}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <div className="auth-countdown">
          Mã sẽ hết hạn sau <strong>{formatTime(secondsLeft || 0)}</strong>
        </div>

        <button className="auth-btn" disabled={loading}>
          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>
      </form>

      <div className="auth-resend">
        Chưa nhận được mã?{' '}
        <button
          type="button"
          className="auth-link"
          onClick={handleResend}
          disabled={resending || secondsLeft > 0}
        >
          {resending ? 'Đang gửi...' : 'Gửi lại mã'}
        </button>
      </div>
    </AuthCard>
  );
}