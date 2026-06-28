import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import PictureDetail from '@/pages/PictureDetail.vue';
import { getRelatedImages } from '@/services/image.service';
import { saveImage } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth.store';

vi.mock('@/services/moodboard.service', () => ({
  saveImage: vi.fn(),
  unsaveImage: vi.fn(),
  createFolder: vi.fn(),
  isImageSaved: vi.fn(() => false)
}));

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn(),
  hideToast: vi.fn(),
  useToast: () => ({ toast: { value: null } })
}));

vi.mock('@/components/feature/image/ImageStagePanel.vue', () => ({
  default: {
    emits: ['select'],
    template: '<div data-test="image-stage-panel" @click="$emit(\'select\', \'stage-related-001\')" />'
  }
}));

const fakeUser = {
  id: 'user-1',
  email: 'member@example.com',
  displayName: 'Member',
  isAdmin: false,
  createdAt: '2026-01-01T00:00:00Z'
};

async function mountPictureDetail(imageId = 'y2k-main-001', isAuthenticated = true) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
      { path: '/images/:imageId/spread', name: 'image-spread', component: { template: '<div />' } },
      { path: '/consultant', name: 'consultant', component: { template: '<div />' } },
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } }
    ]
  });
  const pinia = createPinia();
  const authStore = useAuthStore(pinia);

  if (isAuthenticated) {
    authStore.user = fakeUser;
    authStore.session = {
      user: fakeUser,
      accessToken: 'test-token',
      expiresAt: '2026-01-01T01:00:00Z'
    };
  }

  await router.push(`/images/${imageId}`);
  await router.isReady();

  const wrapper = mount(PictureDetail, { global: { plugins: [router, pinia] } });

  return { router, wrapper };
}

describe('PictureDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls saveImage with the current image when SAVE TO FOLDER is clicked', async () => {
    const { wrapper } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    expect(saveImage).toHaveBeenCalledOnce();
    expect(saveImage).toHaveBeenCalledWith(expect.objectContaining({ id: 'y2k-main-001' }));
  });

  it('shows an error toast and error message when saveImage throws', async () => {
    vi.mocked(saveImage).mockImplementationOnce(() => { throw new Error('save failed') });
    const { wrapper } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(wrapper.text()).toContain('Failed to save. Please try again.');
  });

  it('shows a success toast after saving', async () => {
    const { wrapper } = await mountPictureDetail();

    vi.useFakeTimers();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');

    await vi.runAllTimersAsync();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('routes to consultant with the source image id when consult is clicked', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001');

    const consultBtn = wrapper.findAll('button').find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('consultant');
    expect(router.currentRoute.value.query.sourceImageId).toBe('rpl-interior-lighting-001');
  });

  it('routes unauthenticated consult clicks to sign-up with the consultant target', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001', false);

    const consultBtn = wrapper.findAll('button').find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('sign-up');
    expect(router.currentRoute.value.query.next).toBe(
      '/consultant?sourceImageId=rpl-interior-lighting-001'
    );
  });

  it('routes to the selected stage image detail page', async () => {
    const { router, wrapper } = await mountPictureDetail();

    await wrapper.find('[data-test="image-stage-panel"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe('stage-related-001');
  });

  it('routes to the selected similar image detail page', async () => {
    const { router, wrapper } = await mountPictureDetail();
    const expectedImageId = getRelatedImages('y2k-main-001', { limit: 6 })[2].id;

    await wrapper.find('div.grid button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe(expectedImageId);
  });

  it('returns to the image spread page with the style group root id', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001');
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001');
  });

  it('returns sub-medium detail images to their medium spread entry', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001');
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001');
  });
});
