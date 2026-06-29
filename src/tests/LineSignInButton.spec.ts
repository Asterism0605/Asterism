import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import LineSignInButton from '@/components/auth/LineSignInButton.vue';

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
  return mount(LineSignInButton, { global: { plugins: [router] } });
}

describe('LineSignInButton', () => {
  const originalLocation = window.location;
  let loc: { href: string };

  beforeEach(() => {
    loc = { href: '' };
    Object.defineProperty(window, 'location', { value: loc, writable: true, configurable: true });
    vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co');
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
    vi.unstubAllEnvs();
  });

  it('導去 Edge start endpoint；不安全的 next 被消毒掉（不掛 query）', async () => {
    const wrapper = await mountButton('?next=//evil.com');
    await wrapper.get('[data-testid="line-signin"]').trigger('click');
    expect(loc.href).toBe('https://proj.supabase.co/functions/v1/line-callback');
  });

  it('合法 next 帶入 query', async () => {
    const wrapper = await mountButton('?next=/discover-dna');
    await wrapper.get('[data-testid="line-signin"]').trigger('click');
    expect(loc.href).toBe(
      'https://proj.supabase.co/functions/v1/line-callback?next=%2Fdiscover-dna'
    );
  });

  it('VITE_SUPABASE_URL 未設 → 顯示錯誤、不導向', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const wrapper = await mountButton();
    await wrapper.get('[data-testid="line-signin"]').trigger('click');
    expect(loc.href).toBe('');
    expect(wrapper.text()).toContain('LINE sign-in failed');
  });
});
