import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import router from '@/router';
import AppHeader from '@/layouts/AppHeader.vue';

describe('AppHeader', () => {
  it('uses the picture detail width instead of covering the meta panel', async () => {
    await router.push('/images/y2k-main-001');
    await router.isReady();

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    });

    await flushPromises();

    const headerClasses = wrapper.find('header').classes();

    expect(headerClasses).toContain('md:w-3/5');
    expect(headerClasses).not.toContain('w-full');
  });
});
