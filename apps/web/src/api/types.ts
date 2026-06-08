export interface MessageResponseDto {
  message: string;
}

export interface DevTokenResponseDto {
  devToken?: string;
  devAccessToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface EmailOnlyRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface RefreshResponseDto {
  accessToken: string;
}
