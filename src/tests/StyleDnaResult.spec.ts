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
let wrapperCleanups: Array<() => void> = [];

function mountStyleDnaResult() {
  const wrapper = mount(StyleDnaResult, {
    global: { plugins: [pinia] }
  });
  wrapperCleanups.push(() => wrapper.unmount());
  return wrapper;
}

describe('StyleDnaResult', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    push.mockResolvedValue(undefined);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  afterEach(() => {
    wrapperCleanups.forEach((cleanup) => cleanup());
    wrapperCleanups = [];
    vi.useRealTimers();
    vi.restoreAllMocks();
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
    expect(wrapper.get('[data-testid="result-personalized-message-layer"]').attributes('data-active')).toBe(
      'false'
    );
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

  it('removes the start exploring CTA and keeps the quiz restart route', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();

    await vi.advanceTimersByTimeAsync(1600);
    expect(wrapper.find('[data-testid="start-exploring"]').exists()).toBe(false);
    await wrapper.get('[data-testid="retake-quiz"]').trigger('click');

    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith({ name: 'style-dna' });
  });

  it('shows meteors after one viewport and routes after the message at two viewports', async () => {
    vi.useFakeTimers();

    const wrapper = mountStyleDnaResult();
    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.get('[data-testid="result-scroll-prompt"]').text()).toContain(
      'Scroll down'
    );
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('left-1/2');
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('bottom-[20px]');
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('text-[14px]');
    expect(wrapper.get('[data-testid="result-scroll-prompt"] svg').classes()).toContain('size-6');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('right-[18px]');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('top-1/2');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('h-[25vh]');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('-translate-y-1/2');
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-progress')).toBe(
      '0.00'
    );
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-hint-active')).toBe(
      'true'
    );
    expect(wrapper.get('[data-testid="result-scroll-meteor"]').classes()).toContain('w-[2px]');
    expect(wrapper.get('main').classes()).toContain('min-h-[351vh]');
    expect(wrapper.get('main').classes()).toContain('bg-void');
    expect(wrapper.get('main').classes()).not.toContain('bg-deep');
    expect(wrapper.get('main > section').classes()).toContain('lg:relative');
    expect(wrapper.get('main > section').classes()).toContain('lg:overflow-visible');
    expect(wrapper.get('main > section > div').classes()).toContain('lg:overflow-visible');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 799 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 800 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 808 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-progress')).toBe(
      '0.40'
    );
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-hint-active')).toBe(
      'false'
    );
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'true'
    );
    expect(wrapper.get('.result-meteor').classes()).toContain('w-[2px]');
    expect(wrapper.get('.result-meteor').classes()).toContain('bg-gradient-to-b');
    expect(wrapper.findAll('.result-meteor')).toHaveLength(10);
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1199 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'true'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );
    expect(
      wrapper.get('[data-testid="result-personalized-message-layer"]').attributes('data-active')
    ).toBe('false');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1208 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(
      wrapper.get('[data-testid="result-personalized-message-layer"]').attributes('data-active')
    ).toBe('true');
    expect(wrapper.get('[data-testid="result-personalized-message-layer"] h1').classes()).toContain(
      'text-h1'
    );
    expect(wrapper.get('[data-testid="result-personalized-message-layer"] h1').classes()).toContain(
      'font-title'
    );
    expect(wrapper.get('[data-testid="result-personalized-message-layer"] h1').classes()).toContain(
      'font-light'
    );
    expect(
      wrapper.findAll('.result-personalized-message-line').map((line) => line.text())
    ).toEqual(['Your Homepage', 'is now personalized', 'based on', 'Your Style DNA']);
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1599 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1600 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1800 });
    window.dispatchEvent(new Event('scroll'));
    expect(
      wrapper.get('[data-testid="result-personalized-message-layer"] h1').attributes('style')
    ).toContain('opacity: 0.5');
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2000 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2008 });
    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ path: '/home', query: { source: 'style-dna' } });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

});
