const ACCESS_TOKEN_KEY = 'mini_e_access_token';

// Vẫn giữ 1 bản trong RAM cho nhanh
let inMemoryAccessToken: string | null = null;

export type AccessTokenPayload = {
  sub?: number;
  id?: number;
  email?: string | null;
  phone?: string | null;
  role?: 'USER' | 'SELLER' | 'ADMIN';
  isVerified?: boolean;
  exp?: number;
  iat?: number;
};

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;

  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // Trường hợp không dùng được localStorage: private mode, SSR,...
  }
}

export function getAccessToken(): string | null {
  // Ưu tiên lấy từ RAM
  if (inMemoryAccessToken) return inMemoryAccessToken;

  // Nếu RAM chưa có, thử lấy từ localStorage
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

export function decodeAccessToken(token?: string | null): AccessTokenPayload | null {
  const rawToken = token ?? getAccessToken();

  if (!rawToken || rawToken === 'undefined' || rawToken === 'null') {
    return null;
  }

  try {
    const parts = rawToken.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);

    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token?: string | null): boolean {
  const payload = decodeAccessToken(token);

  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function isAuthedByToken(): boolean {
  const token = getAccessToken();

  if (!token || token === 'undefined' || token === 'null') {
    return false;
  }

  if (isAccessTokenExpired(token)) {
    clearAccessToken();
    return false;
  }

  return true;
}

export function getCurrentTokenUser(): AccessTokenPayload | null {
  return decodeAccessToken();
}