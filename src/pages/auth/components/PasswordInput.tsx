import { useState } from 'react';
import '../style/auth.css';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-form-group">
      <label className="auth-label">{label}</label>

      <div className="auth-password-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`auth-input auth-password-input ${error ? 'auth-input-error' : ''}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>

      {error ? <div className="auth-field-error">{error}</div> : null}
    </div>
  );
}