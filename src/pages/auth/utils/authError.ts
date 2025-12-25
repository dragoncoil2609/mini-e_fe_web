export type AuthFieldKey =
  | 'identifier'
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'otp'
  | 'newPassword';

export function guessAuthFieldFromMessage(message: string): AuthFieldKey | null {
  const msg = (message ?? '').toLowerCase();
  if (!msg) return null;

  if (msg.includes('name')) return 'name';
  if (msg.includes('email')) return 'email';
  if (msg.includes('số điện thoại') || msg.includes('sđt') || msg.includes('phone')) return 'phone';
  if (msg.includes('otp')) return 'otp';
  if (msg.includes('confirm') || msg.includes('xác nhận') || msg.includes('confirmpassword')) return 'confirmPassword';
  if (msg.includes('mật khẩu mới') || msg.includes('newpassword')) return 'newPassword';
  if (msg.includes('password') || msg.includes('mật khẩu')) return 'password';
  if (msg.includes('identifier')) return 'identifier';

  return null;
}


