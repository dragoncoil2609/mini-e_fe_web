import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthApi } from '../../api/auth.api';
import AuthCard from './components/AuthCard';
import AuthMessage from './components/AuthMessage';
import { getAuthErrorMessage } from './utils/authError';

import verifyEnvelope from '../../assets/brand/verify_envelope.png';

import './style/auth.css';

type VerifyInfo = {
  required?: true;
  via?: 'email' | 'phone';
  target?: string;
  expiresAt?: string;
  sent?: boolean;
  cooldownRemaining?: number;
  devOtp?: string;
  otp?: string;
  isVerified?: boolean;
};

type VerifyState = {
  identifier?: string;
  from?: string;
  verify?: VerifyInfo;
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

function getVerifyMessage(info?: VerifyInfo | null) {
  if (!info) return '';

  if (info.isVerified) {
    return 'Tài khoản của bạn đã được xác thực.';
  }

  if (info.sent === false && info.cooldownRemaining) {
    return `Mã xác thực đã được tạo trước đó. Vui lòng đợi ${info.cooldownRemaining}s trước khi gửi lại, hoặc nhập mã hiện tại nếu bạn đã nhận được.`;
  }

  if (info.sent === false) {
    if (info.via === 'phone') {
      return 'Không gửi được mã qua SMS. Vui lòng ưu tiên dùng email để xác minh tài khoản hoặc thử lại sau.';
    }

    return 'Không gửi được mã xác thực. Vui lòng thử gửi lại sau.';
  }

  return 'Mã xác thực đã được gửi. Vui lòng nhập mã để hoàn tất xác minh.';
}

function getVerifyMessageType(info?: VerifyInfo | null): 'error' | 'success' | 'info' {
  if (!info) return 'info';

  if (info.isVerified) return 'success';

  if (info.sent === false && !info.cooldownRemaining) {
    return 'error';
  }

  return 'info';
}

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as VerifyState | null;

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [verifyInfo, setVerifyInfo] = useState<VerifyInfo | null>(
    locationState?.verify ?? null,
  );

  const [secondsLeft, setSecondsLeft] = useState(
    getSecondsLeft(locationState?.verify?.expiresAt),
  );

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState(getVerifyMessage(locationState?.verify));
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>(
    getVerifyMessageType(locationState?.verify),
  );

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
        const info = data as VerifyInfo;

        setVerifyInfo(info);
        setMessageType(getVerifyMessageType(info));
        setMessage(getVerifyMessage(info));
      })
      .catch((error) => {
        setMessageType('error');
        setMessage(getAuthErrorMessage(error, 'Không thể gửi mã xác thực'));
      });
  }, [locationState?.verify]);

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
      const info = data as VerifyInfo;

      setVerifyInfo(info);
      setOtpValues(['', '', '', '', '', '']);

      if (info.sent === false) {
        setMessageType(getVerifyMessageType(info));
        setMessage(getVerifyMessage(info));
      } else {
        setMessageType('success');
        setMessage('Đã gửi lại mã xác thực');
      }

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