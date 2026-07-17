import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import Home from '@/pages/Home.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { AuthSession } from '@/types/auth';
import type { HomeInspirationImage } from '@/types/image';
import rawStyleImages from '@/data/style-data.json';
import { HOME_HERO_IMAGE_INDEX } from '@/components/sections/FloatingImageNetwork/config';
import type { StyleImage } from '@/types/image';
import type { StyleDnaAnswer } from '@/types/style-dna';

vi.mock('@/api/image.api', () => ({
  fetchImagesApi: vi.fn(async () => ({
    data: rawStyleImages as StyleImage[],
    meta: { timestamp: new Date().toISOString() }
  }))
}));

const floatingImageNetworkStub = {
  props: ['images', 'height', 'safeCutoffVh', 'safeCutoffOffsetPx'],
  template: '<button data-test="floating-image-network" @click="$emit(\'click\', 0)" />'
};

const guideFloatingImageNetworkStub = {
  props: ['images', 'height', 'guideTargetIndex'],
  emits: ['click', 'ready', 'imagesLoaded', 'guideTargetReady'],
  setup: () => ({ HOME_HERO_IMAGE_INDEX }),
  template: `
    <div>
      <button
        v-for="(_, index) in images"
        :key="index"
        data-test="guide-image-card"
        :data-guide-image-index="index"
        :data-guide-image-ready="index === HOME_HERO_IMAGE_INDEX ? 'true' : undefined"
        :data-guide-target="guideTargetIndex === index ? 'true' : undefined"
        @click="$emit('click', index)"
      />
    </div>
  `
};

const homeImageClickGuideStub = {
  props: ['targetIndex'],
  template: '<div v-if="targetIndex !== null" data-test="home-image-click-guide" />'
};

const homeTourIntroStub = {
  props: ['description', 'startLabel', 'exploreLabel'],
  emits: ['start', 'explore'],
  template: `
    <div data-test="home-tour-intro">
      <button data-test="home-tour-start" @click="$emit('start')">{{ startLabel }}</button>
      <button data-test="home-tour-explore" @click="$emit('explore')">{{ exploreLabel }}</button>
    </div>
  `
};

function mockViewport(initialScrollY = 0, innerHeight = 1000) {
  let currentScrollY = initialScrollY;

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: innerHeight
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => currentScrollY
  });

  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation((options?: ScrollToOptions | number) => {
    if (typeof options === 'number') {
      currentScrollY = options;
      return;
    }

    currentScrollY = options?.top ?? currentScrollY;
  });

  return {
    getScrollY: () => currentScrollY,
    setScrollY: (value: number) => {
      currentScrollY = value;
    },
    scrollTo
  };
}

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
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/privacy', name: 'privacy', component: { template: '<div />' } },
      { path: '/terms', name: 'terms', component: { template: '<div />' } }
    ]
  });
}

async function openLimitModal(wrapper: { vm: { $nextTick: () => Promise<void> } }) {
  window.dispatchEvent(new Event('scroll'));
  await wrapper.vm.$nextTick();
}

function createStyleDnaAnswer(id: string, style: string, weight: number): StyleDnaAnswer {
  return {
    questionId: `question-${id}`,
    selectedOptionId: `option-${id}`,
    selectedImage: {
      id: `image-${id}`,
      url: `/image-${id}.webp`,
      style: [style]
    },
    weights: { [style]: weight }
  };
}

function getMaxConsecutiveStyleGroupCount(styleGroups: string[]): number {
  return styleGroups.reduce(
    (maxCount, styleGroup, index) => {
      const currentCount =
        index > 0 && styleGroup === styleGroups[index - 1] ? maxCount.current + 1 : 1;

      return {
        current: currentCount,
        max: Math.max(maxCount.max, currentCount)
      };
    },
    { current: 0, max: 0 }
  ).max;
}

describe('Home', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    localStorage.clear();
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

  it('renders accessible legal stars with privacy and terms links', async () => {
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

    const privacyStar = wrapper.find('[data-testid="home-privacy-star"]');
    const termsStar = wrapper.find('[data-testid="home-terms-star"]');
    const privacyTooltipLink = wrapper.find('[data-testid="home-privacy-tooltip-link"]');
    const termsTooltipLink = wrapper.find('[data-testid="home-terms-tooltip-link"]');

    expect(privacyStar.attributes('aria-label')).toBe('Privacy Policy');
    expect(privacyStar.attributes('aria-haspopup')).toBe('true');
    expect(privacyTooltipLink.attributes('href')).toBe('/privacy');
    expect(privacyTooltipLink.text()).toContain('Privacy Policy');
    expect(termsStar.attributes('aria-label')).toBe('Terms of Service');
    expect(termsStar.attributes('aria-haspopup')).toBe('true');
    expect(termsTooltipLink.attributes('href')).toBe('/terms');
    expect(termsTooltipLink.text()).toContain('Terms of Service');
  });

  it('routes the legal stars directly to their pages', async () => {
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

    await wrapper.find('[data-testid="home-privacy-star"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('privacy');

    await router.push('/');
    await router.isReady();
    await wrapper.find('[data-testid="home-terms-star"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('terms');

    wrapper.unmount();
  });

  it('opens mobile legal tooltip on star tap and routes from the tooltip text', async () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    });

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

    const privacyStar = wrapper.find('[data-testid="home-privacy-star"]');

    expect(privacyStar.attributes('aria-expanded')).toBe('false');

    await privacyStar.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('home');
    expect(privacyStar.attributes('aria-expanded')).toBe('true');

    await wrapper.find('[data-testid="home-privacy-tooltip-link"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('privacy');

    wrapper.unmount();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia
    });
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

  it('guides the configured image and completes the guide before routing from it', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 100, 200, 300)
    );
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const router = createTestRouter();
    const push = vi.spyOn(router, 'push');
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: guideFloatingImageNetworkStub,
          HomeImageClickGuide: homeImageClickGuideStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    const floatingNetwork = wrapper.findComponent(guideFloatingImageNetworkStub);
    expect(floatingNetwork.props('guideTargetIndex')).toBeUndefined();
    expect(wrapper.find('[data-test="home-image-click-guide"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="home-meteor-arrows"]').exists()).toBe(true);

    floatingNetwork.vm.$emit('ready');
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(floatingNetwork.props('guideTargetIndex')).toBe(HOME_HERO_IMAGE_INDEX);
    expect(wrapper.find('[data-test="home-image-click-guide"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="home-meteor-arrows"]').exists()).toBe(false);

    await wrapper.findAll('[data-test="guide-image-card"]')[HOME_HERO_IMAGE_INDEX].trigger('click');

    expect(localStorage.getItem('asterism:guide:home-image-click')).toBe('completed');
    expect(push).toHaveBeenCalledWith({
      name: 'image-spread',
      params: { imageId: expect.any(String) }
    });
    wrapper.unmount();
  });

  it('shows the authenticated homepage focus tour without starting the image guide', async () => {
    const router = createTestRouter();
    const authStore = useAuthStore();
    const session: AuthSession = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Ada Lovelace',
        isAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    };
    authStore.session = session;
    authStore.user = session.user;
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: guideFloatingImageNetworkStub,
          HomeImageClickGuide: homeImageClickGuideStub,
          HomeTourIntro: homeTourIntroStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await flushPromises();
    const floatingNetwork = wrapper.findComponent(guideFloatingImageNetworkStub);
    floatingNetwork.vm.$emit('imagesLoaded');
    await flushPromises();

    expect(wrapper.find('[data-test="home-tour-intro"]').exists()).toBe(true);
    expect(floatingNetwork.props('guideTargetIndex')).toBeUndefined();
    expect(wrapper.find('[data-test="home-image-click-guide"]').exists()).toBe(false);
  });

  it('starts the image guide from Start Tour and persists the choice', async () => {
    let guideFrameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      guideFrameCallback = callback;
      return 1;
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 100, 200, 300)
    );
    const router = createTestRouter();
    const authStore = useAuthStore();
    const session: AuthSession = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Ada Lovelace',
        isAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    };
    authStore.session = session;
    authStore.user = session.user;
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      attachTo: document.body,
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: guideFloatingImageNetworkStub,
          HomeImageClickGuide: homeImageClickGuideStub,
          HomeTourIntro: homeTourIntroStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await flushPromises();
    const floatingNetwork = wrapper.findComponent(guideFloatingImageNetworkStub);
    floatingNetwork.vm.$emit('ready');
    await flushPromises();
    await wrapper.find('[data-test="home-tour-start"]').trigger('click');
    await flushPromises();
    wrapper.findAll('[data-test="guide-image-card"]')[HOME_HERO_IMAGE_INDEX].element.removeAttribute(
      'data-guide-image-ready'
    );
    guideFrameCallback?.(0);
    await wrapper.vm.$nextTick();

    expect(localStorage.getItem('asterism:tour:welcome')).toBe('handled');
    expect(floatingNetwork.props('guideTargetIndex')).toBeUndefined();

    wrapper.findAll('[data-test="guide-image-card"]')[HOME_HERO_IMAGE_INDEX].element.setAttribute(
      'data-guide-image-ready',
      'true'
    );
    floatingNetwork.vm.$emit('guideTargetReady');
    await flushPromises();
    guideFrameCallback?.(0);
    await wrapper.vm.$nextTick();

    expect(floatingNetwork.props('guideTargetIndex')).toBe(HOME_HERO_IMAGE_INDEX);
    expect(wrapper.find('[data-test="home-image-click-guide"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('returns to free exploration without starting the image guide', async () => {
    const router = createTestRouter();
    const authStore = useAuthStore();
    const session: AuthSession = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Ada Lovelace',
        isAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    };
    authStore.session = session;
    authStore.user = session.user;
    router.push('/');
    await router.isReady();

    const wrapper = mount(Home, {
      global: {
        plugins: [router],
        stubs: {
          FloatingImageNetwork: guideFloatingImageNetworkStub,
          HomeImageClickGuide: homeImageClickGuideStub,
          HomeTourIntro: homeTourIntroStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    await flushPromises();
    await wrapper.find('[data-test="home-tour-explore"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(localStorage.getItem('asterism:tour:welcome')).toBe('handled');
    expect(wrapper.find('[data-test="home-tour-intro"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="home-image-click-guide"]').exists()).toBe(false);
  });

  it('passes diverse home inspiration entry points to the floating network', async () => {
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

    expect(floatingNetwork.props('height')).toBe(`${(images.length / 3) * 100}vh`);
    expect(images).toHaveLength(108);
    const styleGroups = images.map((image) => image.styleGroup);
    expect(new Set(styleGroups).size).toBe(9);
    expect(new Set(styleGroups.slice(0, 18)).size).toBe(9);
    expect(getMaxConsecutiveStyleGroupCount(styleGroups)).toBeLessThanOrEqual(2);
    const perGroup = images.reduce<Record<string, number>>((acc, image) => {
      acc[image.styleGroup] = (acc[image.styleGroup] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.values(perGroup).every((count) => count === 12)).toBe(true);
  });

  it('passes Style DNA preferred styles to the home inspiration image service', async () => {
    const router = createTestRouter();
    const styleDnaStore = useStyleDnaStore();

    styleDnaStore.completeQuiz([
      createStyleDnaAnswer('1', 'Art Deco', 2),
      createStyleDnaAnswer('2', 'Baroque', 1)
    ]);
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

    expect(images[0]).toEqual(
      expect.objectContaining({
        id: 'doa-main-001',
        styleGroup: 'Decorative & Opulent Art'
      })
    );
    expect(images.slice(0, 9).every((image) => image.styleGroup === 'Decorative & Opulent Art')).toBe(
      true
    );
    expect(floatingNetwork.props('height')).toBe(`${(images.length / 3) * 100}vh`);
  });

  it('opens the limit modal for guests when viewport bottom reaches 450vh', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const viewport = mockViewport(3501);

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

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    const floatingNetwork = wrapper.findComponent(floatingImageNetworkStub);
    expect(floatingNetwork.props('safeCutoffVh')).toBe(450);
    expect(floatingNetwork.props('safeCutoffOffsetPx')).toBe(60);
    expect(wrapper.text()).toContain('Your daily inspiration limit has been reached.');
    expect(viewport.scrollTo).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('does not reopen the modal after closing — shows the header hint and clamps within the limit', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const viewport = mockViewport(3501);

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
    expect(wrapper.text()).toContain('Your daily inspiration limit has been reached.');

    await wrapper.find('.overlay-backdrop').trigger('click');
    await wrapper.vm.$nextTick();

    // 關閉後：不再彈窗、改顯示 header 區淡提示，並夾在限制處（非回頂）。
    expect(wrapper.text()).not.toContain('Your daily inspiration limit has been reached.');
    expect(wrapper.text()).toContain('Sign up or log in to keep exploring');
    expect(viewport.getScrollY()).toBe(3500);

    // 再次捲過限制：維持不彈窗、提示仍在、繼續夾在限制處。
    viewport.setScrollY(3900);
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Your daily inspiration limit has been reached.');
    expect(wrapper.text()).toContain('Sign up or log in to keep exploring');
    expect(viewport.getScrollY()).toBe(3500);

    wrapper.unmount();
  });

  it('keeps guests at the scroll limit (not the top) after the limit modal closes', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const viewport = mockViewport(3501);

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
    await wrapper.find('.overlay-backdrop').trigger('click');
    await wrapper.vm.$nextTick();

    expect(viewport.scrollTo).toHaveBeenCalledWith({
      top: 3500,
      behavior: 'auto'
    });
    expect(viewport.getScrollY()).toBe(3500);

    wrapper.unmount();
  });

  it('allows guests to trigger the limit modal again after remounting the page', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const firstViewport = mockViewport(3501);

    const firstWrapper = mount(Home, {
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

    await openLimitModal(firstWrapper);
    await firstWrapper.find('.overlay-backdrop').trigger('click');
    await firstWrapper.vm.$nextTick();
    expect(firstWrapper.text()).not.toContain('Your daily inspiration limit has been reached.');
    expect(firstViewport.getScrollY()).toBe(3500);
    firstWrapper.unmount();
    firstViewport.scrollTo.mockRestore();

    const secondViewport = mockViewport(3501);
    const secondWrapper = mount(Home, {
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

    await openLimitModal(secondWrapper);

    expect(secondWrapper.text()).toContain('Your daily inspiration limit has been reached.');
    expect(secondViewport.scrollTo).not.toHaveBeenCalled();

    secondWrapper.unmount();
  });

  it('does not open the limit modal for authenticated users when viewport bottom reaches 450vh', async () => {
    const router = createTestRouter();
    router.push('/');
    await router.isReady();
    const viewport = mockViewport(3501);
    const authStore = useAuthStore();
    const session: AuthSession = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Ada Lovelace',
        isAdmin: false,
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
          HomeTourIntro: homeTourIntroStub,
          Teleport: true,
          Transition: false
        }
      }
    });

    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(floatingImageNetworkStub).props('safeCutoffVh')).toBeUndefined();
    expect(wrapper.text()).not.toContain('Your daily inspiration limit has been reached.');
    expect(viewport.scrollTo).not.toHaveBeenCalled();

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

    mockViewport(3501);
    await openLimitModal(wrapper);
    await wrapper.find('[data-testid="cta-create-account"]').trigger('click');

    expect(push).toHaveBeenCalledWith({
      name: 'sign-up',
      query: { next: '/discover-dna' }
    });

    wrapper.unmount();
  });
});
