import type { UserProfileDto } from './types.js';

export interface MessageResponseDto {
  message: string;
}

export interface ApiErrorResponseDto {
  error: string;
}

export interface DevTokenResponseDto {
  devToken?: string;
  devAccessToken?: string;
}

export type DevMessageResponseDto = MessageResponseDto & DevTokenResponseDto;

export interface RegisterRequestDto {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface VerifyEmailRequestDto {
  token: string;
}

export interface EmailOnlyRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  password: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequestDto {
  newEmail: string;
}

export interface ChangeDisplayNameRequestDto {
  displayName: string;
}

export interface DeleteAccountRequestDto {
  password: string;
}

export interface RefreshResponseDto {
  accessToken: string;
}

export interface LoginSessionDto {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDto;
}

export interface RefreshSessionDto {
  accessToken: string;
  refreshToken: string;
}

export interface ChangeDisplayNameResponseDto {
  user: UserProfileDto;
}
