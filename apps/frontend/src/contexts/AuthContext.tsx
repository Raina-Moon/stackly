'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  saveAuth,
  getAuth,
  getUser,
  clearAuth,
  logout as logoutApi,
  refreshTokens,
  isTokenExpiring,
} from '@/lib/auth';
import { updateSocketAuth } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 인증 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      const auth = getAuth();

      if (auth) {
        // 토큰 만료 임박 시 갱신 시도
        if (isTokenExpiring()) {
          const refreshed = await refreshTokens();
          if (!refreshed) {
            clearAuth();
            setUser(null);
            setIsLoading(false);
            return;
          }
          // Update socket auth with new token after refresh
          updateSocketAuth();
        }

        setUser(auth.user);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 토큰 자동 갱신 (14분마다 체크)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (isTokenExpiring()) {
        const refreshed = await refreshTokens();
        if (!refreshed) {
          setUser(null);
        } else {
          // Update socket auth with new token
          updateSocketAuth();
        }
      }
    }, 14 * 60 * 1000); // 14분

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      remember = false
    ): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.success) {
          saveAuth(
            {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            },
            data.user,
            remember
          );
          setUser(data.user);
          return { success: true, message: '로그인 성공' };
        }

        return { success: false, message: data.message };
      } catch {
        return { success: false, message: '서버 연결에 실패했습니다' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    // 저장소의 사용자 정보도 업데이트
    const auth = getAuth();
    if (auth) {
      const remember = localStorage.getItem('stackly_remember') === 'true';
      saveAuth(
        {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresIn: auth.expiresIn,
        },
        updatedUser,
        remember
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
