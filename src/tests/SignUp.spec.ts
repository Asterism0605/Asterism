import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import SignUp from '@/pages/SignUp.vue';

const supaAuth = { signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn() };
const single = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth: supaAuth, from }) }));

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
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/discover-dna', name: 'discover-dna', component: { template: '<div />' } }
    ]
  });
}

function mountSignUp(router: Router) {
  return mount(SignUp, {
    global: {
      plugins: [router, createPinia()],
      stubs: { ConstellationBackground: true, AppHeader: true }
    }
  });
}

// mock auth API resolves on a setTimeout(0) macrotask; let it run, then drain microtasks.
async function flushAuth(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await flushPromises();
}

async function fillForm(
  wrapper: ReturnType<typeof mountSignUp>,
  email: string,
  password: string
): Promise<void> {
  await wrapper.find('input[type="email"]').setValue(email);
  await wrapper.find('input[type="password"]').setValue(password);
}

describe('SignUp', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    single.mockResolvedValue({ data: { display_name: 'New User', username: null, is_admin: false }, error: null });
    supaAuth.signUp.mockResolvedValue({ data: { session: fakeSession }, error: null });
    supaAuth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null });
  });

  it('registers and redirects to a safe next path on success', async () => {
    const router = createTestRouter();
    router.push('/sign-up?next=/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountSignUp(router);
    await fillForm(wrapper, 'new-user@example.com', 'password123');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/login');
  });

  it('redirects to /discover-dna when next is missing', async () => {
    const router = createTestRouter();
    router.push('/sign-up');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountSignUp(router);
    await fillForm(wrapper, 'new-user@example.com', 'password123');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/discover-dna');
  });

  it('ignores an external next and falls back to /discover-dna', async () => {
    const router = createTestRouter();
    router.push('/sign-up?next=http://evil.com');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountSignUp(router);
    await fillForm(wrapper, 'new-user@example.com', 'password123');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/discover-dna');
  });

  it('shows an error and does not redirect when registration fails', async () => {
    const router = createTestRouter();
    router.push('/sign-up');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountSignUp(router);
    supaAuth.signUp.mockResolvedValue({ data: { session: null }, error: { message: 'Password should be at least 6 characters' } });
    await fillForm(wrapper, 'new-user@example.com', 'short');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
    await flushAuth();

    expect(wrapper.find('[data-testid="auth-error"]').exists()).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it('disables the submit button while submitting', async () => {
    const router = createTestRouter();
    router.push('/sign-up');
    await router.isReady();

    const wrapper = mountSignUp(router);
    await fillForm(wrapper, 'new-user@example.com', 'password123');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');

    expect(wrapper.find('[data-testid="auth-submit"]').attributes('disabled')).toBeDefined();

    await flushAuth();
  });
});
