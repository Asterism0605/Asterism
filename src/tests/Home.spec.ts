import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Home from '@/pages/Home.vue';

describe('Home', () => {
  it('uses the shared app header and page container', () => {
    const wrapper = mount(Home, {
      global: {
        stubs: {
          Teleport: true,
          Transition: false
        }
      }
    });

    expect(wrapper.find('header').exists()).toBe(true);
    expect(wrapper.find('.max-w-7xl.mx-auto').exists()).toBe(true);
  });

  it('opens the limit modal when viewport bottom reaches 120vh', async () => {
    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        stubs: {
          Teleport: true,
          Transition: false
        }
      }
    });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 201
    });

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Your daily inspiration limit has been reached.');

    wrapper.unmount();
  });
});
