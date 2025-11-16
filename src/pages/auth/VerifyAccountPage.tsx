// src/pages/auth/VerifyAccountPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/auth.api';
import type { RequestVerifyResponse } from '../../api/types';

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

      // Nếu BE báo đã verified rồi ⇒ cho vào Home luôn
      if (data.isVerified) {
        setVerified(true);
        navigate('/home');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không gửi được OTP. Vui lòng thử lại.';
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

      if (data.verified) {
        // ✅ verify thành công → vào Home
        navigate('/home');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Xác minh thất bại. Vui lòng kiểm tra lại OTP.';
      setError(msg);
    } finally {
      setLoadingVerify(false);
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '40px auto' }}>
      <h2>Xác minh tài khoản</h2>
      <p>
        Vui lòng gửi OTP và nhập mã OTP để xác minh tài khoản
        (yêu cầu bạn đã đăng nhập).
      </p>

      <button
        type="button"
        style={{ marginTop: 8, marginBottom: 12 }}
        onClick={handleRequestOtp}
        disabled={loadingRequest}
      >
        {loadingRequest ? 'Đang gửi OTP...' : 'Gửi / Gửi lại OTP xác minh'}
      </button>

      {info && (
        <div style={{ marginBottom: 16, padding: 10, border: '1px solid #ddd' }}>
          <p>Email: <b>{info.email}</b></p>
          {info.isVerified && (
            <p style={{ color: 'green' }}>Tài khoản đã được xác minh.</p>
          )}
          {info.otp && (
            <p>OTP (dev): <code>{info.otp}</code></p>
          )}
          {info.expiresAt && (
            <p>Hết hạn lúc: {info.expiresAt}</p>
          )}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: 8 }}>
          <label>Nhập mã OTP</label>
          <input
            style={{ width: '100%' }}
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ color: 'red', marginTop: 4 }}>{error}</p>
        )}

        {verified === true && (
          <p style={{ color: 'green', marginTop: 4 }}>
            Xác minh thành công! Đang chuyển vào Home...
          </p>
        )}

        {verified === false && (
          <p style={{ color: 'red', marginTop: 4 }}>
            Xác minh thất bại. Vui lòng kiểm tra lại OTP.
          </p>
        )}

        <button
          type="submit"
          style={{ marginTop: 12, width: '100%' }}
          disabled={loadingVerify}
        >
          {loadingVerify ? 'Đang xác minh...' : 'Xác minh tài khoản'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
