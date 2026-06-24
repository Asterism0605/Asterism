import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { signOut: vi.fn().mockResolvedValue({ error: null }), getSession: vi.fn() };
const single = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth, from }) }));

import { useAuthStore } from '@/stores/auth.store';

const fakeSession = {
  access_token: 'tok',
  expires_at: 1000,
  user: { id: 'u1', email: 'admin@b.com', created_at: '2026-01-01T00:00:00Z' }
};

describe('auth.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { display_name: 'Admin', username: null, is_admin: true }, error: null });
  });

  it('hydrate 從現有 session 還原並帶 isAdmin', async () => {
    auth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();

    await store.hydrate();

    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(true);
  });

  it('沒有 session 時 hydrate 不登入', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const store = useAuthStore();

    await store.hydrate();

    expect(store.isAuthenticated).toBe(false);
    expect(store.isAdmin).toBe(false);
  });

  it('logout 清狀態並呼叫 signOut', async () => {
    auth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();
    await store.hydrate();

    await store.logout();

    expect(auth.signOut).toHaveBeenCalled();
    expect(store.isAuthenticated).toBe(false);
  });

  it('signOut reject 時 logout() 向上拋出例外，state 維持登入（現況：clear 不執行）', async () => {
    auth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    auth.signOut.mockRejectedValueOnce(new Error('network error'));
    const store = useAuthStore();
    await store.hydrate();

    // store.logout() 會 reject，呼叫端應自行 catch（如 AppHeader handleLogout）
    await expect(store.logout()).rejects.toThrow('network error');
    // 現況：signOut 失敗時 clear() 未執行，session 仍保留（設計待議）
    expect(store.isAuthenticated).toBe(true);
  });
});
