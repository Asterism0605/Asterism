import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
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
  it('navigates to the clicked floating related image detail page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }]
    });

    await router.push('/images/current-image');
    await router.isReady();

    const wrapper = mount(ImageStagePanel, {
      props: { mainImageUrl: '/main.webp', smallImages },
      global: {
        plugins: [router],
        stubs: { ConstellationBackground: true }
      }
    });

    await wrapper.findAll('button')[1].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe('related-bottom-right');
  });
});
