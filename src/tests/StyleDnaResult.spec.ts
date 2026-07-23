import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StyleDnaResult from '@/pages/StyleDnaResult.vue';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { StyleDnaAnswer } from '@/types/style-dna';

const { push, showToast } = vi.hoisted(() => ({
  push: vi.fn(),
  showToast: vi.fn()
}));

vi.mock('@/composables/useToast', () => ({
  showToast
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}));

const y2kAnswers: StyleDnaAnswer[] = [
  {
    questionId: 'q1',
    selectedOptionId: 'opt-y2k',
    selectedImage: { id: 'img-y2k', url: '/images/y2k.png', style: ['Y2K'] },
    weights: { Y2K: 2 }
  },
  {
    questionId: 'q2',
    selectedOptionId: 'opt-min',
    selectedImage: { id: 'img-min', url: '/images/min.png', style: ['Minimalism'] },
    weights: { Minimalism: 1 }
  }
];

let pinia: ReturnType<typeof createPinia>;

function mountStyleDnaResult() {
  return mount(StyleDnaResult, {
    global: { plugins: [pinia] }
  });
}

describe('StyleDnaResult', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    vi.useRealTimers();
    push.mockReset();
    showToast.mockReset();
  });

  it('shows the loading state before rendering the fallback result when the store has no answers', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();

    expect(wrapper.text()).toContain('Forming');
    expect(wrapper.text()).toContain('Your');
    expect(wrapper.text()).toContain('Style DNA');

    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.text()).toContain('Your');
    expect(wrapper.text()).toContain('Style DNA');
    expect(wrapper.text()).toContain('Style DNA Complete');
    expect(wrapper.text()).toContain('Minimalism');
    expect(wrapper.text()).toContain('70%');
    expect(wrapper.text()).toContain('Your homepage is now personalized based on your Style DNA.');
    expect(wrapper.text()).toContain('Retake Quiz');
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        message: 'We do not have quiz result yet, so this is a sample Style DNA result.',
        actionText: 'Retake Quiz'
      })
    );
  });

  it('renders the real quiz result from the store with the fixed hero image and does not show the fallback toast', async () => {
    vi.useFakeTimers();

    const store = useStyleDnaStore();
    store.completeQuiz(y2kAnswers);

    const wrapper = mountStyleDnaResult();

    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.text()).toContain('Y2K');
    expect(wrapper.text()).toContain('67%');
    expect(wrapper.text()).toContain('Style DNA Complete');
    expect(wrapper.find('img[alt*="Y2K"]').attributes('src')).toBe('/images/astronaut-dna.png');
    expect(wrapper.text()).not.toContain('No quiz data found');
    expect(showToast).not.toHaveBeenCalled();
  });

  it('routes the result CTAs to the personalized feed and quiz restart', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();

    await vi.advanceTimersByTimeAsync(1600);
    await wrapper.get('[data-testid="start-exploring"]').trigger('click');
    await wrapper.get('[data-testid="retake-quiz"]').trigger('click');

    expect(push).toHaveBeenNthCalledWith(1, { name: 'home', query: { source: 'style-dna' } });
    expect(push).toHaveBeenNthCalledWith(2, { name: 'style-dna' });
  });

  it('uses the sand wrapper without changing the primary CTA typography classes', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();

    await vi.advanceTimersByTimeAsync(1600);

    const startExploring = wrapper.get('[data-testid="start-exploring"]');

    expect(startExploring.element.parentElement?.classList.contains('result-guide-submit')).toBe(
      true
    );
    expect(startExploring.classes()).toContain('text-sm');
    expect(startExploring.classes()).toContain('tracking-[1px]');
  });
});
