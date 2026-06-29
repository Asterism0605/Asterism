import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import ImageSpread from '@/pages/ImageSpread.vue';
import { getImageById } from '@/services/image.service';
import { addItem } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

vi.mock('@/services/moodboard.service', () => ({
  addItem: vi.fn(),
  createFolder: vi.fn(),
  isImageSaved: vi.fn(() => false)
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn(),
  hideToast: vi.fn(),
  useToast: () => ({ toast: { value: null } })
}));

async function mountImageSpread(imageId = 'y2k-main-001') {
  const [routeImageId, routeQuery] = imageId.split('?');
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread },
      { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }
    ]
  });
  const push = vi.spyOn(router, 'push');

  router.push(`/images/${routeImageId}/spread${routeQuery ? `?${routeQuery}` : ''}`);
  await router.isReady();

  const wrapper = mount(ImageSpread, {
    global: {
      plugins: [router],
      stubs: {
        ConstellationBackground: true
      }
    }
  });

  return { wrapper, push, router };
}

describe('ImageSpread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the center image, action buttons, and four related images', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toContain(
      '/style-image/'
    );
    expect(wrapper.text()).toContain('Return');
    expect(wrapper.text()).toContain('ADD TO MOODBOARD');
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
  });

  it('labels first-depth related images by medium', async () => {
    const { wrapper } = await mountImageSpread();
    const labels = wrapper
      .findAll('[data-testid="related-image-card"]')
      .map((card) => card.text());

    expect(labels).toEqual([
      'Graphic Design',
      'Outfit',
      'Interior Design',
      'Architecture'
    ]);
  });

  it('labels second-depth related images by subMedium', async () => {
    const { wrapper } = await mountImageSpread();

    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');
    await flushPromises();

    const labels = wrapper
      .findAll('[data-testid="related-image-card"]')
      .map((card) => card.text());

    expect(labels).toEqual([
      'Poster Design',
      'Editorial Design',
      'Brand Identity',
      'Packaging Design'
    ]);
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
    const { wrapper, router } = await mountImageSpread();
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];
    const firstRelatedSrc = firstRelatedImage.find('img').attributes('src');

    await firstRelatedImage.trigger('click');
    await flushPromises();
    const routeImageId = router.currentRoute.value.params.imageId;
    const routeImage = getImageById(Array.isArray(routeImageId) ? routeImageId[0] : routeImageId);

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toBe(
      firstRelatedSrc
    );
    expect(routeImage?.src).toBe(firstRelatedSrc);
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
  });

  it('hides the center label for main images and labels medium entry images', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image-label"]').exists()).toBe(false);

    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="spread-main-image-label"]').text()).toBe('Graphic Design');
  });

  it('routes to the future detail page on second-depth related click', async () => {
    const { wrapper, router } = await mountImageSpread();
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];

    await firstRelatedImage.trigger('click');
    await flushPromises();
    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBeDefined();
  });

  it('returns to the previous spread layer after the first related click', async () => {
    const { wrapper, push, router } = await mountImageSpread();
    const initialSrc = wrapper.find('[data-testid="spread-main-image"]').attributes('src');
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];

    await firstRelatedImage.trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).not.toBe(
      initialSrc
    );

    await wrapper.find('[data-testid="return-home"]').trigger('click');
    await flushPromises();
    const routeImageId = router.currentRoute.value.params.imageId;
    const routeImage = getImageById(Array.isArray(routeImageId) ? routeImageId[0] : routeImageId);

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toBe(initialSrc);
    expect(routeImage?.src).toBe(initialSrc);
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
    expect(push).not.toHaveBeenCalledWith({ name: 'home' });
  });

  it('routes home when returning from the root spread layer', async () => {
    const { wrapper, push } = await mountImageSpread();
    const back = vi.spyOn(wrapper.vm.$router, 'back');

    await wrapper.find('[data-testid="return-home"]').trigger('click');

    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({ name: 'home' });
  });

  it('returns from a medium spread layer to root, then home', async () => {
    const { wrapper, push, router } = await mountImageSpread('rpl-interior-001?rootId=rpl-main-001');

    await wrapper.find('[data-testid="return-home"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-main-001');
    expect(router.currentRoute.value.query.rootId).toBeUndefined();

    await wrapper.find('[data-testid="return-home"]').trigger('click');
    await flushPromises();

    expect(push).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows an error state for unknown image ids', async () => {
    const { wrapper } = await mountImageSpread('missing-image');

    expect(wrapper.text()).toContain('Image not found');
    expect(wrapper.find('[data-testid="return-home"]').exists()).toBe(true);
  });

  it('shows an error toast when addItem throws', async () => {
    vi.mocked(addItem).mockImplementationOnce(() => { throw new Error('save failed') });
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('disables ADD TO MOODBOARD while a save is in flight and re-enables after', async () => {
    let resolve!: () => void;
    vi.mocked(addItem).mockImplementationOnce(() => new Promise<void>((r) => { resolve = r; }));
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true);

    resolve();
    await flushPromises();

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(false);
    expect(addItem).toHaveBeenCalledOnce();
  });

  it('calls addItem with the center image id when SAVE TO FOLDER is clicked', async () => {
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    await flushPromises();

    expect(addItem).toHaveBeenCalledOnce();
    expect(addItem).toHaveBeenCalledWith('default', 'y2k-main-001');
  });
});
