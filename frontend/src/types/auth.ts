import { User, UserRole } from './user';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  otp?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
