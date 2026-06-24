import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import PictureDetail from '@/pages/PictureDetail.vue';
import { saveImage } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';

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
  default: { template: '<div />' }
}));

async function mountPictureDetail(imageId = 'y2k-main-001') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/images/:imageId', name: 'picture-detail', component: PictureDetail }]
  });

  await router.push(`/images/${imageId}`);
  await router.isReady();

  const wrapper = mount(PictureDetail, { global: { plugins: [router] } });

  return { wrapper };
}

describe('PictureDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls saveImage with the current image when 儲存到既有資料夾 is clicked', async () => {
    const { wrapper } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('儲存到既有資料夾'));
    await saveBtn!.trigger('click');

    expect(saveImage).toHaveBeenCalledOnce();
    expect(saveImage).toHaveBeenCalledWith(expect.objectContaining({ id: 'y2k-main-001' }));
  });

  it('shows a success toast after saving', async () => {
    const { wrapper } = await mountPictureDetail();

    vi.useFakeTimers();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('儲存到既有資料夾'));
    await saveBtn!.trigger('click');

    await vi.runAllTimersAsync();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
});
