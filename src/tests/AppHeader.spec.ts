import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '@/router';
import AppHeader from '@/layouts/AppHeader.vue';
import HomeTourIntro from '@/components/feature/guide/HomeTourIntro.vue';
import UserMenu from '@/layouts/UserMenu.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import { useUserTour } from '@/composables/guide/useUserTour';
import type { AuthSession } from '@/types/auth';
import type { StyleDnaAnswer } from '@/types/style-dna';

const supaAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
};
const single = vi.fn().mockResolvedValue({ data: null, error: null });
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ auth: supaAuth, from }) }));

function createAuthenticatedSession(displayName = 'Ada Lovelace'): AuthSession {
  return {
    accessToken: 'test-token',
    expiresAt: '2099-01-01T00:00:00.000Z',
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      displayName,
      isAdmin: false,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  };
}

function createMountedHeader() {
  const pinia = createPinia();
  setActivePinia(pinia);

  return {
    pinia,
    wrapper: mount(AppHeader, {
      global: {
        plugins: [router, pinia]
      }
    })
  };
}

describe('AppHeader', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await router.push('/');
    await router.isReady();
  });

  it('uses the picture detail width instead of covering the meta panel', async () => {
    await router.push('/images/y2k-main-001');
    await router.isReady();

    const { wrapper } = createMountedHeader();

    const headerClasses = wrapper.find('header').classes();

    expect(headerClasses).toContain('md:w-3/5');
    expect(headerClasses).not.toContain('w-full');
  });

  it('shows login actions when the user is not authenticated', () => {
    const { wrapper } = createMountedHeader();

    expect(wrapper.text()).toContain('Log in');
    expect(wrapper.text()).toContain('Sign Up');
    expect(wrapper.text()).not.toContain('Signed in as');
  });

  it('shows the authenticated menu and logs out through the auth store', async () => {
    const { wrapper } = createMountedHeader();
    const authStore = useAuthStore();
    const session = createAuthenticatedSession();

    authStore.session = session;
    authStore.user = session.user;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).not.toContain('Sign Up');

    await wrapper.findComponent(UserMenu).find('[aria-haspopup="true"]').trigger('click');

    expect(wrapper.text()).toContain('Signed in as');
    expect(wrapper.text()).toContain('Moodboard');
    expect(wrapper.text()).toContain('Consultation');
    expect(wrapper.text()).toContain('Log out');
    expect(wrapper.get('[data-testid="user-tour-control-trigger"]')).toBeTruthy();

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === 'Log out');

    expect(logoutButton).toBeTruthy();

    await logoutButton?.trigger('click');
    await flushPromises();

    expect(authStore.isAuthenticated).toBe(false);
    expect(wrapper.text()).toContain('Log in');
  });

  it('keeps the language menu interactive above the welcome tour', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'show', {
      configurable: true,
      value: vi.fn(function show(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      })
    });
    const pinia = createPinia();
    const Host = defineComponent({
      components: { AppHeader, HomeTourIntro },
      template: `
        <AppHeader />
        <HomeTourIntro
          description="Tour description"
          start-label="Start Tour"
          explore-label="Explore on my own"
        />
      `
    });
    const wrapper = mount(Host, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.get('header button[aria-haspopup="menu"]').trigger('click');

    expect(wrapper.get('header').classes()).toContain('z-[110]');
    expect(wrapper.get('[data-testid="home-tour-intro"]').classes()).toContain('z-50');
    expect(wrapper.get('header ul[role="menu"]').isVisible()).toBe(true);
  });

  it('marks only the language control as interactive during a Driver tour', () => {
    const { wrapper } = createMountedHeader();

    expect(wrapper.get('header').attributes('data-tour-header')).toBe('');
    expect(wrapper.get('[data-tour-interactive="language"]').attributes('data-tour-interactive')).toBe(
      'language'
    );
    expect(wrapper.get('header > button').attributes('data-tour-interactive')).toBeUndefined();
  });

  it('keeps the header above a chapter transition while leaving only language enabled', async () => {
    await router.push('/images/y2k-main-001');
    await router.isReady();
    localStorage.clear();
    const tour = useUserTour('user-1');
    tour.start('y2k-main-001');
    tour.advance('detail-save', 'y2k-main-001');
    tour.pause();
    tour.completeChapter('exploration');

    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    setActivePinia(pinia);
    const wrapper = mount(AppHeader, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.get('header').classes()).toContain('z-[210]');
    expect(wrapper.get('header').classes()).toContain('w-full');
    expect(wrapper.get('header').classes()).not.toContain('max-md:hidden');
    expect(wrapper.get('header > button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-tour-interactive="language"] > button').attributes('disabled')).toBeUndefined();
    expect(wrapper.getComponent(UserMenu).find('[aria-haspopup="true"]').attributes('disabled')).toBeDefined();

    wrapper.unmount();
  });

  it('resumes a paused tour from the header entry', async () => {
    localStorage.clear();
    const tour = useUserTour('user-1');
    tour.start('y2k-main-001');
    tour.advance('spread-related-group', 'y2k-main-001');
    tour.pause();

    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    setActivePinia(pinia);
    const wrapper = mount(AppHeader, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-resume"]').trigger('click');
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'spread-related-group'
    });
    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('y2k-main-001');

    wrapper.unmount();
  });

  it('resumes a paused detail step after routing to picture detail', async () => {
    localStorage.clear();
    const tour = useUserTour('user-1');
    tour.start('y2k-main-001');
    tour.advance('detail-thumbnail', 'y2k-main-001');
    tour.pause();

    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    setActivePinia(pinia);
    const wrapper = mount(AppHeader, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-resume"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'detail-thumbnail'
    });

    wrapper.unmount();
  });

  it('resumes a paused home step after routing from picture detail', async () => {
    await router.push('/images/y2k-main-001');
    await router.isReady();
    localStorage.clear();
    const tour = useUserTour('user-1');
    tour.start('y2k-main-001');
    tour.advance('home-image', 'y2k-main-001');
    tour.pause();

    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    setActivePinia(pinia);
    const wrapper = mount(AppHeader, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-resume"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('home');
    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'home-image'
    });

    wrapper.unmount();
  });

  it('starts the tour from the header control when it is idle', async () => {
    localStorage.clear();
    await router.push('/account/consultations');
    await router.isReady();
    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    setActivePinia(pinia);
    const wrapper = mount(AppHeader, {
      global: { plugins: [router, pinia] }
    });

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-start"]').trigger('click');
    await flushPromises();

    expect(JSON.parse(localStorage.getItem('asterism:tour:core:user-1') ?? '{}')).toMatchObject({
      status: 'active',
      step: 'home-overview'
    });
    expect(localStorage.getItem('asterism:tour:welcome:user-1')).toBe('handled');
    expect(router.currentRoute.value.name).toBe('home');

    wrapper.unmount();
  });
});

describe('AppHeader Style DNA 導向', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await router.push('/');
    await router.isReady();
  });

  function authenticateAndOpenMenu(wrapper: ReturnType<typeof createMountedHeader>['wrapper']) {
    const authStore = useAuthStore();
    const session = createAuthenticatedSession();
    authStore.session = session;
    authStore.user = session.user;
    return wrapper.vm.$nextTick();
  }

  it('沒測驗結果 → 導向 /discover-dna', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('styleDna');

    expect(push).toHaveBeenCalledWith('/discover-dna');
  });

  it('有測驗結果 → 導向 /style-dna/result', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const styleDnaStore = useStyleDnaStore();
    const answer: StyleDnaAnswer = {
      questionId: 'q1',
      selectedOptionId: 'o1',
      selectedImage: { id: 'img-1', url: 'test.jpg', style: [] },
      weights: {}
    };
    styleDnaStore.completeQuiz([answer], null);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('styleDna');

    expect(push).toHaveBeenCalledWith('/style-dna/result');
  });

  it('我的預約 → 導向 /account/consultations', async () => {
    const { wrapper } = createMountedHeader();
    await authenticateAndOpenMenu(wrapper);

    const push = vi.spyOn(router, 'push');
    wrapper.findComponent(UserMenu).vm.$emit('consultations');

    expect(push).toHaveBeenCalledWith({ name: 'account-consultations' });
  });
});
