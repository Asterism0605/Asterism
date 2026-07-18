import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn() };
const single = vi.fn();
const maybeSingle = vi.fn();
const from = vi.fn((table: string) =>
  table === 'consultants'
    ? { select: () => ({ eq: () => ({ maybeSingle }) }) }
    : { select: () => ({ eq: () => ({ single }) }) }
);
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth, from }) }));

import { register } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const fakeSession = {
  access_token: 'tok',
  expires_at: 1000,
  user: { id: 'u1', email: 'new-user@example.com', created_at: '2026-01-01T00:00:00Z' }
};

describe('auth service and store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { display_name: 'New User', username: null, is_admin: false }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('register 解開 ApiResponse 的 session', async () => {
    auth.signUp.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const session = await register({ email: 'new-user@example.com', password: 'password123', displayName: 'New User' });

    expect(session.user).toEqual(expect.objectContaining({ email: 'new-user@example.com', displayName: 'New User', isAdmin: false }));
    expect(session.accessToken).toBe('tok');
  });

  it('login 後 store.isAuthenticated 為 true', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();

    await store.login({ email: 'new-user@example.com', password: 'password123' });

    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.email).toBe('new-user@example.com');
  });
});
