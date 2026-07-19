import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import TourControl from '@/components/feature/guide/TourControl.vue';
import { i18n } from '@/i18n';
import type { UserTourStatus, UserTourStep } from '@/composables/guide/useUserTour';

function mountTourControl(status: UserTourStatus, step: UserTourStep | null = null) {
  return mount(TourControl, {
    props: { status, step }
  });
}

describe('TourControl', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en';
  });

  it('opens the start action when the tour has not started', async () => {
    const wrapper = mountTourControl('idle');

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');

    expect(wrapper.text()).toContain('Start tour');
    expect(wrapper.get('[data-testid="user-tour-start"] svg')).toBeTruthy();
    await wrapper.get('[data-testid="user-tour-start"]').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
    expect(
      wrapper.get('[data-testid="user-tour-control-trigger"]').attributes('aria-expanded')
    ).toBe('false');
  });

  it('offers resume and restart actions for a paused tour', async () => {
    const wrapper = mountTourControl('paused', 'detail-save');

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');

    expect(wrapper.text()).toContain('Resume tour');
    expect(wrapper.text()).toContain('Image detail');
    expect(wrapper.get('[data-testid="user-tour-resume"] svg')).toBeTruthy();
    expect(wrapper.get('[data-testid="user-tour-control-header"]').classes()).toContain('border-b');
    await wrapper.get('[data-testid="user-tour-resume"]').trigger('click');
    expect(wrapper.emitted('resume')).toHaveLength(1);

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-restart"]').trigger('click');
    expect(wrapper.emitted('restart')).toHaveLength(1);
  });

  it('offers replay after the tour is completed', async () => {
    const wrapper = mountTourControl('completed');

    await wrapper.get('[data-testid="user-tour-control-trigger"]').trigger('click');

    expect(wrapper.text()).toContain('Replay tour');
    expect(wrapper.get('[data-testid="user-tour-restart"] svg')).toBeTruthy();
    expect(wrapper.get('[data-testid="user-tour-control-header"]').classes()).not.toContain(
      'border-b'
    );
    expect(wrapper.find('[data-testid="user-tour-resume"]').exists()).toBe(false);
    await wrapper.get('[data-testid="user-tour-restart"]').trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
  });

  it('disables the target control while the tour is active', async () => {
    const wrapper = mountTourControl('active', 'home-overview');
    const trigger = wrapper.get('[data-testid="user-tour-control-trigger"]');

    expect(trigger.attributes('disabled')).toBeDefined();
    expect(trigger.attributes('aria-disabled')).toBe('true');
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="user-tour-control-menu"]').exists()).toBe(false);
  });

  it('closes the menu with Escape and when clicking outside', async () => {
    const wrapper = mountTourControl('idle');
    const trigger = wrapper.get('[data-testid="user-tour-control-trigger"]');

    await trigger.trigger('click');
    await trigger.trigger('keydown.esc');
    expect(wrapper.find('[data-testid="user-tour-control-menu"]').exists()).toBe(false);

    await trigger.trigger('click');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="user-tour-control-menu"]').exists()).toBe(false);
  });

  it('uses disclosure semantics instead of an incomplete menu pattern', async () => {
    const wrapper = mountTourControl('idle');
    const trigger = wrapper.get('[data-testid="user-tour-control-trigger"]');

    expect(trigger.attributes('aria-haspopup')).toBe('true');

    await trigger.trigger('click');

    expect(
      wrapper.get('[data-testid="user-tour-control-menu"]').attributes('role')
    ).toBeUndefined();
    expect(wrapper.get('[data-testid="user-tour-start"]').attributes('role')).toBeUndefined();
  });
});
