import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ImageSelectToggle from '@/components/feature/moodboard/ImageSelectToggle.vue';

describe('ImageSelectToggle', () => {
  it('點擊時發出 toggle 事件', async () => {
    const wrapper = mount(ImageSelectToggle, {
      props: { selected: false, ariaLabel: '選取圖片' }
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('selected 為 false 時是空心狀態，aria-pressed 為 false', () => {
    const wrapper = mount(ImageSelectToggle, {
      props: { selected: false, ariaLabel: '選取圖片' }
    });

    const button = wrapper.get('button');
    expect(button.classes()).not.toContain('image-select-toggle--selected');
    expect(button.attributes('aria-pressed')).toBe('false');
  });

  it('selected 為 true 時是實心狀態，aria-pressed 為 true', () => {
    const wrapper = mount(ImageSelectToggle, {
      props: { selected: true, ariaLabel: '取消選取圖片' }
    });

    const button = wrapper.get('button');
    expect(button.classes()).toContain('image-select-toggle--selected');
    expect(button.attributes('aria-pressed')).toBe('true');
  });

  it('點擊會擋掉冒泡，不會觸發外層的 click handler', async () => {
    const outerClick = vi.fn();
    const wrapper = mount(
      {
        components: { ImageSelectToggle },
        setup() {
          return { outerClick };
        },
        template:
          '<div @click="outerClick"><ImageSelectToggle :selected="false" aria-label="選取圖片" /></div>'
      },
      {}
    );

    await wrapper.get('button').trigger('click');

    expect(wrapper.findComponent(ImageSelectToggle).emitted('toggle')).toHaveLength(1);
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('按下時不會讓外層開始處理拖曳', async () => {
    const outerPointerDown = vi.fn();
    const wrapper = mount({
      components: { ImageSelectToggle },
      setup() {
        return { outerPointerDown };
      },
      template:
        '<div @pointerdown="outerPointerDown"><ImageSelectToggle :selected="false" aria-label="選取圖片" /></div>'
    });

    await wrapper.get('button').trigger('pointerdown');

    expect(outerPointerDown).not.toHaveBeenCalled();
  });
});
