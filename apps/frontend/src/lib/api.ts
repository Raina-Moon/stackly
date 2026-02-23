import { getAccessToken, getAuth, refreshTokens, isTokenExpiring, clearAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

interface ApiError {
  message: string;
  statusCode?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(requireAuth: boolean): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (requireAuth) {
      // 토큰 만료 임박 시 갱신
      if (isTokenExpiring()) {
        await refreshTokens();
      }

      const token = getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    const hadAuthSession = requireAuth && !!getAuth();
    const headers = await this.getHeaders(requireAuth);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // 401 Unauthorized - 토큰 갱신 후 재시도
    if (response.status === 401 && requireAuth) {
      const refreshed = await refreshTokens();

      if (refreshed) {
        const newHeaders = await this.getHeaders(true);
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers: newHeaders,
        });
        return retryResponse.json();
      } else {
        clearAuth();
        // Only force redirect when the user actually had an auth session.
        // Guests may trigger protected requests from pages that intentionally show a login modal.
        if (hadAuthSession && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('인증이 만료되었습니다');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || '요청 처리에 실패했습니다',
        statusCode: response.status,
      };
      throw error;
    }

    return data;
  }

  // GET 요청
  get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST 요청
  post<T>(endpoint: string, data?: unknown, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 요청
  put<T>(endpoint: string, data?: unknown, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH 요청
  patch<T>(endpoint: string, data?: unknown, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  delete<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// 인증이 필요없는 API 클라이언트
export const publicApi = {
  get: <T>(endpoint: string) => api.get<T>(endpoint, { requireAuth: false }),
  post: <T>(endpoint: string, data?: unknown) => api.post<T>(endpoint, data, { requireAuth: false }),
};
