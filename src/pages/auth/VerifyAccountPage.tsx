import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { RequestVerifyResponse } from '../../api/types';
import { getBeMessage } from '../../api/apiError';
import { guessAuthFieldFromMessage } from './utils/authError';
import './style/auth.css';

export function VerifyAccountPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [info, setInfo] = useState<RequestVerifyResponse | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  async function handleRequestOtp() {
    setError(null);
    setFieldError(null);
    setVerified(null);
    setLoadingRequest(true);

    try {
      const data = await AuthApi.requestVerify();
      setInfo(data);

      if (data.isVerified) {
        setVerified(true);
        setTimeout(() => navigate('/home'), 800);
      }
    } catch (err: any) {
      const msg = getBeMessage(err, 'Không gửi được OTP. Vui lòng thử lại.');
      setError(msg);
    } finally {
      setLoadingRequest(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setVerified(null);
    setLoadingVerify(true);

    try {
      const data = await AuthApi.verifyAccount(otp.trim());
      const ok = Boolean(data.verified || data.isVerified);

      setVerified(ok);

      if (ok) {
        setTimeout(() => navigate('/home'), 800);
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

  const sentTo = info?.target ? `${info.via === 'phone' ? 'SĐT' : 'Email'}: ${info.target}` : null;

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <button onClick={() => navigate('/home')} className="home-button">
            🏠 Về trang chủ
          </button>
        </div>

        <h1 className="title">Xác minh tài khoản</h1>

        <p className="description">
          Vui lòng gửi OTP và nhập mã OTP để xác minh tài khoản.
        </p>

        <button
          type="button"
          onClick={handleRequestOtp}
          disabled={loadingRequest}
          className="requestButton"
        >
          {loadingRequest ? 'Đang gửi OTP...' : 'Gửi / Gửi lại OTP xác minh'}
        </button>

        {info && (
          <div className="infoBox">
            {sentTo && <p className="infoText">{sentTo}</p>}

            {info.isVerified && (
              <p className="infoTextSuccess">Tài khoản đã được xác minh.</p>
            )}

            {info.sent === true && !info.isVerified && (
              <p className="infoTextSuccess">OTP đã được gửi thành công.</p>
            )}

            {info.sent === false && typeof info.cooldownRemaining === 'number' && (
              <p className="infoText">
                Bạn vừa yêu cầu OTP trước đó. Vui lòng đợi thêm{' '}
                <code className="infoCode">{info.cooldownRemaining}s</code> để gửi lại.
              </p>
            )}

            {info.expiresAt && (
              <p className="infoText">OTP hết hạn lúc: {info.expiresAt}</p>
            )}

            {info.otp && (
              <p className="infoText">
                OTP (dev): <code className="infoCode">{info.otp}</code>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="formGroup">
            <label className="label">Nhập mã OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`input ${fieldError ? 'inputError' : ''}`}
              placeholder="Nhập mã OTP 6 số"
              inputMode="numeric"
            />
            {fieldError && <div className="fieldError">{fieldError}</div>}
          </div>

          {error && <div className="error">{error}</div>}

          {verified === true && (
            <div className="verified">Xác minh thành công! Đang chuyển vào Home...</div>
          )}

          {verified === false && (
            <div className="notVerified">Xác minh thất bại. Vui lòng kiểm tra lại OTP.</div>
          )}

          <button type="submit" disabled={loadingVerify} className="button">
            {loadingVerify ? 'Đang xác minh...' : 'Xác minh tài khoản'}
          </button>
        </form>

        <div className="linkContainer">
          <Link to="/login" className="link">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}