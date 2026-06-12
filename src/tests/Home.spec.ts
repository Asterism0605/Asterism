import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Home from '@/pages/Home.vue';

const floatingImageNetworkStub = {
  template: '<div data-test="floating-image-network" />'
};

describe('Home', () => {
  it('uses the shared app header and renders the hero section', () => {
    const wrapper = mount(Home, {
      global: {
        stubs: {
          FloatingImageNetwork: floatingImageNetworkStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    expect(wrapper.find('main.home-page').exists()).toBe(true);
    expect(wrapper.text()).toContain('Asterism');
  });

  it('opens the limit modal when viewport bottom reaches 150vh', async () => {
    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        stubs: {
          FloatingImageNetwork: floatingImageNetworkStub,
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
      value: 501
    });

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Your daily inspiration limit has been reached.');

    wrapper.unmount();
  });
});
