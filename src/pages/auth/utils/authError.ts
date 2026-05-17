export function getAuthErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  const err = error as any;

  const data = err?.response?.data;
  const message = data?.message ?? err?.message;

  if (Array.isArray(message)) {
    return message[0] || fallback;
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return fallback;
}