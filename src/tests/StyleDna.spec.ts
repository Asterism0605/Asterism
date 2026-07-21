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
const mockCanSkip = ref(true);
const mockSelectAnswer = vi.fn();
const mockSkipQuestion = vi.fn();
const mockResetQuiz = vi.fn();

vi.mock('@/composables/useStyleDnaQuiz', () => ({
  useStyleDnaQuiz: () => ({
    questions: ref(Array.from({ length: 12 }, () => mockQuestion)),
    currentQuestion: computed(() => (mockIsCompleted.value ? null : mockQuestion)),
    currentQuestionIndex: mockCurrentIndex,
    answeredCount: computed(() => mockAnswers.length),
    canSkip: mockCanSkip,
    answers: mockAnswers,
    isCompleted: mockIsCompleted,
    result: ref(null),
    selectAnswer: mockSelectAnswer,
    skipQuestion: mockSkipQuestion,
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
          props: ['positionIndex', 'isSkipping'],
          template: `
            <div
              data-testid="picker"
              :data-position-index="positionIndex"
              :data-is-skipping="String(isSkipping)"
            >
              <button data-testid="select-btn" @click="$emit('select', 'opt-a')" />
              <button data-testid="skip-btn" @click="$emit('skip')" />
            </div>
          `,
          emits: ['select', 'skip']
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
    mockCanSkip.value = true;
    mockSelectAnswer.mockReset();
    mockSkipQuestion.mockReset();
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

  it('renders a mobile vertical progress track based on completed answers (#92)', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    const wrapper = mountStyleDna(router, pinia);

    const progress = wrapper.get('.quiz-progress-mobile');
    expect(progress.attributes('role')).toBe('progressbar');
    expect(progress.attributes('aria-valuenow')).toBe('0');
    expect(progress.attributes('aria-valuemax')).toBe('12');
    expect(progress.attributes('style')).toContain('--quiz-progress: 0');
    expect(wrapper.find('.qpm-track').exists()).toBe(true);
    expect(wrapper.find('.qpm-star').exists()).toBe(true);

    mockAnswers.push(...Array.from({ length: 10 }, () => mockAnswer));
    await wrapper.vm.$nextTick();
    expect(progress.attributes('aria-valuenow')).toBe('10');

    mockAnswers.push(mockAnswer, mockAnswer);
    await wrapper.vm.$nextTick();
    expect(progress.attributes('aria-valuenow')).toBe('12');
    expect(progress.attributes('style')).toContain('--quiz-progress: 1');
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

  it('changes the high-low layout only after an answered question', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    mockSelectAnswer.mockImplementationOnce(() => {
      mockAnswers.push(mockAnswer);
      mockCurrentIndex.value += 1;
    });

    const wrapper = mountStyleDna(router, pinia);
    const picker = wrapper.get('[data-testid="picker"]');
    expect(picker.attributes('data-position-index')).toBe('0');

    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(picker.attributes('data-position-index')).toBe('1');
  });

  it('skips after the short transition without changing answer progress', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    const wrapper = mountStyleDna(router, pinia);
    const progress = wrapper.get('.quiz-progress-mobile');
    const picker = wrapper.get('[data-testid="picker"]');
    expect(progress.attributes('aria-valuenow')).toBe('0');
    expect(picker.attributes('data-position-index')).toBe('0');

    mockSkipQuestion.mockImplementationOnce(() => {
      mockCurrentIndex.value += 1;
    });

    await wrapper.find('[data-testid="skip-btn"]').trigger('click');
    expect(picker.attributes('data-is-skipping')).toBe('true');
    await vi.advanceTimersByTimeAsync(240);

    expect(mockSkipQuestion).toHaveBeenCalledTimes(1);
    expect(progress.attributes('aria-valuenow')).toBe('0');
    expect(picker.attributes('data-position-index')).toBe('0');
    expect(picker.attributes('data-is-skipping')).toBe('false');
  });

  it('ignores skip while a selection transition is in progress', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push('/style-dna');
    await router.isReady();

    const wrapper = mountStyleDna(router, pinia);
    await wrapper.find('[data-testid="select-btn"]').trigger('click');
    await wrapper.find('[data-testid="skip-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(mockSelectAnswer).toHaveBeenCalledTimes(1);
    expect(mockSkipQuestion).not.toHaveBeenCalled();
  });
});
