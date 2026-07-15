import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeTourIntro from '@/components/feature/guide/HomeTourIntro.vue';

describe('HomeTourIntro', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: vi.fn(function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      })
    });
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

  it('shows both choices and emits the selected action', async () => {
    const wrapper = mount(HomeTourIntro, {
      props: {
        description: 'Tour description',
        startLabel: 'Start Tour',
        exploreLabel: 'Explore on my own'
      }
    });

    await nextTick();

    expect(wrapper.find('[data-testid="home-tour-intro"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="home-tour-start"]').text()).toContain('Start Tour');
    expect(wrapper.find('[data-testid="home-tour-explore"]').text()).toContain('Explore on my own');
    const arrows = wrapper.findAll('img');
    expect(arrows).toHaveLength(2);
    expect(arrows.map((arrow) => arrow.attributes('src'))).toEqual([
      '/images/arrow.svg',
      '/images/arrow.svg'
    ]);

    await wrapper.find('[data-testid="home-tour-start"]').trigger('click');
    await wrapper.find('[data-testid="home-tour-explore"]').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
    expect(wrapper.emitted('explore')).toHaveLength(1);
  });

  it('does not close when the dialog receives a cancel event', async () => {
    const wrapper = mount(HomeTourIntro, {
      props: {
        description: 'Tour description',
        startLabel: 'Start Tour',
        exploreLabel: 'Explore on my own'
      }
    });

    await nextTick();
    const dialog = wrapper.find('dialog');
    await dialog.trigger('cancel');

    expect(dialog.exists()).toBe(true);
    expect(wrapper.emitted('close')).toBeUndefined();
  });
});
