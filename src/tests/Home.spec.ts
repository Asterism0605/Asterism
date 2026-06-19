import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import Home from '@/pages/Home.vue';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthSession } from '@/types/auth';
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
  props: ['images', 'height'],
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
    setActivePinia(createPinia());
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

    expect(floatingNetwork.props('height')).toBe('900vh');
    expect(images).toHaveLength(45);
    expect(new Set(images.map((image) => image.styleGroup)).size).toBe(9);
    const perGroup = images.reduce<Record<string, number>>((acc, image) => {
      acc[image.styleGroup] = (acc[image.styleGroup] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.values(perGroup).every((count) => count === 5)).toBe(true);
  });

  it('opens the limit modal for guests when viewport bottom reaches 150vh', async () => {
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

  it('does not open the limit modal for authenticated users when viewport bottom reaches 150vh', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const authStore = useAuthStore();
    const session: AuthSession = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Ada Lovelace',
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    };

    authStore.session = session;
    authStore.user = session.user;

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

    expect(wrapper.text()).not.toContain('Your daily inspiration limit has been reached.');

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
