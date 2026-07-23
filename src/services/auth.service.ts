import type { EmailOtpType } from '@supabase/supabase-js';
import {
  currentSessionApi,
  loginApi,
  logoutApi,
  registerApi,
  requestPasswordResetApi,
  resendSignupApi,
  signInWithGoogleApi,
  updatePasswordApi,
  verifyOtpApi
} from '@/api/auth.api';
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth';

// Service layer 負責解開 API response，
// 讓 store / page 使用 domain data，而不是處理 ApiResponse metadata 等傳輸層細節。
export async function register(
  payload: RegisterPayload,
  emailRedirectTo?: string
): Promise<AuthSession> {
  const response = await registerApi(payload, emailRedirectTo);

  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await loginApi(payload);

  return response.data;
}

export async function logout(): Promise<void> {
  await logoutApi();
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return currentSessionApi();
}

export async function resendSignup(email: string, emailRedirectTo?: string): Promise<void> {
  await resendSignupApi(email, emailRedirectTo);
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
  await signInWithGoogleApi(redirectTo);
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  await requestPasswordResetApi(email, redirectTo);
}

export async function updatePassword(newPassword: string): Promise<void> {
  await updatePasswordApi(newPassword);
}

export async function verifyOtp(tokenHash: string, type: EmailOtpType): Promise<AuthSession> {
  const response = await verifyOtpApi(tokenHash, type);

  return response.data;
}
