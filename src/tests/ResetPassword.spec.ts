import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import ResetPassword from '@/pages/ResetPassword.vue';

const store = {
  updatePassword: vi.fn().mockResolvedValue(undefined),
  isPasswordRecovery: false
};
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => store }));

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div/>' } },
      { path: '/forgot-password', name: 'forgot-password', component: { template: '<div/>' } },
      { path: '/reset-password', name: 'reset-password', component: ResetPassword }
    ]
  });
}

async function mountPage(router: Router) {
  router.push('/reset-password');
  await router.isReady();
  return mount(ResetPassword, {
    global: { plugins: [router], stubs: { ConstellationBackground: true } }
  });
}

describe('ResetPassword', () => {
  beforeEach(() => {
    store.updatePassword = vi.fn().mockResolvedValue(undefined);
    store.isPasswordRecovery = false;
  });

  it('沒有 recovery 憑據 → 顯示連結失效、不出現表單', async () => {
    const wrapper = await mountPage(makeRouter());

    expect(wrapper.text()).toContain('Link expired');
    expect(wrapper.find('input[type="password"]').exists()).toBe(false);
  });

  it('有 recovery 憑據 → 顯示表單', async () => {
    store.isPasswordRecovery = true;
    const wrapper = await mountPage(makeRouter());

    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('送出新密碼成功 → 呼叫 updatePassword 並 replace 回首頁', async () => {
    store.isPasswordRecovery = true;
    const router = makeRouter();
    const replace = vi.spyOn(router, 'replace');
    const wrapper = await mountPage(router);

    await wrapper.find('input[type="password"]').setValue('new-password-123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(store.updatePassword).toHaveBeenCalledWith('new-password-123');
    expect(replace).toHaveBeenCalledWith('/');
  });
});
