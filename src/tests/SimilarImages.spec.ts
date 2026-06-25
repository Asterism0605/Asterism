import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
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
  it('navigates to the clicked image detail page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }]
    });

    await router.push('/images/current-image');
    await router.isReady();

    const wrapper = mount(SimilarImages, {
      props: { images },
      global: { plugins: [router] }
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe('related-001');
  });
});
