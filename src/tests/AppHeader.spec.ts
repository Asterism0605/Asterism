import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import router from '@/router';
import AppHeader from '@/layouts/AppHeader.vue';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';

function createAuthenticatedSession(displayName = 'Ada Lovelace'): AuthSession {
  return {
    accessToken: 'test-token',
    expiresAt: '2099-01-01T00:00:00.000Z',
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      displayName,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  };
}

function createMountedHeader() {
  const pinia = createPinia();
  setActivePinia(pinia);

  return {
    pinia,
    wrapper: mount(AppHeader, {
      global: {
        plugins: [router, pinia]
      }
    })
  };
}

describe('AppHeader', () => {
  beforeEach(async () => {
    await router.push('/');
    await router.isReady();
  });

  it('uses the picture detail width instead of covering the meta panel', async () => {
    await router.push('/images/y2k-main-001');
    await router.isReady();

    const { wrapper } = createMountedHeader();

    const headerClasses = wrapper.find('header').classes();

    expect(headerClasses).toContain('md:w-3/5');
    expect(headerClasses).not.toContain('w-full');
  });

  it('shows login actions when the user is not authenticated', () => {
    const { wrapper } = createMountedHeader();

    expect(wrapper.text()).toContain('Log in');
    expect(wrapper.text()).toContain('Sign Up');
    expect(wrapper.text()).not.toContain('Signed in as');
  });

  it('shows the authenticated menu and logs out through the auth store', async () => {
    const { wrapper } = createMountedHeader();
    const authStore = useAuthStore();
    const session = createAuthenticatedSession();

    authStore.session = session;
    authStore.user = session.user;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).not.toContain('Sign Up');

    await wrapper.find('[aria-haspopup="true"]').trigger('click');

    expect(wrapper.text()).toContain('Signed in as');
    expect(wrapper.text()).toContain('Moodboard');
    expect(wrapper.text()).toContain('Log out');

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === 'Log out');

    expect(logoutButton).toBeTruthy();

    await logoutButton?.trigger('click');

    expect(authStore.isAuthenticated).toBe(false);
    expect(wrapper.text()).toContain('Log in');
  });
});
