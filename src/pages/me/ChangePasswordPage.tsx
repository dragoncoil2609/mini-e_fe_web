import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaCreditCard,
  FaEye,
  FaEyeSlash,
  FaHeadset,
  FaInfoCircle,
  FaKey,
  FaLock,
  FaPaperPlane,
  FaRedoAlt,
  FaShieldAlt,
  FaTimesCircle,
  FaTruck,
} from 'react-icons/fa';

import AccountSidebar from '../../components/account/AccountSidebar';
import {
  changeMyPassword,
  getMe,
  requestChangePasswordOtp,
} from '../../api/users.api';

import newPasswordLockImg from '../../assets/brand/new_password_lock.png';

import './ChangePasswordPage.css';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  otp: string;
}

type VisiblePasswordField =
  | 'currentPassword'
  | 'newPassword'
  | 'confirmNewPassword';

const initialForm: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
  otp: '',
};

function getApiMessage(error: any, fallback: string) {
  const message = error?.response?.data?.message || error?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      score: 0,
      label: 'Chưa nhập mật khẩu',
      className: 'empty',
    };
  }

  if (score <= 2) {
    return {
      score,
      label: 'Mật khẩu yếu',
      className: 'weak',
    };
  }

  if (score <= 4) {
    return {
      score,
      label: 'Mật khẩu khá',
      className: 'medium',
    };
  }

  return {
    score,
    label: 'Mật khẩu mạnh',
    className: 'strong',
  };
}

function isStrongEnough(password: string) {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<ChangePasswordForm>(initialForm);
  const [visibleFields, setVisibleFields] = useState<
    Record<VisiblePasswordField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const [accountEmail, setAccountEmail] = useState('');
  const [otpTarget, setOtpTarget] = useState('');

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.newPassword),
    [form.newPassword],
  );

  const passwordMatched =
    form.confirmNewPassword.length > 0 &&
    form.newPassword === form.confirmNewPassword;

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        setIsLoadingUser(true);

        const user = await getMe();

        if (!mounted) return;

        setAccountEmail(user.email || '');
      } catch {
        if (!mounted) return;

        setAccountEmail('');
      } finally {
        if (mounted) {
          setIsLoadingUser(false);
        }
      }
    }

    void loadMe();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function updateField<K extends keyof ChangePasswordForm>(
    key: K,
    value: ChangePasswordForm[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrorMessage('');
  }

  function togglePasswordVisible(field: VisiblePasswordField) {
    setVisibleFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  async function handleSendOtp() {
    try {
      setIsSendingOtp(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await requestChangePasswordOtp();

      setOtpTarget(result.target || accountEmail || '');
      setCooldown(60);
      setSuccessMessage(
        result.message ||
          'Mã OTP đổi mật khẩu đã được gửi về email của bạn.',
      );
    } catch (error) {
      setErrorMessage(
        getApiMessage(error, 'Không thể gửi mã OTP đổi mật khẩu.'),
      );
    } finally {
      setIsSendingOtp(false);
    }
  }

  function validateForm() {
    if (!form.currentPassword.trim()) {
      return 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (!form.newPassword.trim()) {
      return 'Vui lòng nhập mật khẩu mới.';
    }

    if (!isStrongEnough(form.newPassword)) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.';
    }

    if (form.newPassword === form.currentPassword) {
      return 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    }

    if (!form.confirmNewPassword.trim()) {
      return 'Vui lòng xác nhận mật khẩu mới.';
    }

    if (form.newPassword !== form.confirmNewPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }

    if (!form.otp.trim()) {
      return 'Vui lòng nhập mã OTP đã gửi về email.';
    }

    if (form.otp.trim().length < 4) {
      return 'Mã OTP không hợp lệ.';
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = validateForm();

    if (message) {
      setErrorMessage(message);
      setSuccessMessage('');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await changeMyPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
        otp: form.otp.trim(),
      });

      setForm(initialForm);
      setCooldown(0);
      setOtpTarget('');
      setSuccessMessage(result.message || 'Đổi mật khẩu thành công.');
    } catch (error) {
      setErrorMessage(getApiMessage(error, 'Không thể đổi mật khẩu.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPasswordInput(
    field: VisiblePasswordField,
    label: string,
    placeholder: string,
  ) {
    return (
      <div className="change-password-form-group">
        <label htmlFor={field}>
          {label} <span>*</span>
        </label>

        <div className="change-password-input-wrap">
          <FaLock className="change-password-input-icon" />

          <input
            id={field}
            type={visibleFields[field] ? 'text' : 'password'}
            value={form[field]}
            onChange={(event) => updateField(field, event.target.value)}
            placeholder={placeholder}
            autoComplete="new-password"
          />

          <button
            type="button"
            className="change-password-eye-btn"
            onClick={() => togglePasswordVisible(field)}
            aria-label={visibleFields[field] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {visibleFields[field] ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mochi-page change-password-page">
      <div className="mochi-container">
        <div className="mochi-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>›</span>
          <span>Tài khoản của tôi</span>
          <span>›</span>
          <strong>Đổi mật khẩu</strong>
        </div>

        <div className="change-password-layout">
          <aside className="change-password-sidebar">
            <AccountSidebar />
          </aside>

          <main className="change-password-main">
            <section className="mochi-card change-password-card">
              <div className="change-password-form-panel">
                <div className="change-password-header">
                  <div className="change-password-title-icon">
                    <FaKey />
                  </div>

                  <div>
                    <h1>Đổi mật khẩu</h1>
                    <p>
                      Vui lòng chọn mật khẩu mạnh để bảo mật tài khoản của bạn.
                    </p>
                  </div>
                </div>

                {successMessage && (
                  <div className="change-password-alert success">
                    <FaCheckCircle />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="change-password-alert error">
                    <FaTimesCircle />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="change-password-otp-box">
                  <div className="change-password-otp-info">
                    <span>
                      <FaInfoCircle />
                    </span>

                    <div>
                      <strong>Mã OTP xác nhận</strong>
                      <p>
                        {otpTarget
                          ? `Mã đã được gửi tới ${otpTarget}.`
                          : isLoadingUser
                            ? 'Đang kiểm tra email tài khoản...'
                            : accountEmail
                              ? `OTP sẽ được gửi tới ${accountEmail}.`
                              : 'Tài khoản cần có email để nhận mã OTP.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="change-password-send-otp-btn"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || cooldown > 0}
                  >
                    <FaPaperPlane />
                    {isSendingOtp
                      ? 'Đang gửi...'
                      : cooldown > 0
                        ? `Gửi lại sau ${cooldown}s`
                        : 'Gửi mã OTP'}
                  </button>
                </div>

                <form className="change-password-form" onSubmit={handleSubmit}>
                  {renderPasswordInput(
                    'currentPassword',
                    'Mật khẩu hiện tại',
                    'Nhập mật khẩu hiện tại',
                  )}

                  {renderPasswordInput(
                    'newPassword',
                    'Mật khẩu mới',
                    'Nhập mật khẩu mới',
                  )}

                  <div
                    className={`change-password-strength ${passwordStrength.className}`}
                  >
                    <div className="change-password-strength-bars">
                      <span className={passwordStrength.score >= 1 ? 'active' : ''} />
                      <span className={passwordStrength.score >= 2 ? 'active' : ''} />
                      <span className={passwordStrength.score >= 3 ? 'active' : ''} />
                      <span className={passwordStrength.score >= 4 ? 'active' : ''} />
                    </div>

                    <p>{passwordStrength.label}</p>
                  </div>

                  {renderPasswordInput(
                    'confirmNewPassword',
                    'Xác nhận mật khẩu mới',
                    'Nhập lại mật khẩu mới',
                  )}

                  {form.confirmNewPassword && (
                    <div
                      className={
                        passwordMatched
                          ? 'change-password-match valid'
                          : 'change-password-match invalid'
                      }
                    >
                      {passwordMatched ? <FaCheckCircle /> : <FaTimesCircle />}
                      <span>
                        {passwordMatched
                          ? 'Mật khẩu khớp với mật khẩu mới'
                          : 'Mật khẩu xác nhận chưa khớp'}
                      </span>
                    </div>
                  )}

                  <div className="change-password-form-group">
                    <label htmlFor="otp">
                      Mã OTP <span>*</span>
                    </label>

                    <div className="change-password-input-wrap">
                      <FaShieldAlt className="change-password-input-icon" />

                      <input
                        id="otp"
                        value={form.otp}
                        onChange={(event) =>
                          updateField(
                            'otp',
                            event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 10),
                          )
                        }
                        placeholder="Nhập mã OTP từ email"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>
                  </div>

                  <div className="change-password-actions">
                    <button
                      type="submit"
                      className="mochi-btn mochi-btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>

                    <button
                      type="button"
                      className="mochi-btn mochi-btn-outline"
                      onClick={() => navigate('/me/profile')}
                      disabled={isSubmitting}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              </div>

              <div className="change-password-hero">
                <div className="change-password-hero-glow" />

                <img src={newPasswordLockImg} alt="Đổi mật khẩu" />

                <div className="change-password-security-note">
                  <FaShieldAlt />
                  <div>
                    <strong>Bảo mật tài khoản</strong>
                    <p>Không chia sẻ mật khẩu và mã OTP cho bất kỳ ai.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="change-password-service-strip">
              <div className="change-password-service-item">
                <span className="shipping">
                  <FaTruck />
                </span>

                <div>
                  <strong>Miễn phí vận chuyển</strong>
                  <p>Cho đơn từ 300k</p>
                </div>
              </div>

              <div className="change-password-service-item">
                <span className="return">
                  <FaRedoAlt />
                </span>

                <div>
                  <strong>Đổi trả dễ dàng</strong>
                  <p>Trong vòng 7 ngày</p>
                </div>
              </div>

              <div className="change-password-service-item">
                <span className="payment">
                  <FaCreditCard />
                </span>

                <div>
                  <strong>Thanh toán an toàn</strong>
                  <p>Bảo mật tuyệt đối</p>
                </div>
              </div>

              <div className="change-password-service-item">
                <span className="support">
                  <FaHeadset />
                </span>

                <div>
                  <strong>Hỗ trợ 24/7</strong>
                  <p>Luôn sẵn sàng hỗ trợ</p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}