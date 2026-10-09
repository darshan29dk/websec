import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';
import { authApi } from '../services/api/authApi';
import { ApiClient } from '../services/api/client';
import { AuthResponse, LoginRequest, RegisterRequest, VerifyLoginOtpRequest } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  verifyLoginOtp: (payload: VerifyLoginOtpRequest) => Promise<AuthResponse>;
  resendLoginOtp: (email: string) => Promise<{ otpCode?: string } | void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aegis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('aegis_access_token');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          ApiClient.clearTokens();
          setUser(null);
        }
      } else {
        ApiClient.clearTokens();
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      ApiClient.clearTokens();
      setUser(null);
    };
    window.addEventListener('globalshield:auth:unauthorized', handleUnauthorized);
    window.addEventListener('aegis:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('globalshield:auth:unauthorized', handleUnauthorized);
      window.removeEventListener('aegis:auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLoginOtp = async (payload: VerifyLoginOtpRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyLoginOtp(payload);
      if (response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const resendLoginOtp = async (email: string): Promise<{ otpCode?: string } | void> => {
    return await authApi.resendLoginOtp(email);
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.user) {
        setUser(response.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const updated = await authApi.getCurrentUser();
      setUser(updated);
    } catch {
      // Ignore fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
