export interface LoginRequest {
  email: string;
  rawPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  rawPassword: string;
}

export interface TokenResponse {
  token: string;
}