import { useState } from 'react';

type PasswordInputProps = {
  label: string;
  value: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export default function PasswordInput({
  label,
  value,
  name,
  placeholder = 'Nhập mật khẩu',
  autoComplete,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span className="auth-label">{label}</span>

      <span className="auth-input-wrap">
        <span className="auth-input-icon">🔒</span>

        <input
          className="auth-input auth-input-has-icon auth-input-password"
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </span>
    </label>
  );
}