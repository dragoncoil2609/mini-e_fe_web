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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#f8f9fa',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            ✓
          </div>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
            color: '#1a1a1a',
          }}
        >
          Xác minh tài khoản
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px',
            fontSize: '14px',
          }}
        >
          Vui lòng gửi OTP và nhập mã OTP để xác minh tài khoản
          (yêu cầu bạn đã đăng nhập).
        </p>

        <button
          type="button"
          onClick={handleRequestOtp}
          disabled={loadingRequest}
          style={{
            width: '100%',
            padding: '14px',
            background: loadingRequest ? '#9ca3af' : '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loadingRequest ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
            marginBottom: '20px',
          }}
        >
          {loadingRequest ? 'Đang gửi OTP...' : 'Gửi / Gửi lại OTP xác minh'}
        </button>

        {info && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '15px',
              background: '#fff',
            }}
          >
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
              Email: <strong>{info.email}</strong>
            </p>
            {info.isVerified && (
              <p style={{ color: '#16a34a', margin: '4px 0', fontSize: '14px' }}>
                Tài khoản đã được xác minh.
              </p>
            )}
            {info.otp && (
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
                OTP (dev): <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{info.otp}</code>
              </p>
            )}
            {info.expiresAt && (
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
                Hết hạn lúc: {info.expiresAt}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#555',
                fontWeight: '500',
              }}
            >
              Nhập mã OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
          </div>

          {error && (
            <div
              style={{
                color: '#dc2626',
                marginBottom: '16px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {verified === true && (
            <div
              style={{
                color: '#16a34a',
                marginBottom: '16px',
                padding: '12px',
                background: '#dcfce7',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              Xác minh thành công! Đang chuyển vào Home...
            </div>
          )}

          {verified === false && (
            <div
              style={{
                color: '#dc2626',
                marginBottom: '16px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              Xác minh thất bại. Vui lòng kiểm tra lại OTP.
            </div>
          )}

          <button
            type="submit"
            disabled={loadingVerify}
            style={{
              width: '100%',
              padding: '14px',
              background: loadingVerify ? '#9ca3af' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loadingVerify ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              marginBottom: '20px',
            }}
          >
            {loadingVerify ? 'Đang xác minh...' : 'Xác minh tài khoản'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '20px',
          }}
        >
          <Link
            to="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
