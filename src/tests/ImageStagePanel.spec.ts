import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImageStagePanel from '@/components/feature/image/ImageStagePanel.vue';
import type { ImageSpreadNode } from '@/types/image';

const smallImages: ImageSpreadNode[] = [
  {
    id: 'related-top-left',
    src: '/related-top-left.webp',
    alt: 'Top left related image',
    title: 'Top left related image',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K'],
    colorPalette: ['#ffffff']
  },
  {
    id: 'related-bottom-right',
    src: '/related-bottom-right.webp',
    alt: 'Bottom right related image',
    title: 'Bottom right related image',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K'],
    colorPalette: ['#000000']
  }
];

describe('ImageStagePanel', () => {
  it('emits the clicked floating related image id', async () => {
    const wrapper = mount(ImageStagePanel, {
      props: { mainImageUrl: '/main.webp', smallImages },
      global: {
        stubs: { ConstellationBackground: true }
      }
    });

    await wrapper.findAll('button')[1].trigger('click');

    expect(wrapper.emitted('select')).toEqual([['related-bottom-right']]);
  });

  it('觸發 back：滑鼠點擊空白區、Enter、Space 三種方式都能觸發', async () => {
    const wrapper = mount(ImageStagePanel, {
      props: { mainImageUrl: '/main.webp', smallImages },
      global: {
        stubs: { ConstellationBackground: true }
      }
    });

    const stage = wrapper.get('[role="button"]');
    expect(stage.attributes('tabindex')).toBe('0');

    await stage.trigger('keydown.enter');
    await stage.trigger('keydown.space');
    await stage.trigger('click');

    expect(wrapper.emitted('back')).toHaveLength(3);
  });
});
