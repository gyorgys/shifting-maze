export interface User {
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
}

export interface GetSaltResponse {
  salt: string;
}

export interface LoginRequest {
  username: string;
  passwordHash: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;  // JWT token for authentication (present when success is true)
  user?: {
    username: string;
    displayName: string;
  };
  message?: string;  // Error message (present when success is false)
}
