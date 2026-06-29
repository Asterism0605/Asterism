import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue';

const store = { signInWithGoogle: vi.fn() };
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => store }));

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/login', name: 'login', component: { template: '<div/>' } }]
  });
}

async function mountButton(query = '') {
  const router = makeRouter();
  router.push(`/login${query}`);
  await router.isReady();
  return mount(GoogleSignInButton, { global: { plugins: [router] } });
}

describe('GoogleSignInButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('以消毒過的 next 觸發 signInWithGoogle', async () => {
    store.signInWithGoogle.mockResolvedValue(undefined);
    const wrapper = await mountButton('?next=//evil.com');

    await wrapper.get('[data-testid="google-signin"]').trigger('click');
    await flushPromises();

    expect(store.signInWithGoogle).toHaveBeenCalledWith('/');
    expect(wrapper.text()).not.toContain('Google sign-in failed');
  });

  it('啟動失敗 → 顯示錯誤提示', async () => {
    store.signInWithGoogle.mockRejectedValue(new Error('boom'));
    const wrapper = await mountButton();

    await wrapper.get('[data-testid="google-signin"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Google sign-in failed');
  });
});
