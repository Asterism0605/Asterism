import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DeleteIconButton from '@/components/feature/moodboard/DeleteIconButton.vue';

describe('DeleteIconButton', () => {
  it('點擊時發出 delete 事件', async () => {
    const wrapper = mount(DeleteIconButton);

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('delete')).toHaveLength(1);
  });

  it('點擊會擋掉冒泡，不會觸發外層的 click handler', async () => {
    const outerClick = vi.fn();
    const wrapper = mount(
      {
        components: { DeleteIconButton },
        setup() {
          return { outerClick };
        },
        template: '<div @click="outerClick"><DeleteIconButton /></div>'
      },
      {}
    );

    await wrapper.get('button').trigger('click');

    expect(wrapper.findComponent(DeleteIconButton).emitted('delete')).toHaveLength(1);
    expect(outerClick).not.toHaveBeenCalled();
  });
});
