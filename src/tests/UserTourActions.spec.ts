import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Button from '@/components/ui/Button.vue';
import UserTourActions from '@/components/feature/guide/UserTourActions.vue';

describe('UserTourActions', () => {
  it('uses shared Button variants and emits previous and next actions', async () => {
    const wrapper = mount(UserTourActions, {
      props: {
        previousLabel: '上一步',
        nextLabel: '下一步'
      }
    });

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props('variant')).toBe('secondary');
    expect(buttons[1].props('variant')).toBe('primary');

    await wrapper.get('[data-testid="user-tour-previous"]').trigger('click');
    await wrapper.get('[data-testid="user-tour-next"]').trigger('click');

    expect(wrapper.emitted('previous')).toHaveLength(1);
    expect(wrapper.emitted('next')).toHaveLength(1);
  });

  it('renders no previous button on the first step', () => {
    const wrapper = mount(UserTourActions, {
      props: { nextLabel: '下一步' }
    });

    const buttons = wrapper.findAllComponents(Button);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props('variant')).toBe('primary');
    expect(wrapper.find('[data-testid="user-tour-previous"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="user-tour-next"]').text()).toBe('下一步');
  });
});
