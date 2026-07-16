import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeImageClickGuide from '@/components/feature/guide/HomeImageClickGuide.vue';
import { i18n } from '@/i18n';

function appendTarget(rect: DOMRect): HTMLElement {
  const target = document.createElement('div');
  target.dataset.guideTarget = 'true';
  target.dataset.guideImageIndex = '5';
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect);
  document.body.append(target);
  return target;
}

describe('HomeImageClickGuide', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('does not render when its target image is unavailable', () => {
    const wrapper = mount(HomeImageClickGuide, { props: { targetIndex: 5 } });

    expect(wrapper.find('[data-testid="guide-tooltip"]').exists()).toBe(false);
  });

  it('renders a diagonal arrow, endpoint pulse and plain guide text around its target image', async () => {
    appendTarget(new DOMRect(120, 180, 200, 300));
    const wrapper = mount(HomeImageClickGuide, { props: { targetIndex: 5 } });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('[data-testid="guide-backdrop"]')).toHaveLength(4);
    expect(wrapper.find('[data-testid="guide-arrow"]').classes()).toContain('guide-arrow');
    expect(wrapper.find('[data-testid="guide-arrow-endpoint"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guide-arrow-endpoint"]').attributes('style')).toContain(
      'left: 102px'
    );
    expect(wrapper.find('[data-testid="guide-tooltip"]').text()).toContain(
      i18n.global.t('home.guide.imageClick')
    );
  });

  it('shows tooltip only while the target is hovered on pointer devices', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const target = appendTarget(new DOMRect(120, 180, 200, 300));
    const wrapper = mount(HomeImageClickGuide, { props: { targetIndex: 5 } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="guide-tooltip"]').exists()).toBe(false);

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="guide-tooltip"]').exists()).toBe(true);

    target.dispatchEvent(new MouseEvent('mouseleave'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="guide-tooltip"]').exists()).toBe(false);

    window.matchMedia = originalMatchMedia;
  });

  it('emits dismiss when Escape is pressed', () => {
    appendTarget(new DOMRect(120, 180, 200, 300));
    const wrapper = mount(HomeImageClickGuide, { props: { targetIndex: 5 } });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});
