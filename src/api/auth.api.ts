import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/api/supabaseClient';
import type { ApiError, ApiResponse } from '@/types/api';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

function apiError(message: string, code: string, status: number): ApiError {
  return { code, message, status };
}

function mapSupabaseAuthError(error: { message?: string; status?: number } | null): ApiError {
  const raw = error?.message ?? '';
  if (/invalid login credentials/i.test(raw)) return apiError('帳號或密碼錯誤', 'INVALID_CREDENTIALS', 401);
  if (/already registered|already exists|user already/i.test(raw)) return apiError('此 email 已註冊', 'EMAIL_EXISTS', 409);
  if (/password should be at least/i.test(raw)) return apiError('密碼不符合規則（至少 6 碼）', 'INVALID_PASSWORD', 400);
  console.warn('[auth] 未分類錯誤：', raw);
  return apiError('驗證失敗，請稍後再試', 'AUTH_ERROR', error?.status ?? 400);
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
  return {
    user,
    accessToken: session.access_token,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString()
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
  if (error || !data.session) {
    throw mapSupabaseAuthError(error ?? { message: 'No session（請確認 Supabase Email 驗證已關閉）' });
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
  await getSupabase().auth.signOut();
}

export async function currentSessionApi(): Promise<AuthSession | null> {
  const { data } = await getSupabase().auth.getSession();
  if (!data.session) {
    return null;
  }
  return toAuthSession(data.session, '');
}
