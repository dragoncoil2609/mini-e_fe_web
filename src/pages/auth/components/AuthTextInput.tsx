import type { ReactNode } from 'react';

type AuthTextInputProps = {
  label?: string;
  value: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  icon?: ReactNode;
  id?: string;
  onChange: (value: string) => void;
};

export default function AuthTextInput({
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  icon,
  id,
  onChange,
}: AuthTextInputProps) {
  return (
    <label className="auth-field">
      {label && <span className="auth-label">{label}</span>}

      <span className="auth-input-wrap">
        {icon && <span className="auth-input-icon">{icon}</span>}

        <input
          id={id}
          className={`auth-input ${icon ? 'auth-input-has-icon' : ''}`}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}