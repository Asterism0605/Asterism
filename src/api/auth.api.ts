import { createMockError, createMockSuccess, withMockDelay } from '@/api/mockAdapter';
import type { ApiResponse } from '@/types/api';
import type { AuthSession, LoginPayload, RegisterPayload, UserProfile } from '@/types/auth';

// 用於初始引導流程（onboarding）的模擬身分驗證 API 契約。
// 當後端的身分驗證端點（endpoints）準備就緒時，請將 mockAdapter 替換為 httpClient 呼叫；
// 並保持服務層（service）與狀態管理（store）等呼叫端的穩定（無需修改）。
const MOCK_AUTH_DELAY_MS = 0;
const MOCK_SESSION_HOURS = 2;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUserId(email: string): string {
  return `mock_user_${email.replace(/[^a-z0-9]/g, '_')}`;
}

function createDisplayName(email: string, displayName?: string): string {
  const normalizedName = displayName?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  return email.split('@')[0] || 'Asterism User';
}

function createMockSession(payload: RegisterPayload | LoginPayload): AuthSession {
  const email = normalizeEmail(payload.email);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MOCK_SESSION_HOURS * 60 * 60 * 1000);
  const user: UserProfile = {
    id: createUserId(email),
    email,
    displayName: createDisplayName(
      email,
      'displayName' in payload ? payload.displayName : undefined
    ),
    createdAt: now.toISOString()
  };

  return {
    user,
    accessToken: `mock_access_token_${user.id}`,
    expiresAt: expiresAt.toISOString()
  };
}

function validateAuthPayload(payload: RegisterPayload | LoginPayload): void {
  if (!normalizeEmail(payload.email).includes('@')) {
    throw createMockError({
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
      status: 400,
      details: { field: 'email' }
    });
  }

  if (payload.password.length < 8) {
    throw createMockError({
      code: 'INVALID_PASSWORD',
      message: 'Password must be at least 8 characters.',
      status: 400,
      details: { field: 'password' }
    });
  }
}

export async function registerApi(
  payload: RegisterPayload
): Promise<ApiResponse<AuthSession>> {
  validateAuthPayload(payload);

  return withMockDelay(createMockSuccess(createMockSession(payload)), MOCK_AUTH_DELAY_MS);
}

export async function loginApi(payload: LoginPayload): Promise<ApiResponse<AuthSession>> {
  validateAuthPayload(payload);

  return withMockDelay(createMockSuccess(createMockSession(payload)), MOCK_AUTH_DELAY_MS);
}
