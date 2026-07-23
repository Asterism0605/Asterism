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
    selectedImage: { id: 'img-y2k', url: '/images/y2k.png', style: ['Editorial'] },
    weights: { Y2K: 2 }
  },
  {
    questionId: 'q2',
    selectedOptionId: 'opt-min',
    selectedImage: { id: 'img-min', url: '/images/min.png', style: ['Minimalism'] },
    weights: { Minimalism: 1 }
  }
];

const threeY2kAnswers: StyleDnaAnswer[] = Array.from({ length: 3 }, (_, index) => ({
  questionId: `q-y2k-${index}`,
  selectedOptionId: `opt-y2k-${index}`,
  selectedImage: {
    id: `img-y2k-${index}`,
    url: `/images/y2k-${index}.png`,
    style: ['Y2K']
  },
  weights: { Y2K: 1 }
}));

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
    expect(wrapper.findAll('[data-testid="result-transition-image"]')).toHaveLength(0);
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

  it('hides the native scrollbar only while the result page is mounted', () => {
    const wrapper = mount(StyleDnaResult, {
      global: { plugins: [pinia] }
    });

    expect(document.documentElement.classList.contains('style-dna-result-scrollbar-hidden')).toBe(
      true
    );

    wrapper.unmount();

    expect(document.documentElement.classList.contains('style-dna-result-scrollbar-hidden')).toBe(
      false
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
    expect(wrapper.findAll('[data-testid="result-transition-image"]')).toHaveLength(1);
    expect(
      wrapper.get('[data-testid="result-transition-image"] img').attributes('src')
    ).toBe('/images/y2k.png');
    expect(wrapper.text()).not.toContain('No quiz data found');
    expect(showToast).not.toHaveBeenCalled();
  });

  it('uses the saved primary-style hero image when synchronized results have no local answers', async () => {
    vi.useFakeTimers();

    const store = useStyleDnaStore();
    store.serverResult = {
      isFallback: false,
      primaryStyle: 'Y2K',
      styles: [{ label: 'Y2K', percentage: 100 }],
      annotations: [{ label: 'Y2K', value: '100%', position: 'top-right' }],
      heroImage: '/images/synced-y2k.png'
    };

    const wrapper = mountStyleDnaResult();
    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.findAll('[data-testid="result-transition-image"]')).toHaveLength(1);
    expect(
      wrapper.get('[data-testid="result-transition-image"] img').attributes('src')
    ).toBe('/images/synced-y2k.png');
  });

  it('renders three matching selected images together for the primary style transition', async () => {
    vi.useFakeTimers();

    const store = useStyleDnaStore();
    store.completeQuiz(threeY2kAnswers);

    const wrapper = mountStyleDnaResult();
    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.findAll('[data-testid="result-transition-image"]')).toHaveLength(3);
    const transitionImages = wrapper.findAll('[data-testid="result-transition-image"]');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2168 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    const messageLines = wrapper.findAll('.result-personalized-message-line');
    const opacityOf = (style: string | undefined) =>
      Number((style ?? '').match(/opacity:\s*([^;]+)/)?.[1]);
    expect(opacityOf(messageLines[0].attributes('style'))).toBeGreaterThan(
      opacityOf(transitionImages[0].attributes('style'))
    );
    expect(opacityOf(transitionImages[0].attributes('style'))).toBeGreaterThan(
      opacityOf(messageLines[1].attributes('style'))
    );
    expect(opacityOf(messageLines[1].attributes('style'))).toBeGreaterThan(
      opacityOf(transitionImages[1].attributes('style'))
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3680 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    transitionImages.forEach((image) => {
      expect(image.attributes('style')).toContain('opacity: 1');
      expect(image.attributes('style')).toContain('scale: none');
      expect(image.attributes('style')).not.toMatch(/scale\([^)]/);
      expect(image.get('div').classes().some((className) => className.includes('rotate'))).toBe(
        false
      );
    });
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

  it('shows the configured scroll-driven stages, pauses on black, and routes at 650vh', async () => {
    vi.useFakeTimers();

    const store = useStyleDnaStore();
    store.completeQuiz(y2kAnswers);

    const wrapper = mountStyleDnaResult();
    await vi.advanceTimersByTimeAsync(1600);

    expect(wrapper.get('[data-testid="result-scroll-prompt"]').text()).toContain(
      'Scroll down'
    );
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('left-1/2');
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('bottom-[25px]');
    expect(wrapper.get('[data-testid="result-scroll-prompt"]').classes()).toContain('text-[14px]');
    expect(wrapper.get('[data-testid="result-scroll-prompt"] svg').classes()).toContain('size-6');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('right-[18px]');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('top-1/2');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('h-[25vh]');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('-translate-y-1/2');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('hidden');
    expect(wrapper.get('[data-testid="result-scroll-track"]').classes()).toContain('lg:block');
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-progress')).toBe(
      '0.00'
    );
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-hint-active')).toBe(
      'true'
    );
    expect(wrapper.get('[data-testid="result-scroll-meteor"]').classes()).toContain('w-[2px]');
    expect(wrapper.get('main').classes()).toContain('min-h-[750vh]');
    expect(wrapper.get('main').classes()).toContain('bg-void');
    expect(wrapper.get('main').classes()).not.toContain('bg-deep');
    expect(wrapper.get('main > section').classes()).toContain('lg:relative');
    expect(wrapper.get('main > section').classes()).toContain('lg:overflow-visible');
    expect(wrapper.get('main > section > div').classes()).toContain('lg:overflow-visible');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 479 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 480 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 488 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-progress')).toBe(
      '0.09'
    );
    expect(wrapper.get('[data-testid="result-scroll-track"]').attributes('data-hint-active')).toBe(
      'false'
    );
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'true'
    );
    expect(wrapper.get('.result-meteor').classes()).toContain('w-[2px]');
    expect(wrapper.get('.result-meteor').classes()).toContain('bg-gradient-to-b');
    expect(wrapper.get('[data-testid="result-meteor-layer"]').classes()).toContain(
      'brightness-150'
    );
    expect(wrapper.findAll('.result-meteor')).toHaveLength(13);
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 920 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    for (const meteorId of ['center-upper', 'center-middle', 'center-lower']) {
      const meteorStyle = wrapper.get(`[data-meteor-id="${meteorId}"]`).attributes('style') ?? '';
      const opacity = Number(meteorStyle.match(/opacity:\s*([^;]+)/)?.[1]);
      expect(opacity).toBeGreaterThan(0.7);
    }

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1359 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'true'
    );

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1360 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="result-meteor-layer"]').attributes('data-active')).toBe(
      'false'
    );
    expect(
      wrapper.get('[data-testid="result-personalized-message-layer"]').attributes('data-active')
    ).toBe('false');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1368 });
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

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1824 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const messageLineOpacities = wrapper
      .findAll('.result-personalized-message-line')
      .map((line) => Number((line.attributes('style') ?? '').match(/opacity:\s*([^;]+)/)?.[1]));
    expect(messageLineOpacities[0]).toBeGreaterThan(messageLineOpacities[1]);
    expect(messageLineOpacities[1]).toBeGreaterThanOrEqual(messageLineOpacities[2]);
    expect(messageLineOpacities[2]).toBeGreaterThanOrEqual(messageLineOpacities[3]);

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3599 });
    window.dispatchEvent(new Event('scroll'));
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3600 });
    window.dispatchEvent(new Event('scroll'));
    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 4200 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(
      wrapper.get('[data-testid="result-personalized-message-layer"] h1').attributes('style')
    ).toContain('opacity: 0.5');
    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    expect(wrapper.get('[data-testid="result-transition-image-layer"]').classes()).not.toContain(
      'opacity-0'
    );
    expect(wrapper.get('[data-testid="result-transition-image"]').classes()).not.toContain(
      'opacity-0'
    );
    expect(wrapper.get('[data-testid="result-transition-image"]').attributes('style')).toContain(
      'opacity: 1'
    );
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 4800 });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    expect(wrapper.get('[data-testid="result-transition-image"]').attributes('style')).toContain(
      'opacity: 1'
    );
    expect(wrapper.get('[data-testid="result-transition-image"]').attributes('style')).toContain(
      'translate(0px, -800px)'
    );
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5199 });
    window.dispatchEvent(new Event('scroll'));
    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    expect(push).not.toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5200 });
    window.dispatchEvent(new Event('scroll'));
    expect(
      wrapper.get('[data-testid="result-transition-image-layer"]').attributes('data-active')
    ).toBe('true');
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith({ path: '/home', query: { source: 'style-dna' } });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

});
