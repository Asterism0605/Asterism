import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import Login from '@/pages/Login.vue';

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } }
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
  });

  it('logs in and redirects to home on success', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountLogin(router);
    await fillForm(wrapper, 'member@example.com', 'password123');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
    await flushAuth();

    expect(push).toHaveBeenCalledWith('/');
  });

  it('shows an error and does not redirect when login fails', async () => {
    const router = createTestRouter();
    router.push('/login');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mountLogin(router);
    await fillForm(wrapper, 'member@example.com', 'short');
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');
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
    await wrapper.find('[data-testid="auth-submit"]').trigger('click');

    expect(wrapper.find('[data-testid="auth-submit"]').attributes('disabled')).toBeDefined();

    await flushAuth();
  });
});
