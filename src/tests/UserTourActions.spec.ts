import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Button from '@/components/ui/Button.vue';
import UserTourActions from '@/components/feature/guide/UserTourActions.vue';

describe('UserTourActions', () => {
  it('uses shared Button variants and emits pause and next actions', async () => {
    const wrapper = mount(UserTourActions, {
      props: {
        pauseLabel: '暫停',
        nextLabel: '下一步'
      }
    });

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props('variant')).toBe('secondary');
    expect(buttons[1].props('variant')).toBe('primary');

    await wrapper.get('[data-testid="user-tour-pause"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-next"]').trigger('click');

    expect(wrapper.emitted('pause')).toHaveLength(1);
    expect(wrapper.emitted('next')).toHaveLength(1);
  });

  it('renders pause only when the step advances by clicking its target', () => {
    const wrapper = mount(UserTourActions, {
      props: { pauseLabel: '暫停' }
    });

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props('variant')).toBe('secondary');
    expect(wrapper.get('[data-testid="user-tour-pause"]').text()).toBe('暫停');
    expect(wrapper.find('[data-testid="user-tour-next"]').exists()).toBe(false);
  });
});
