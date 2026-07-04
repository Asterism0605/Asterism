import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { EmailOtpType } from '@supabase/supabase-js';
import {
  getCurrentSession,
  login as loginService,
  logout as logoutService,
  register as registerService,
  requestPasswordReset as requestPasswordResetService,
  resendSignup as resendSignupService,
  signInWithGoogle as signInWithGoogleService,
  updatePassword as updatePasswordService,
  verifyOtp as verifyOtpService
} from '@/services/auth.service';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null);
  const session = ref<AuthSession | null>(null);
  const isAuthenticated = computed(() => session.value !== null && user.value !== null);
  const isAdmin = computed(() => user.value?.isAdmin === true);
  // 只在 token_hash + type=recovery 驗證成功後才為 true，是「能改密碼」的唯一憑據。
  // 純記憶體、用完即焚：改完密碼 / 登出即清，重整也會消失（fail-safe 導回請求新連結）。
  const isPasswordRecovery = ref(false);

  function applySession(nextSession: AuthSession): AuthSession {
    session.value = nextSession;
    user.value = nextSession.user;
    return nextSession;
  }

  function clear(): void {
    user.value = null;
    session.value = null;
    isPasswordRecovery.value = false;
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

  // LINE 登入 / 信箱驗證 / 密碼重設回流：用網址帶回的一次性 token_hash 換 session 並套用登入狀態。
  async function verifyOtp(tokenHash: string, type: EmailOtpType): Promise<AuthSession> {
    const applied = applySession(await verifyOtpService(tokenHash, type));
    // 驗證成功才標記 recovery：這是 reset-password 表單的唯一開門條件。
    if (type === 'recovery') {
      isPasswordRecovery.value = true;
    }
    return applied;
  }

  // 重寄信箱驗證信（純動作、不改登入狀態）。
  async function resendSignup(email: string): Promise<void> {
    await resendSignupService(email);
  }

  // 忘記密碼：寄重設連結，回流到 /auth/callback（帶 type=recovery，比照 Google 組 redirectTo）。
  async function requestPasswordReset(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
    await requestPasswordResetService(email, redirectTo);
  }

  // 重設密碼：recovery session 已建立後更新密碼，成功即消掉 recovery 憑據（用完即焚）。
  async function updatePassword(newPassword: string): Promise<void> {
    await updatePasswordService(newPassword);
    isPasswordRecovery.value = false;
  }

  return {
    user,
    session,
    isAuthenticated,
    isAdmin,
    isPasswordRecovery,
    register,
    login,
    hydrate,
    logout,
    signInWithGoogle,
    verifyOtp,
    resendSignup,
    requestPasswordReset,
    updatePassword
  };
});
