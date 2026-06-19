import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { Component } from 'vue';
import { afterEach, describe, it, vi, expect } from 'vitest';
import router from '@/router';

vi.mock('@/layouts/AppHeader.vue', () => ({ default: { template: '<header />' } }));
vi.mock('@/layouts/PageContainer.vue', () => ({ default: { template: '<main><slot /></main>' } }));
vi.mock('@/components/sections/TokenShowcase.vue', () => ({
  default: { template: '<section />' }
}));
vi.mock('@/components/sections/FloatingImageNetwork', () => ({
  default: { template: '<section />' }
}));
vi.mock('@/components/ui/ColorPaletteSwatch.vue', () => ({ default: { template: '<section />' } }));
vi.mock('@/components/ui/AppToast.vue', () => ({
  default: { template: '<section data-testid="app-toast" />' }
}));
vi.mock('@/pages/Playground.vue', () => ({ default: { template: '<section />' } }));
vi.mock('@/components/overlay/SignUpOverlay.vue', () => ({ default: { template: '<aside />' } }));
vi.mock('@/components/overlay/LoginOverlay.vue', () => ({ default: { template: '<aside />' } }));

describe('App', () => {
  afterEach(async () => {
    await router.push('/');
  });

  function mountApp(App: Component) {
    const pinia = createPinia();
    setActivePinia(pinia);

    return mount(App, {
      global: {
        plugins: [pinia, router]
      }
    });
  }

  it('does not render the global header on the discover dna entry page', async () => {
    const { default: App } = await import('@/App.vue');

    await router.push('/discover-dna');
    await router.isReady();

    const wrapper = mountApp(App);

    expect(wrapper.find('header').exists()).toBe(false);
  });

  it('renders StyleDnaResult on the style dna result path', async () => {
    const { default: App } = await import('@/App.vue');

    await router.push('/style-dna/result');
    await router.isReady();

    mountApp(App);
  });

  it('renders the global toast outlet', async () => {
    const { default: App } = await import('@/App.vue');

    await router.push('/');
    await router.isReady();

    const wrapper = mountApp(App);

    expect(wrapper.find('[data-testid="app-toast"]').exists()).toBe(true);
  });
});
