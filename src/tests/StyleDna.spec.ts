import { computed, reactive, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StyleDna from '@/pages/StyleDna.vue';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import { useAuthStore } from '@/stores/auth.store';
import type { StyleDnaAnswer, StyleDnaQuestion } from '@/types/style-dna';

const mockQuestion: StyleDnaQuestion = {
  id: 'q1',
  question: 'Choose your preferred style',
  options: [
    {
      id: 'opt-a',
      image: { id: 'img-a', url: '/a.webp', style: ['Minimalism'] },
      weights: { Minimalism: 1 }
    },
    {
      id: 'opt-b',
      image: { id: 'img-b', url: '/b.webp', style: ['Cyberpunk'] },
      weights: { Cyberpunk: 1 }
    }
  ] as [StyleDnaQuestion['options'][0], StyleDnaQuestion['options'][1]]
};

const mockAnswer: StyleDnaAnswer = {
  questionId: 'q1',
  selectedOptionId: 'opt-a',
  selectedImage: { id: 'img-a', url: '/a.webp', style: ['Minimalism'] },
  weights: { Minimalism: 1 }
};

const mockIsCompleted = ref(false);
const mockAnswers = reactive<StyleDnaAnswer[]>([]);
const mockCurrentIndex = ref(0);
const mockSelectAnswer = vi.fn();
const mockResetQuiz = vi.fn();

vi.mock('@/composables/useStyleDnaQuiz', () => ({
  useStyleDnaQuiz: () => ({
    questions: ref(Array.from({ length: 12 }, () => mockQuestion)),
    currentQuestion: computed(() => (mockIsCompleted.value ? null : mockQuestion)),
    currentQuestionIndex: mockCurrentIndex,
    answers: mockAnswers,
    isCompleted: mockIsCompleted,
    result: ref(null),
    selectAnswer: mockSelectAnswer,
    resetQuiz: mockResetQuiz
  })
}));

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/style-dna', name: 'style-dna', component: { template: '<div />' } },
      { path: '/style-dna/result', name: 'style-dna-result', component: { template: '<div />' } }
    ]
  });
}

function mountStyleDna(router: Router, pinia: ReturnType<typeof createPinia>) {
  return mount(StyleDna, {
    global: {
      plugins: [router, pinia],
      stubs: {
        AppHeader: true,
        StyleComparisonPicker: {
          template: '<button data-testid="select-btn" @click="$emit(\'select\', \'opt-a\')" />',
          emits: ['select']
        }
      }
    }
  });
}

describe('StyleDna', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsCompleted.value = false;
    mockAnswers.splice(0, mockAnswers.length);
    mockCurrentIndex.value = 0;
    mockSelectAnswer.mockReset();
    mockResetQuiz.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls completeQuiz with a snapshot of answers and navigates to result when quiz completes', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useStyleDnaStore();
    const completeQuiz = vi.spyOn(store, 'completeQuiz');

    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    mockAnswers.push(mockAnswer);
    mockSelectAnswer.mockImplementation(() => {
      mockIsCompleted.value = true;
    });

    const wrapper = mountStyleDna(router, pinia);

    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(completeQuiz).toHaveBeenCalledWith([mockAnswer], null);
    expect(push).toHaveBeenCalledWith('/style-dna/result');
  });

  it('renders mobile quiz progress that tracks the current question (#92)', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    const wrapper = mountStyleDna(router, pinia);

    expect(wrapper.find('.quiz-progress-mobile').exists()).toBe(true);
    expect(wrapper.find('.qpm-current').text()).toBe('1');
    expect(wrapper.find('.qpm-total').text()).toBe('12');

    mockCurrentIndex.value = 11;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.qpm-current').text()).toBe('12');
    expect(wrapper.find('.qpm-total').text()).toBe('12');

    // 完成瞬間 index 越界（12），Math.min 應夾住，不顯示 13/12
    mockCurrentIndex.value = 12;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.qpm-current').text()).toBe('12');
    expect(wrapper.find('.qpm-total').text()).toBe('12');
  });

  it('syncs the current Style DNA result when an authenticated user completes the quiz', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useStyleDnaStore();
    const saveCurrentResultToServer = vi
      .spyOn(store, 'saveCurrentResultToServer')
      .mockResolvedValue(undefined);
    const authStore = useAuthStore();
    authStore.user = {
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Member',
      isAdmin: false,
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    authStore.session = {
      user: authStore.user,
      accessToken: 'token',
      expiresAt: '2099-01-01T00:00:00.000Z'
    };

    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    mockAnswers.push(mockAnswer);
    mockSelectAnswer.mockImplementation(() => {
      mockIsCompleted.value = true;
    });

    const wrapper = mountStyleDna(router, pinia);

    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(store.localUserId).toBe('user-1');
    expect(saveCurrentResultToServer).toHaveBeenCalledWith('user-1');
  });

  it('does not call completeQuiz or navigate when a mid-quiz selection is made', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useStyleDnaStore();
    const completeQuiz = vi.spyOn(store, 'completeQuiz');

    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();
    const push = vi.spyOn(router, 'push');

    mockSelectAnswer.mockImplementation(() => {
      // isCompleted stays false — mid-quiz answer
    });

    const wrapper = mountStyleDna(router, pinia);

    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(completeQuiz).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores a second selection while a transition is still in progress', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    const wrapper = mountStyleDna(router, pinia);

    // First click starts the 500ms transition lock
    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    // Second click within the transition window must be ignored
    await wrapper.find('[data-testid="select-btn"]').trigger('click');

    await vi.advanceTimersByTimeAsync(500);

    expect(mockSelectAnswer).toHaveBeenCalledTimes(1);
  });
});
