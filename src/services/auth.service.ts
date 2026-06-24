import { currentSessionApi, loginApi, logoutApi, registerApi } from '@/api/auth.api';
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth';

// Service layer 負責解開 API response，
// 讓 store / page 使用 domain data，而不是處理 ApiResponse metadata 等傳輸層細節。
export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const response = await registerApi(payload);

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
