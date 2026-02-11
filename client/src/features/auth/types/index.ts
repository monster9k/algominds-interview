export interface RegisterCredentials {
  email: string;
  name: string;
  password?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
