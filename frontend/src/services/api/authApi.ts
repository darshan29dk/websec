import { ApiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../types/auth';
import { User } from '../../types/user';

export const authApi = {
  requestOtp: async (email: string): Promise<void> => {
    await ApiClient.post<void>('/auth/request-otp', { email });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await ApiClient.post<void>('/auth/forgot-password', { email });
  },

  resetPassword: async (payload: { email: string; otp: string; newPassword: string }): Promise<void> => {
    await ApiClient.post<void>('/auth/reset-password', payload);
  },

  register: async (request: RegisterRequest & { otp?: string }): Promise<AuthResponse> => {
    const data = await ApiClient.post<AuthResponse>('/auth/register', request);
    ApiClient.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('aegis_user', JSON.stringify(data.user));
    return data;
  },

  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const data = await ApiClient.post<AuthResponse>('/auth/login', request);
    ApiClient.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('aegis_user', JSON.stringify(data.user));
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await ApiClient.post<void>('/auth/logout');
    } finally {
      ApiClient.clearTokens();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const user = await ApiClient.get<User>('/auth/me');
    localStorage.setItem('aegis_user', JSON.stringify(user));
    return user;
  },
};
