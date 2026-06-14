import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { login as loginService, register as registerService } from '@/services/auth.service';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

// 只管理全域 auth 狀態。
// email / password 這類表單輸入值應保留在頁面 local state。
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null);
  const session = ref<AuthSession | null>(null);
  const isAuthenticated = computed(() => session.value !== null && user.value !== null);

  function applySession(nextSession: AuthSession): AuthSession {
    session.value = nextSession;
    user.value = nextSession.user;

    return nextSession;
  }

  async function register(payload: RegisterPayload): Promise<AuthSession> {
    const nextSession = await registerService(payload);

    return applySession(nextSession);
  }

  async function login(payload: LoginPayload): Promise<AuthSession> {
    const nextSession = await loginService(payload);

    return applySession(nextSession);
  }

  function logout(): void {
    user.value = null;
    session.value = null;
  }

  return {
    user,
    session,
    isAuthenticated,
    register,
    login,
    logout
  };
});
