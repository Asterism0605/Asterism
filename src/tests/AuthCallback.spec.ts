import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import AuthCallback from '@/pages/AuthCallback.vue';

const store = {
  hydrate: vi.fn().mockResolvedValue(undefined),
  verifyOtp: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: false
};
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => store }));

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div/>' } },
      { path: '/login', name: 'login', component: { template: '<div/>' } },
      { path: '/discover-dna', name: 'discover-dna', component: { template: '<div/>' } },
      { path: '/auth/callback', name: 'auth-callback', component: AuthCallback }
    ]
  });
}

describe('AuthCallback', () => {
  beforeEach(() => {
    store.hydrate = vi.fn().mockResolvedValue(undefined);
    store.verifyOtp = vi.fn().mockResolvedValue(undefined);
    store.isAuthenticated = false;
  });

  it('還原後已登入 → replace 到 next', async () => {
    store.isAuthenticated = true;
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    router.push('/auth/callback?next=/discover-dna');
    await router.isReady();

    mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(replace).toHaveBeenCalledWith('/discover-dna');
  });

  it('無 session → 顯示失敗態、不導向', async () => {
    store.isAuthenticated = false;
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    router.push('/auth/callback');
    await router.isReady();

    const wrapper = mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(replace).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Sign-in failed');
  });

  it('token_hash → verifyOtp 換 session 後導向 next（不呼叫 hydrate）', async () => {
    store.verifyOtp = vi.fn(async () => {
      store.isAuthenticated = true;
    });
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    router.push('/auth/callback?token_hash=abc&type=magiclink&next=/discover-dna');
    await router.isReady();

    mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(store.verifyOtp).toHaveBeenCalledWith('abc', 'magiclink');
    expect(store.hydrate).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/discover-dna');
  });

  it('token_hash 無 type → 預設 magiclink', async () => {
    store.verifyOtp = vi.fn(async () => {
      store.isAuthenticated = true;
    });
    const router = makeRouter();
    router.push('/auth/callback?token_hash=abc');
    await router.isReady();

    mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(store.verifyOtp).toHaveBeenCalledWith('abc', 'magiclink');
  });

  it('verifyOtp 失敗 → 失敗態、不導向', async () => {
    store.verifyOtp = vi.fn().mockRejectedValue(new Error('bad otp'));
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    router.push('/auth/callback?token_hash=bad&type=magiclink');
    await router.isReady();

    const wrapper = mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(replace).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Sign-in failed');
  });

  it('OAuth 回傳 error → 直接失敗態、不嘗試 hydrate', async () => {
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    router.push('/auth/callback?error=access_denied');
    await router.isReady();

    const wrapper = mount(AuthCallback, { global: { plugins: [router] } });
    await flushPromises();

    expect(store.hydrate).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Sign-in failed');
  });
});
