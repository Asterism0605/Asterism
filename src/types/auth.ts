export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  /** 有值 = 此帳號是顧問(consultants.profile_id 連結),由 DB 端指定。 */
  consultantId?: string | null;
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
