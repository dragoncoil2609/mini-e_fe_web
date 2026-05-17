type AuthMessageType = 'error' | 'success' | 'info';

type AuthMessageProps = {
  type?: AuthMessageType;
  message?: string;
  devOtp?: string;
};

export default function AuthMessage({
  type = 'info',
  message,
  devOtp,
}: AuthMessageProps) {
  if (!message && !devOtp) return null;

  return (
    <div className={`auth-message auth-message-${type}`}>
      {message && <div>{message}</div>}

      {devOtp && (
        <div className="auth-dev-otp">
          <span>OTP test:</span>
          <span>{devOtp}</span>
        </div>
      )}
    </div>
  );
}