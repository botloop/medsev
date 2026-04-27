/**
 * Authentication Types
 * Shared between client and server for type safety
 */

export type UserRole = 'admin' | 'medical' | 'viewer';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  serialNumber?: string;
  linkedPersonnelId?: string | null;
  permissions: string[];
  profileCompleted?: boolean;
  createdAt: Date | string;
  lastLogin: Date | string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface SerialNumberLoginRequest {
  serialNumber: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface JWTPayload {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}
