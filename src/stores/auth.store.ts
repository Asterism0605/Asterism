import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { EmailOtpType } from '@supabase/supabase-js';
import {
  getCurrentSession,
  login as loginService,
  logout as logoutService,
  register as registerService,
  resendSignup as resendSignupService,
  signInWithGoogle as signInWithGoogleService,
  verifyOtp as verifyOtpService
} from '@/services/auth.service';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null);
  const session = ref<AuthSession | null>(null);
  const isAuthenticated = computed(() => session.value !== null && user.value !== null);
  const isAdmin = computed(() => user.value?.isAdmin === true);

  function applySession(nextSession: AuthSession): AuthSession {
    session.value = nextSession;
    user.value = nextSession.user;
    return nextSession;
  }

  function clear(): void {
    user.value = null;
    session.value = null;
  }

  async function register(payload: RegisterPayload): Promise<AuthSession> {
    return applySession(await registerService(payload));
  }

  async function login(payload: LoginPayload): Promise<AuthSession> {
    return applySession(await loginService(payload));
  }

  // app 啟動時呼叫：有現存 Supabase session 就還原登入（重整不掉）。
  async function hydrate(): Promise<void> {
    const existing = await getCurrentSession();
    if (existing) {
      applySession(existing);
    }
  }

  async function logout(): Promise<void> {
    try {
      await logoutService();
    } finally {
      clear();
    }
  }

  // 組 redirectTo（回流到 /auth/callback，帶消毒過的 next）後觸發 OAuth，瀏覽器整頁導走。
  // next 為空或就是首頁時不掛 query，讓 redirectTo 維持乾淨、好對 Supabase 白名單。
  async function signInWithGoogle(next?: string): Promise<void> {
    const base = `${window.location.origin}/auth/callback`;
    const redirectTo = next && next !== '/' ? `${base}?next=${encodeURIComponent(next)}` : base;
    await signInWithGoogleService(redirectTo);
  }

  // LINE 登入 / 信箱驗證回流：用網址帶回的一次性 token_hash 換 session 並套用登入狀態。
  async function verifyOtp(tokenHash: string, type: EmailOtpType): Promise<AuthSession> {
    return applySession(await verifyOtpService(tokenHash, type));
  }

  // 重寄信箱驗證信（純動作、不改登入狀態）。
  async function resendSignup(email: string): Promise<void> {
    await resendSignupService(email);
  }

  return {
    user,
    session,
    isAuthenticated,
    isAdmin,
    register,
    login,
    hydrate,
    logout,
    signInWithGoogle,
    verifyOtp,
    resendSignup
  };
});
