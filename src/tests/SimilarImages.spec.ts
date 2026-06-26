import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SimilarImages from '@/components/feature/image/SimilarImages.vue';
import type { ImageSpreadNode } from '@/types/image';

const images: ImageSpreadNode[] = [
  {
    id: 'related-001',
    src: '/related-001.webp',
    alt: 'Related image',
    title: 'Related image',
    styleGroup: 'Y2K & Internet Aesthetics',
    style: ['Y2K'],
    colorPalette: ['#ffffff']
  }
];

describe('SimilarImages', () => {
  it('emits the clicked image id', async () => {
    const wrapper = mount(SimilarImages, {
      props: { images }
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('select')).toEqual([['related-001']]);
  });
});
