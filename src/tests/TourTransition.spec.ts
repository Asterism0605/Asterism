import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TourTransition from '@/components/feature/guide/TourTransition.vue';
import { gsap } from 'gsap';

describe('TourTransition', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'show', {
      configurable: true,
      value: vi.fn(function show(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      })
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: vi.fn(function close(this: HTMLDialogElement) {
        this.removeAttribute('open');
      })
    });
  });

  it('shows the two chapter choices and emits the selected action', async () => {
    const wrapper = mount(TourTransition, {
      props: {
        title: 'Exploration complete',
        description: 'Transition description',
        nextDescription: 'Next transition description',
        proceedLabel: 'Go to Moodboard',
        laterLabel: 'Continue later'
      }
    });

    await nextTick();

    expect(wrapper.find('[data-testid="tour-transition"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="tour-transition"]').text()).toContain('Exploration complete');
    expect(wrapper.get('[data-testid="tour-transition-backdrop"]').classes()).toContain('fixed');
    expect(wrapper.find('[data-testid="tour-transition-complete-icon"]').exists()).toBe(true);
    expect(wrapper.get('h1').classes()).toContain('text-h1');
    expect(wrapper.get('h1').classes()).not.toContain('text-display');
    expect(wrapper.findAll('button')).toHaveLength(2);

    await wrapper.get('[data-testid="tour-transition-proceed"]').trigger('click');
    await wrapper.get('[data-testid="tour-transition-later"]').trigger('click');

    expect(wrapper.emitted('proceed')).toHaveLength(1);
    expect(wrapper.emitted('later')).toHaveLength(1);
  });

  it('updates translated copy without replaying the reveal timeline', async () => {
    const createTimeline = vi.spyOn(gsap, 'timeline');
    const wrapper = mount(TourTransition, {
      props: {
        title: '探索完成',
        description: '第一段文字',
        nextDescription: '下一段文字',
        proceedLabel: '前往 Moodboard',
        laterLabel: '稍後再繼續'
      }
    });

    await nextTick();
    const timelineCount = createTimeline.mock.calls.length;

    await wrapper.setProps({
      title: 'Exploration complete',
      description: 'First translated line',
      nextDescription: 'Next translated line',
      proceedLabel: 'Go to Moodboard',
      laterLabel: 'Continue later'
    });
    await nextTick();

    expect(createTimeline.mock.calls.length).toBe(timelineCount);
    expect(wrapper.get('#tour-transition-description').text().replace(/\s+/g, '')).toContain(
      'Nexttranslatedline'
    );
  });
});
