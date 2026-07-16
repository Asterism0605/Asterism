import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '@/router';
import AppHeader from '@/layouts/AppHeader.vue';
import UserMenu from '@/layouts/UserMenu.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { AuthSession } from '@/types/auth';
import type { StyleDnaAnswer } from '@/types/style-dna';

const supaAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
};
const single = vi.fn().mockResolvedValue({ data: null, error: null });
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth: supaAuth, from }) }));

function createAuthenticatedSession(displayName = 'Ada Lovelace'): AuthSession {
  return {
    accessToken: 'test-token',
    expiresAt: '2099-01-01T00:00:00.000Z',
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      displayName,
      isAdmin: false,
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
    setActivePinia(createPinia());
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

    await wrapper.findComponent(UserMenu).find('[aria-haspopup="true"]').trigger('click');

    expect(wrapper.text()).toContain('Signed in as');
    expect(wrapper.text()).toContain('Moodboard');
    expect(wrapper.text()).toContain('Consultation');
    expect(wrapper.text()).toContain('Log out');

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === 'Log out');

    expect(logoutButton).toBeTruthy();

    await logoutButton?.trigger('click');
    await flushPromises();

    expect(authStore.isAuthenticated).toBe(false);
    expect(wrapper.text()).toContain('Log in');
  });
});

describe('AppHeader Style DNA 導向', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await router.push('/');
    await router.isReady();
  });

  function authenticateAndOpenMenu(wrapper: ReturnType<typeof createMountedHeader>['wrapper']) {
    const authStore = useAuthStore();
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    return wrapper.vm.$nextTick();
  }

  it('沒測驗結果 → 導向 /discover-dna', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('styleDna');

    expect(push).toHaveBeenCalledWith('/discover-dna');
  });

  it('有測驗結果 → 導向 /style-dna/result', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const styleDnaStore = useStyleDnaStore();
    const answer: StyleDnaAnswer = {
      questionId: 'q1',
      selectedOptionId: 'o1',
      selectedImage: { id: 'img-1', url: 'test.jpg', style: [] },
      weights: {}
    };
    styleDnaStore.completeQuiz([answer], null);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('styleDna');

    expect(push).toHaveBeenCalledWith('/style-dna/result');
  });

  it('我的預約 → 導向 /account/consultations', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('consultations');

    expect(push).toHaveBeenCalledWith({ name: 'account-consultations' });
  });
});
