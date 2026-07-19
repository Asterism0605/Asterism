import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import Login from '@/pages/Login.vue';

const supaAuth = { signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn() };
const single = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
const reconcileWithServer = vi.fn().mockResolvedValue(undefined);
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth: supaAuth, from }) }));
vi.mock('@/stores/style-dna.store', () => ({
  useStyleDnaStore: () => ({ reconcileWithServer })
}));

const fakeSession = {
  access_token: 'tok',
  expires_at: 1000,
  user: { id: 'u1', email: 'new-user@example.com', created_at: '2026-01-01T00:00:00Z' }
};

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } },
      { path: '/forgot-password', name: 'forgot-password', component: { template: '<div />' } }
    ]
  });
}

function mountLogin(router: Router) {
  return mount(Login, {
    global: {
      plugins: [router, createPinia()],
      stubs: { ConstellationBackground: true, AppHeader: true }
    }
  });
}

async function flushAuth(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await flushPromises();
}

async function fillForm(
  wrapper: ReturnType<typeof mountLogin>,
  email: string,
  password: string
): Promise<void> {
  await wrapper.find('input[type="email"]').setValue(email);
  await wrapper.find('input[type="password"]').setValue(password);
}

describe('Login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    reconcileWithServer.mockReset();
    reconcileWithServer.mockResolvedValue(undefined);
    single.mockResolvedValue({ data: { display_name: 'New User', username: null, is_admin: false }, error: null });
    supaAuth.signUp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    supaAuth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });
  });

  it('logs in and redirects to home on success', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountLogin(router);
    await fillForm(wrapper, 'member@example.com', 'password123');
    await wrapper.find('form').trigger('submit');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/');
    expect(reconcileWithServer).toHaveBeenCalledWith('u1');
  });

  it('routes new users to sign-up with the safe next path', async () => {
    const router = createTestRouter();
    router.push('/login?next=/images/image-1');
    await router.isReady();
    const push = vi.spyOn(router, 'push');
    const wrapper = mountLogin(router);

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Sign up'))!
      .trigger('click');

    expect(push).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { next: '/images/image-1' }
    });
  });

  it('still redirects when Style DNA reconcile fails after login', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');
    reconcileWithServer.mockRejectedValueOnce(new Error('network down'));

    const wrapper = mountLogin(router);
    await fillForm(wrapper, 'member@example.com', 'password123');
    await wrapper.find('form').trigger('submit');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/');
  });

  it('shows an error and does not redirect when login fails', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountLogin(router);
    supaAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });
    await fillForm(wrapper, 'member@example.com', 'short');
    await wrapper.find('form').trigger('submit');
    await flushAuth();

    expect(wrapper.find('[data-testid="auth-error"]').exists()).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it('disables the submit button while submitting', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();

    const wrapper = mountLogin(router);
    await fillForm(wrapper, 'member@example.com', 'password123');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('[data-testid="auth-submit"]').attributes('disabled')).toBeDefined();

    await flushAuth();
  });
});
