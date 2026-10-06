import { ApiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../types/auth';
import { User } from '../../types/user';

export const authApi = {
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
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
