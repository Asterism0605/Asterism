import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  signInWithOAuth: vi.fn(),
  resend: vi.fn()
};
const single = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));

vi.mock('@/api/supabaseClient', () => ({
  getSupabase: () => ({ auth, from })
}));

import { loginApi, logoutApi, registerApi, resendSignupApi, signInWithGoogleApi } from '@/api/auth.api';

const fakeSession = {
  access_token: 'tok',
  expires_at: 1000,
  user: { id: 'u1', email: 'a@b.com', created_at: '2026-01-01T00:00:00Z' }
};

describe('auth.api (supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { display_name: 'Alice', username: 'alice', is_admin: true }, error: null });
  });

  it('login 回傳帶 isAdmin 的 session', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const res = await loginApi({ email: 'a@b.com', password: 'password123' });

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
    expect(res.data.user.isAdmin).toBe(true);
    expect(res.data.user.displayName).toBe('Alice');
    expect(res.data.accessToken).toBe('tok');
  });

  it('login 帳密錯 → 丟 INVALID_CREDENTIALS', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });

    await expect(loginApi({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('register 帶 display_name metadata；查無 profile → isAdmin=false', async () => {
    auth.signUp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    single.mockResolvedValue({ data: null, error: null });

    const res = await registerApi({ email: 'a@b.com', password: 'password123', displayName: 'Al' });

    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
      options: { data: { display_name: 'Al' } }
    });
    expect(res.data.user.isAdmin).toBe(false);
  });

  it('register 成功但無 session（已開信箱驗證）→ 丟 EMAIL_CONFIRMATION_REQUIRED', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null });

    await expect(
      registerApi({ email: 'a@b.com', password: 'password123', displayName: 'Al' })
    ).rejects.toMatchObject({ code: 'EMAIL_CONFIRMATION_REQUIRED' });
  });

  it('logout 遠端 signOut 失敗 → 丟出對應錯誤', async () => {
    auth.signOut.mockResolvedValue({ error: { message: 'network down' } });

    await expect(logoutApi()).rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });

  it('resendSignup 以 type=signup + email 呼叫 resend', async () => {
    auth.resend.mockResolvedValue({ error: null });

    await resendSignupApi('a@b.com');

    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'a@b.com' });
  });

  it('resendSignup 失敗 → 丟出對應錯誤', async () => {
    auth.resend.mockResolvedValue({ error: { message: 'network down' } });

    await expect(resendSignupApi('a@b.com')).rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });

  it('session 缺 expires_at → expiresAt 退回未來時間（非 1970）', async () => {
    const noExpiry = { ...fakeSession, expires_at: undefined };
    auth.signInWithPassword.mockResolvedValue({ data: { session: noExpiry }, error: null });
    single.mockResolvedValue({ data: null, error: null });

    const res = await loginApi({ email: 'a@b.com', password: 'password123' });

    expect(new Date(res.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('fetchProfile 非 PGRST116 錯誤 → login 仍成功且 isAdmin=false（fail-closed 降級）', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });
    single.mockResolvedValue({ data: null, error: { code: 'XYZ', message: 'unexpected db error' } });

    const res = await loginApi({ email: 'a@b.com', password: 'password123' });

    expect(res.data.user.isAdmin).toBe(false);
    expect(res.data.accessToken).toBe('tok');
  });
});

describe('signInWithGoogleApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('以 provider google + redirectTo 呼叫 signInWithOAuth', async () => {
    auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await signInWithGoogleApi('https://x/auth/callback?next=%2Ffoo');

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://x/auth/callback?next=%2Ffoo' }
    });
  });

  it('signInWithOAuth 出錯 → throw', async () => {
    auth.signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'boom' } });

    await expect(signInWithGoogleApi('r')).rejects.toBeTruthy();
  });
});
