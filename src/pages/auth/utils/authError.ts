export function guessAuthFieldFromMessage(message?: string | null) {
  const msg = (message ?? '').toLowerCase();

  if (!msg) return null;

  if (msg.includes('email')) return 'email';
  if (msg.includes('số điện thoại') || msg.includes('so dien thoai') || msg.includes('phone'))
    return 'phone';
  if (msg.includes('otp')) return 'otp';
  if (msg.includes('confirm')) return 'confirmPassword';
  if (msg.includes('mật khẩu mới') || msg.includes('mat khau moi') || msg.includes('newpassword'))
    return 'newPassword';
  if (msg.includes('mật khẩu') || msg.includes('mat khau') || msg.includes('password'))
    return 'password';
  if (msg.includes('họ tên') || msg.includes('ho ten') || msg.includes('name')) return 'name';
  if (msg.includes('identifier')) return 'identifier';

  return null;
}