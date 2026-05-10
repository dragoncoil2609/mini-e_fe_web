import '../style/auth.css';

interface AuthMessageProps {
  type: 'error' | 'success' | 'verified' | 'not-verified';
  text?: string | null;
}

export function AuthMessage({ type, text }: AuthMessageProps) {
  if (!text) return null;

  const className =
    type === 'error'
      ? 'auth-error'
      : type === 'success'
        ? 'auth-success'
        : type === 'verified'
          ? 'auth-verified'
          : 'auth-not-verified';

  return <div className={className}>{text}</div>;
}