import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn().mockResolvedValue({ error: null })
};
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

  it('signOut reject 時 logout() 仍清本機 session（finally clear）', async () => {
    auth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    auth.signOut.mockRejectedValueOnce(new Error('network error'));
    const store = useAuthStore();
    await store.hydrate();

    // logout() 會 reject（reject 從 finally 後往上傳遞，呼叫端如 AppHeader 已有 try/catch 接住）
    await expect(store.logout()).rejects.toThrow('network error');
    // 但本機 session 一律被清除：登出觀感應一律成功
    expect(store.isAuthenticated).toBe(false);
  });

  it('verifyOtp type=recovery 成功才標記 isPasswordRecovery', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();

    await store.verifyOtp('token', 'recovery');

    expect(store.isPasswordRecovery).toBe(true);
  });

  it('verifyOtp 非 recovery 型別不會開 recovery 憑據', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();

    await store.verifyOtp('token', 'magiclink');

    expect(store.isPasswordRecovery).toBe(false);
  });

  it('updatePassword 成功後清掉 recovery 憑據（用完即焚）', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();
    await store.verifyOtp('token', 'recovery');

    await store.updatePassword('new-password-123');

    expect(store.isPasswordRecovery).toBe(false);
  });

  it('logout 也會清掉 recovery 憑據', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    const store = useAuthStore();
    await store.verifyOtp('token', 'recovery');

    await store.logout();

    expect(store.isPasswordRecovery).toBe(false);
  });
});
