import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import PictureDetail from '@/pages/PictureDetail.vue';
import { getRelatedImages } from '@/services/image.service';
import { addItem } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth.store';
import { useMoodboardStore } from '@/stores/moodboard.store';

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

vi.mock('@/components/feature/image/ImageStagePanel.vue', () => ({
  default: {
    emits: ['select'],
    template:
      '<div data-test="image-stage-panel" @click="$emit(\'select\', \'stage-related-001\')" />'
  }
}));

const fakeUser = {
  id: 'user-1',
  email: 'member@example.com',
  displayName: 'Member',
  isAdmin: false,
  createdAt: '2026-01-01T00:00:00Z'
};

async function mountPictureDetail(
  imageId = 'y2k-main-001',
  isAuthenticated = true,
  query?: Record<string, string>
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
      { path: '/images/:imageId/spread', name: 'image-spread', component: { template: '<div />' } },
      { path: '/search-by-image', name: 'image-search', component: { template: '<div />' } },
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

  const moodboardStore = useMoodboardStore(pinia);
  moodboardStore.createFolder('test');
  const folderId = moodboardStore.folders[0].id;

  await router.push({ path: `/images/${imageId}`, query });
  await router.isReady();

  const wrapper = mount(PictureDetail, { global: { plugins: [router, pinia] } });

  return { router, wrapper, folderId };
}

describe('PictureDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('儲存進行中時停用 ADD TO MOODBOARD，完成後重新啟用', async () => {
    let resolve!: () => void;
    vi.mocked(addItem).mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        })
    );
    const { wrapper } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true);

    resolve();
    await flushPromises();

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(false);
    expect(addItem).toHaveBeenCalledOnce();
  });

  it('點擊 SAVE TO FOLDER 時以目前圖片 id 呼叫 addItem', async () => {
    const { wrapper, folderId } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');

    expect(addItem).toHaveBeenCalledOnce();
    expect(addItem).toHaveBeenCalledWith(folderId, 'y2k-main-001');
  });

  it('當 addItem 拋出錯誤時顯示錯誤提示', async () => {
    vi.mocked(addItem).mockImplementationOnce(() => {
      throw new Error('save failed');
    });
    const { wrapper } = await mountPictureDetail();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('點擊 consult 時帶著來源圖片 id 導向 consultant', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001');

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('consultant');
    expect(router.currentRoute.value.query.sourceImageId).toBe('rpl-interior-lighting-001');
  });

  it('routes unauthenticated consult clicks to sign-up with the consultant target', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001', false);

    const consultBtn = wrapper
      .findAll('button')
      .find((button) => button.text().includes('CONSULT STYLIST'));
    await consultBtn!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('sign-up');
    expect(router.currentRoute.value.query.next).toBe(
      '/consultant?sourceImageId=rpl-interior-lighting-001'
    );
  });

  it('導向選取的 stage 圖片詳情頁', async () => {
    const { router, wrapper } = await mountPictureDetail();

    await wrapper.find('[data-test="image-stage-panel"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe('stage-related-001');
  });

  it('導向選取的相似圖片詳情頁', async () => {
    const { router, wrapper } = await mountPictureDetail();
    const expectedImageId = getRelatedImages('y2k-main-001', { limit: 6 })[2].id;

    await wrapper.find('div.grid button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBe(expectedImageId);
  });

  it('帶著 style group 的 root id 回到 image spread 頁', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001');
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001');
  });

  it('將 sub-medium 詳情圖片返回其 medium spread 入口', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-lighting-001');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-spread');
    expect(router.currentRoute.value.params.imageId).toBe('rpl-interior-001');
    expect(router.currentRoute.value.query.rootId).toBe('rpl-main-001');
  });

  it('從以圖搜圖頁進來的詳情頁，返回鍵回以圖搜圖頁而不是探索頁', async () => {
    const { router, wrapper } = await mountPictureDetail('rpl-interior-001', true, {
      from: 'image-search'
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('image-search');
  });

  it('重開 CREATE NEW FOLDER modal 後 input 不再 disabled', async () => {
    vi.useFakeTimers();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/images/:imageId', name: 'picture-detail', component: PictureDetail },
        {
          path: '/images/:imageId/spread',
          name: 'image-spread',
          component: { template: '<div />' }
        },
        { path: '/consultant', name: 'consultant', component: { template: '<div />' } }
      ]
    });
    await router.push('/images/y2k-main-001');
    await router.isReady();

    const wrapper = mount(PictureDetail, {
      attachTo: document.body,
      global: { plugins: [router] }
    });

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!;

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('CREATE NEW FOLDER').trigger('click');
      await flushPromises();

      const input = document.querySelector('input') as HTMLInputElement;
      input.value = 'My Folder';
      input.dispatchEvent(new Event('input'));
      await flushPromises();

      const sendBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('SEND')
      ) as HTMLButtonElement;
      sendBtn.click();
      await flushPromises();
      vi.advanceTimersByTime(800);
      await flushPromises();

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('CREATE NEW FOLDER').trigger('click');
      await flushPromises();

      expect((document.querySelector('input') as HTMLInputElement).disabled).toBe(false);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });
});
