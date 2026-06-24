import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getCurrentSession,
  login as loginService,
  logout as logoutService,
  register as registerService
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

  return { user, session, isAuthenticated, isAdmin, register, login, hydrate, logout };
});
