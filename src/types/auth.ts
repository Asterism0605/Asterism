export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  expiresAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
