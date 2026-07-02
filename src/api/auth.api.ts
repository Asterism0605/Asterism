import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { getSupabase } from '@/api/supabaseClient';
import type { ApiError, ApiResponse } from '@/types/api';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

function apiError(message: string, code: string, status: number): ApiError {
  return { code, message, status };
}

function mapSupabaseAuthError(error: { message?: string; status?: number } | null): ApiError {
  const raw = error?.message ?? '';
  if (/invalid login credentials/i.test(raw))
    return apiError('Incorrect email or password.', 'INVALID_CREDENTIALS', 401);
  if (/already registered|already exists|user already/i.test(raw))
    return apiError('This email is already registered.', 'EMAIL_EXISTS', 409);
  if (/password should be at least/i.test(raw))
    return apiError('Password must be at least 6 characters.', 'INVALID_PASSWORD', 400);
  if (/rate limit|you can only request|after \d+ seconds/i.test(raw))
    return apiError('Please wait a moment before requesting another email.', 'RATE_LIMITED', 429);
  console.warn('[auth] unclassified error:', raw);
  return apiError('Authentication failed. Please try again later.', 'AUTH_ERROR', error?.status ?? 400);
}

interface ProfileRow {
  display_name: string | null;
  is_admin: boolean;
}

async function fetchProfile(userId: string): Promise<{ displayName: string | null; isAdmin: boolean }> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('display_name, is_admin')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.warn('[auth] fetchProfile 失敗，降級為非 admin：', error.code);
  }
  const row = data as ProfileRow | null;
  return { displayName: row?.display_name ?? null, isAdmin: row?.is_admin ?? false };
}

async function toAuthSession(session: Session, fallbackDisplayName: string): Promise<AuthSession> {
  const profile = await fetchProfile(session.user.id);
  const email = session.user.email ?? '';
  const user: UserProfile = {
    id: session.user.id,
    email,
    displayName: profile.displayName || fallbackDisplayName || email.split('@')[0] || 'Asterism User',
    isAdmin: profile.isAdmin,
    createdAt: session.user.created_at ?? new Date().toISOString()
  };
  // session.expires_at 缺漏時退回「現在 +1 小時」，避免產生 1970 的誤導時間戳。
  const expiresAtSec = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
  return {
    user,
    accessToken: session.access_token,
    expiresAt: new Date(expiresAtSec * 1000).toISOString()
  };
}

function envelope(session: AuthSession): ApiResponse<AuthSession> {
  return { data: session, meta: { timestamp: new Date().toISOString() } };
}

export async function registerApi(payload: RegisterPayload): Promise<ApiResponse<AuthSession>> {
  const { data, error } = await getSupabase().auth.signUp({
    email: payload.email,
    password: payload.password,
    options: { data: { display_name: payload.displayName ?? '' } }
  });
  if (error) {
    throw mapSupabaseAuthError(error);
  }
  // signUp 成功但沒有 session = 已開啟 Confirm email，需先驗證信箱（非錯誤）。
  // 前端「請至信箱收信」提示頁由 issue #86 接手處理此狀態。
  if (!data.session) {
    throw apiError('Please verify your email address to continue.', 'EMAIL_CONFIRMATION_REQUIRED', 200);
  }
  return envelope(await toAuthSession(data.session, payload.displayName ?? ''));
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthSession>> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: payload.email,
    password: payload.password
  });
  if (error || !data.session) {
    throw mapSupabaseAuthError(error ?? { message: 'No session' });
  }
  return envelope(await toAuthSession(data.session, ''));
}

export async function logoutApi(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

export async function currentSessionApi(): Promise<AuthSession | null> {
  const { data } = await getSupabase().auth.getSession();
  if (!data.session) {
    return null;
  }
  return toAuthSession(data.session, '');
}

// LINE 登入 / 信箱驗證回流：Edge Function（或驗證信）給的一次性 token_hash 換成 Supabase session。
export async function verifyOtpApi(
  tokenHash: string,
  type: EmailOtpType
): Promise<ApiResponse<AuthSession>> {
  const { data, error } = await getSupabase().auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.session) {
    throw mapSupabaseAuthError(error ?? { message: 'No session' });
  }
  return envelope(await toAuthSession(data.session, ''));
}

// 重寄信箱驗證信：用同一個 Confirm signup 模板再寄一次（連結仍回 /auth/callback?type=signup）。
export async function resendSignupApi(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resend({ type: 'signup', email });
  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

export async function signInWithGoogleApi(redirectTo: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if (error) {
    throw mapSupabaseAuthError(error);
  }
}
