import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import Home from '@/pages/Home.vue';
import type { HomeInspirationImage } from '@/types/image';
import rawStyleImages from '@/data/style-data.json';
import type { StyleImage } from '@/types/image';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));

const floatingImageNetworkStub = {
  props: ['images'],
  template: '<button data-test="floating-image-network" @click="$emit(\'click\', 0)" />'
};

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      {
        path: '/images/:imageId/spread',
        name: 'image-spread',
        component: { template: '<div />' }
      },
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } }
    ]
  });
}

async function openLimitModal(wrapper: { vm: { $nextTick: () => Promise<void> } }) {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 501 });
  window.dispatchEvent(new Event('scroll'));
  await wrapper.vm.$nextTick();
}

describe('Home', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the shared app header and renders the hero section', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      global: {
        plugins: [router],
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

  it('routes clicked inspiration images to the image spread page', async () => {
    const router = createTestRouter();
    const push = vi.spyOn(router, 'push');
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: floatingImageNetworkStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await flushPromises();
    await wrapper.find('[data-test="floating-image-network"]').trigger('click');

    expect(push).toHaveBeenCalledWith({
      name: 'image-spread',
      params: { imageId: expect.any(String) }
    });
  });

  it('passes grouped home inspiration entry points to the floating network', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: floatingImageNetworkStub,
          Teleport: true,
          Transition: false
        }
      }
    });
    await flushPromises();
    const floatingNetwork = wrapper.findComponent(floatingImageNetworkStub);
    const images = floatingNetwork.props('images') as HomeInspirationImage[];

    expect(images).toHaveLength(5);
    expect(new Set(images.slice(0, 3).map((image) => image.styleGroup))).toEqual(
      new Set([
        'Y2K & Internet Aesthetics',
        'Future Tech & Digital Psychedelia',
        'Decorative & Opulent Art'
      ])
    );
  });

  it('opens the limit modal when viewport bottom reaches 150vh', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        plugins: [router],
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

  it('routes the create-account CTA to sign-up with the discover-dna next query', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: floatingImageNetworkStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await openLimitModal(wrapper);
    await wrapper.find('[data-testid="cta-create-account"]').trigger('click');

    expect(push).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { next: '/discover-dna' }
    });

    wrapper.unmount();
  });
});
