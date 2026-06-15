import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { login, register } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

describe('auth service and store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('registers a mock user and unwraps the auth session from ApiResponse', async () => {
    const session = await register({
      email: 'new-user@example.com',
      password: 'password123',
      displayName: 'New User'
    });

    expect(session.user).toEqual(
      expect.objectContaining({
        email: 'new-user@example.com',
        displayName: 'New User'
      })
    );
    expect(session.accessToken).toEqual(expect.stringContaining('mock_access_token_'));
    expect(session.expiresAt).toEqual(expect.any(String));
  });

  it('logs in a mock user and keeps form input outside the auth store', async () => {
    const store = useAuthStore();

    await store.login({
      email: 'member@example.com',
      password: 'password123'
    });

    expect(store.user?.email).toBe('member@example.com');
    expect(store.session?.accessToken).toEqual(expect.stringContaining('mock_access_token_'));
    expect(store.isAuthenticated).toBe(true);
    expect('password' in store).toBe(false);
  });

  it('clears user and session state on logout', async () => {
    const store = useAuthStore();

    await store.register({
      email: 'leaving@example.com',
      password: 'password123'
    });
    store.logout();

    expect(store.user).toBeNull();
    expect(store.session).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('exposes login service for non-store callers', async () => {
    await expect(
      login({
        email: 'direct@example.com',
        password: 'password123'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'direct@example.com' })
      })
    );
  });
});
