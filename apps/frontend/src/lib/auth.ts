const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface StoredAuth extends AuthTokens {
  user: User;
  expiresAt: number;
}

const STORAGE_KEY = 'stackly_auth';

// 토큰 저장 (localStorage 또는 sessionStorage)
export function saveAuth(tokens: AuthTokens, user: User, remember: boolean = false): void {
  const storage = remember ? localStorage : sessionStorage;
  const expiresAt = Date.now() + tokens.expiresIn * 1000;

  const authData: StoredAuth = {
    ...tokens,
    user,
    expiresAt,
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(authData));

  // remember 여부도 저장 (페이지 새로고침 시 어떤 storage를 쓸지 판단용)
  localStorage.setItem('stackly_remember', remember ? 'true' : 'false');
}

// 저장된 인증 정보 가져오기
export function getAuth(): StoredAuth | null {
  const remember = localStorage.getItem('stackly_remember') === 'true';
  const storage = remember ? localStorage : sessionStorage;
  const data = storage.getItem(STORAGE_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data) as StoredAuth;
  } catch {
    return null;
  }
}

// Access Token 가져오기
export function getAccessToken(): string | null {
  const auth = getAuth();
  return auth?.accessToken || null;
}

// Refresh Token 가져오기
export function getRefreshToken(): string | null {
  const auth = getAuth();
  return auth?.refreshToken || null;
}

// 사용자 정보 가져오기
export function getUser(): User | null {
  const auth = getAuth();
  return auth?.user || null;
}

// 토큰 만료 확인 (만료 1분 전이면 true)
export function isTokenExpiring(): boolean {
  const auth = getAuth();
  if (!auth) return true;

  // 만료 1분 전이면 갱신 필요
  return Date.now() >= auth.expiresAt - 60 * 1000;
}

// 로그아웃 (로컬 데이터 삭제)
export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('stackly_remember');
}

// 토큰 갱신
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (data.success) {
      const auth = getAuth();
      const remember = localStorage.getItem('stackly_remember') === 'true';

      if (auth) {
        saveAuth(
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
          },
          auth.user,
          remember
        );
      }
      return true;
    }

    // 갱신 실패시 로그아웃
    clearAuth();
    return false;
  } catch {
    clearAuth();
    return false;
  }
}

// API 요청을 위한 fetch wrapper
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 토큰 만료 임박시 갱신 시도
  if (isTokenExpiring()) {
    await refreshTokens();
  }

  const accessToken = getAccessToken();

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 응답시 토큰 갱신 후 재시도
  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newAccessToken = getAccessToken();
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return response;
}

// 서버에 로그아웃 요청
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // 로그아웃 API 실패해도 로컬은 정리
    }
  }

  clearAuth();
}

// 모든 기기에서 로그아웃
export async function logoutAll(): Promise<boolean> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    clearAuth();
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/auth/logout-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    clearAuth();
    return data.success;
  } catch {
    clearAuth();
    return false;
  }
}
