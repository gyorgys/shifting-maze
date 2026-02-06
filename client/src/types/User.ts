export interface User {
  username: string;
  displayName: string;
  token: string;  // JWT token for authentication
}

export interface CreateUserFormData {
  username: string;
  displayName: string;
  password: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}
