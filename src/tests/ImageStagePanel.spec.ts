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

  it('點圖片以外的空白區觸發 back，不會誤觸 select', async () => {
    const wrapper = mount(ImageStagePanel, {
      props: { mainImageUrl: '/main.webp', smallImages },
      global: {
        stubs: { ConstellationBackground: true }
      }
    });

    await wrapper.find('div.relative').trigger('click');

    expect(wrapper.emitted('back')).toHaveLength(1);
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('點主圖或衛星圖片按鈕不會誤觸 back', async () => {
    const wrapper = mount(ImageStagePanel, {
      props: { mainImageUrl: '/main.webp', smallImages },
      global: {
        stubs: { ConstellationBackground: true }
      }
    });

    await wrapper.find('img[alt=""]').trigger('click');
    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.emitted('back')).toBeUndefined();
  });
});
