import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DeleteIconButton from '@/components/feature/moodboard/DeleteIconButton.vue';

describe('DeleteIconButton', () => {
  it('點擊時呼叫 onDelete', async () => {
    const onDelete = vi.fn();
    const wrapper = mount(DeleteIconButton, { props: { onDelete } });

    await wrapper.get('button').trigger('click');

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('點擊會擋掉冒泡，不會觸發外層的 click handler', async () => {
    const onDelete = vi.fn();
    const outerClick = vi.fn();
    const wrapper = mount(
      {
        components: { DeleteIconButton },
        setup() {
          return { onDelete, outerClick };
        },
        template: '<div @click="outerClick"><DeleteIconButton :on-delete="onDelete" /></div>'
      },
      {}
    );

    await wrapper.get('button').trigger('click');

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(outerClick).not.toHaveBeenCalled();
  });
});
