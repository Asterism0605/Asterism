import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn()
};
const single = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));

vi.mock('@/api/supabaseClient', () => ({
  getSupabase: () => ({ auth, from })
}));

import { loginApi, registerApi } from '@/api/auth.api';

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
});
