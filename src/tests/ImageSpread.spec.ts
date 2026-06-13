import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import ImageSpread from '@/pages/ImageSpread.vue';

async function mountImageSpread(imageId = 'y2k-main-001') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread }
    ]
  });
  const push = vi.spyOn(router, 'push');

  router.push(`/images/${imageId}/spread`);
  await router.isReady();

  const wrapper = mount(ImageSpread, {
    global: {
      plugins: [router],
      stubs: {
        ConstellationBackground: true
      }
    }
  });

  return { wrapper, push };
}

describe('ImageSpread', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the center image, action buttons, and four related images', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toContain(
      '/style-image/'
    );
    expect(wrapper.text()).toContain('Return');
    expect(wrapper.text()).toContain('Add to moodboard');
    expect(wrapper.text()).not.toContain('Frutiger Aero');
    expect(wrapper.text()).not.toContain('Chrome Design');
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
  });

  it('marks every image surface as cursor pointer', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image-frame"]').classes()).toContain(
      'cursor-pointer'
    );

    for (const card of wrapper.findAll('[data-testid="related-image-card"]')) {
      expect(card.classes()).toContain('cursor-pointer');
    }

    for (const card of wrapper.findAll('[data-testid="related-image-card-mobile"]')) {
      expect(card.classes()).toContain('cursor-pointer');
    }
  });

  it('moves a related image to the center on the first related click', async () => {
    const { wrapper } = await mountImageSpread();
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];
    const firstRelatedSrc = firstRelatedImage.find('img').attributes('src');

    await firstRelatedImage.trigger('click');

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toBe(
      firstRelatedSrc
    );
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
  });

  it('routes to the future detail page on second-depth related click', async () => {
    const { wrapper, push } = await mountImageSpread();
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];

    await firstRelatedImage.trigger('click');
    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');

    expect(push).toHaveBeenCalledWith({
      path: expect.stringMatching(/^\/images\/.+/)
    });
  });

  it('shows an error state for unknown image ids', async () => {
    const { wrapper } = await mountImageSpread('missing-image');

    expect(wrapper.text()).toContain('Image not found');
    expect(wrapper.find('[data-testid="return-home"]').exists()).toBe(true);
  });
});
