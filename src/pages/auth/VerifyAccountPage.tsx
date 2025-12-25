// src/pages/auth/VerifyAccountPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { RequestVerifyResponse } from '../../api/types';
import './VerifyAccountPage.css';

export function VerifyAccountPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RequestVerifyResponse | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  async function handleRequestOtp() {
    setError(null);
    setVerified(null);
    setLoadingRequest(true);

    try {
      const data = await AuthApi.requestVerify();
      setInfo(data);

      if (data.isVerified) {
        setVerified(true);
        navigate('/home');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Không gửi được OTP. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoadingRequest(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerified(null);
    setLoadingVerify(true);

    try {
      const data = await AuthApi.verifyAccount(otp);
      setVerified(data.verified);

      if (data.verified) navigate('/home');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Xác minh thất bại. Vui lòng kiểm tra lại OTP.';
      setError(msg);
    } finally {
      setLoadingVerify(false);
    }
  }

  const sentTo =
    info?.phone ? `SĐT: ${info.phone}` : info?.email ? `Email: ${info.email}` : null;

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
          Vui lòng gửi OTP và nhập mã OTP để xác minh tài khoản (yêu cầu bạn đã đăng nhập).
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

            {info.otp && (
              <p className="infoText">
                OTP (dev): <code className="infoCode">{info.otp}</code>
              </p>
            )}

            {info.expiresAt && (
              <p className="infoText">Hết hạn lúc: {info.expiresAt}</p>
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
              required
              className="input"
            />
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
