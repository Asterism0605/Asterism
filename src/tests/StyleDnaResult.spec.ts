import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StyleDnaResult from '@/pages/StyleDnaResult.vue';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import type { StyleDnaAnswer } from '@/types/style-dna';

// Produces Y2K 67%, Minimalism 33% — equivalent to the old selectionHistory fixture
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
  });

  it('shows the loading state before revealing the fallback result when the store has no answers', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();

    expect(wrapper.text()).toContain('Forming');
    expect(wrapper.text()).toContain('Your');
    expect(wrapper.text()).toContain('Style DNA');

    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.text()).toContain('Your');
    expect(wrapper.text()).toContain('Style DNA');
    expect(wrapper.text()).toContain('Minimalism');
    expect(wrapper.text()).toContain('Retake quiz');
    expect(wrapper.get('a[href="/discover-dna"]').text()).toContain('Retake quiz');
  });

  it('renders the real quiz result from the store and hides the fallback CTA when answers exist', async () => {
    vi.useFakeTimers();

    const store = useStyleDnaStore();
    store.completeQuiz(y2kAnswers);

    const wrapper = mountStyleDnaResult();

    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.text()).toContain('Y2K');
    expect(wrapper.text()).toContain('67%');
    expect(wrapper.find('img[alt*="Y2K"]').attributes('src')).toBe('/images/y2k.png');
    expect(wrapper.find('a[href="/discover-dna"]').exists()).toBe(false);
  });
});
