// src/api/authToken.ts

const ACCESS_TOKEN_KEY = 'mini_e_access_token';

// Vẫn giữ 1 bản trong RAM cho nhanh
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // Trường hợp không dùng được localStorage (mode private, SSR, ...)
  }
}

export function getAccessToken(): string | null {
  // Ưu tiên lấy từ RAM
  if (inMemoryAccessToken) return inMemoryAccessToken;

  // Nếu RAM chưa có, thử lấy từ localStorage (dùng cho F5 / mở tab mới)
  try {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
    inMemoryAccessToken = stored;
    return stored;
  } catch {
    return inMemoryAccessToken;
  }
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore
  }
}
