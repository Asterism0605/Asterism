import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import StyleConsultant from '@/pages/StyleConsultant.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { AuthSession } from '@/types/auth';
import type { StyleDnaAnswer } from '@/types/style-dna';

const memberSession: AuthSession = {
  accessToken: 'token',
  expiresAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    email: 'member@example.com',
    displayName: 'Member',
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
};

const y2kAnswer: StyleDnaAnswer = {
  questionId: 'question-1',
  selectedOptionId: 'option-y2k',
  selectedImage: {
    id: 'image-y2k',
    url: '/image-y2k.webp',
    style: ['Y2K']
  },
  weights: { Y2K: 2 }
};

describe('StyleConsultant', () => {
  function createTestRouter() {
    return createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/consultant', name: 'consultant', component: StyleConsultant }]
    });
  }

  function mountPage(router: ReturnType<typeof createTestRouter>, pinia: ReturnType<typeof createPinia>) {
    return mount(StyleConsultant, {
      global: {
        plugins: [router, pinia],
        stubs: {
          ConstellationBackground: true,
          RecommendationPanel: true
        }
      }
    });
  }

  it('reads sourceImageId from the route query', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();

    await router.push('/consultant?sourceImageId=rpl-interior-lighting-001');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBe(
      'rpl-interior-lighting-001'
    );
  });

  it('does not show mock Style DNA for unauthenticated visitors', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();

    await router.push('/consultant');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.text()).toContain('We need a Style DNA result');
    expect(wrapper.text()).toContain('Take Style DNA quiz');
    expect(wrapper.text()).not.toContain('Log In');
    expect(wrapper.text()).not.toContain('Create Account');
    expect(wrapper.text()).not.toContain('Luminous Minimalism');
    expect(wrapper.text()).not.toContain('Spatial Consultant · Mira Chen');
    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBeUndefined();
  });

  it('renders the quiz fallback for authenticated users without Style DNA result data', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    const router = createTestRouter();

    await router.push('/consultant?sourceImageId=not-a-real-image');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.text()).toContain('We need a Style DNA result');
    expect(wrapper.text()).toContain('Take Style DNA quiz');
    expect(wrapper.text()).not.toContain('Luminous Minimalism');
    expect(wrapper.text()).not.toContain('Matched consultant');
    expect(wrapper.get('.style-consultant').attributes('data-source-image-id')).toBe('not-a-real-image');
  });

  it('renders Style DNA and matched consultant information for authenticated users with result data', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    const styleDnaStore = useStyleDnaStore();
    authStore.session = memberSession;
    authStore.user = memberSession.user;
    styleDnaStore.completeQuiz([y2kAnswer], memberSession.user.id);
    const router = createTestRouter();

    await router.push('/consultant');
    await router.isReady();

    const wrapper = mountPage(router, pinia);

    expect(wrapper.text()).toContain('Style DNA');
    expect(wrapper.text()).toContain('Y2K');
    expect(wrapper.text()).toContain('100%');
    expect(wrapper.text()).toContain('Matched consultant');
    expect(wrapper.text()).toContain('Spatial Consultant · Ilya Chen');
    expect(wrapper.find('[data-testid="consultant-style-dna-fallback"]').exists()).toBe(false);
  });
});
