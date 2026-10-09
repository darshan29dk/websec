import { User, UserRole } from './user';

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInMs?: number;
  user?: User;
  mfaRequired?: boolean;
  message?: string;
  email?: string;
  otpCode?: string;
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
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyLoginOtpRequest {
  email: string;
  otp: string;
}
