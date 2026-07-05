import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import ImageSpread from '@/pages/ImageSpread.vue';
import { getImageById } from '@/services/image.service';
import { addItem, createFolder } from '@/services/moodboard.service';
import { showToast } from '@/composables/useToast';
import { useMoodboardStore } from '@/stores/moodboard.store';
import { useAuthStore } from '@/stores/auth.store';
import type { MoodboardFolder, SavedImage } from '@/types/moodboard';

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
      { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } },
      { path: '/sign-up', name: 'sign-up', component: { template: '<div />' } }
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

let folderId: string;
const testFolder: MoodboardFolder = {
  id: 'folder-1',
  name: 'test',
  createdAt: '2026-07-05T00:00:00.000Z',
  images: []
};
const testSavedImage: SavedImage = {
  itemId: 'item-1',
  id: 'y2k-main-001',
  src: '/style-image/y2k-main-001.webp',
  title: 'Saved image',
  styleGroup: 'y2k',
  style: [],
  createdAt: '2026-07-05T00:00:00.000Z'
};

describe('ImageSpread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 代表圖選取已改為隨機（#94）；頁面不注入 rng、走 Math.random。
    // 固定成 0＝每組取資料序第一張（medium 入口圖），讓標籤/導航斷言維持決定性。
    vi.spyOn(Math, 'random').mockReturnValue(0);
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    authStore.user = {
      id: 'user-1',
      email: 'member@example.com',
      displayName: 'Member',
      isAdmin: false,
      createdAt: '2026-07-05T00:00:00.000Z'
    };
    const store = useMoodboardStore();
    store.$patch({ status: 'success', folders: [{ ...testFolder, images: [] }] });
    folderId = testFolder.id;
    vi.mocked(addItem).mockResolvedValue(testSavedImage);
    vi.mocked(createFolder).mockResolvedValue({ ...testFolder, id: 'new-folder-id', images: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('渲染中心圖片、操作按鈕與四張相關圖片', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image"]').attributes('src')).toContain(
      '/style-image/'
    );
    expect(wrapper.text()).toContain('Return');
    expect(wrapper.text()).toContain('ADD TO MOODBOARD');
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(4);
  });

  it('未登入點擊收藏時直接導向註冊頁且保留目前路徑', async () => {
    useAuthStore().user = null;
    const { wrapper, router } = await mountImageSpread();

    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ADD TO MOODBOARD'));
    await addButton!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('sign-up');
    expect(router.currentRoute.value.query.next).toBe('/images/y2k-main-001/spread');
    expect(addItem).not.toHaveBeenCalled();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('第一層相關圖片以 medium 標示標籤', async () => {
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

  it('第二層相關圖片以 subMedium 標示標籤', async () => {
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

  it('每個圖片區塊都標示為 cursor pointer', async () => {
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

  it('點擊第一張相關圖片後將其移到中心', async () => {
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

  it('主圖不顯示中心標籤，medium 入口圖片顯示標籤', async () => {
    const { wrapper } = await mountImageSpread();

    expect(wrapper.find('[data-testid="spread-main-image-label"]').exists()).toBe(false);

    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="spread-main-image-label"]').text()).toBe('Graphic Design');
  });

  it('點擊第二層相關圖片後導向未來的詳情頁', async () => {
    const { wrapper, router } = await mountImageSpread();
    const firstRelatedImage = wrapper.findAll('[data-testid="related-image-card"]')[0];

    await firstRelatedImage.trigger('click');
    await flushPromises();
    await wrapper.findAll('[data-testid="related-image-card"]')[0].trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('picture-detail');
    expect(router.currentRoute.value.params.imageId).toBeDefined();
  });

  it('點擊第一張相關圖片後可返回上一層 spread', async () => {
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

  it('從根層 spread 返回時導向首頁', async () => {
    const { wrapper, push } = await mountImageSpread();
    const back = vi.spyOn(wrapper.vm.$router, 'back');

    await wrapper.find('[data-testid="return-home"]').trigger('click');

    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({ name: 'home' });
  });

  it('從 medium spread 層返回根層，再返回首頁', async () => {
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

  it('未知圖片 id 顯示錯誤狀態', async () => {
    const { wrapper } = await mountImageSpread('missing-image');

    expect(wrapper.text()).toContain('Image not found');
    expect(wrapper.find('[data-testid="return-home"]').exists()).toBe(true);
  });

  it('當 addItem 拋出錯誤時顯示錯誤提示', async () => {
    vi.mocked(addItem).mockImplementationOnce(() => { throw new Error('save failed') });
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('儲存進行中時停用 ADD TO MOODBOARD，完成後重新啟用', async () => {
    let resolve!: (image: SavedImage) => void;
    vi.mocked(addItem).mockImplementationOnce(() => new Promise<SavedImage>((r) => { resolve = r; }));
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(true);

    resolve(testSavedImage);
    await flushPromises();

    expect((addBtn!.element as HTMLButtonElement).disabled).toBe(false);
    expect(addItem).toHaveBeenCalledOnce();
  });

  it('點擊 SAVE TO FOLDER 時以中心圖片 id 呼叫 addItem', async () => {
    const { wrapper } = await mountImageSpread();

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('ADD TO MOODBOARD'));
    await addBtn!.trigger('click');
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('SAVE TO FOLDER'));
    await saveBtn!.trigger('click');
    const folderBtn = wrapper.findAll('button').find((b) => b.text() === 'test');
    await folderBtn!.trigger('click');
    await flushPromises();

    expect(addItem).toHaveBeenCalledOnce();
    expect(addItem).toHaveBeenCalledWith(folderId, 'y2k-main-001');
  });

  it('送出 SAVE TO NEW FOLDER 時，以新資料夾 id 與目前圖片 id 呼叫 addItem', async () => {
    vi.mocked(createFolder).mockResolvedValueOnce({ ...testFolder, id: 'new-folder-id', images: [] });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread },
        { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }
      ]
    });
    router.push('/images/y2k-main-001/spread');
    await router.isReady();

    const wrapper = mount(ImageSpread, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { ConstellationBackground: true } }
    });

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!;

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
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

      expect(createFolder).toHaveBeenCalledWith('user-1', 'My Folder', [testFolder]);
      expect(addItem).toHaveBeenCalledWith('new-folder-id', 'y2k-main-001');
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('createFolder 成功但 addItem 失敗時顯示錯誤提示，且 modal 不關閉', async () => {
    vi.mocked(createFolder).mockResolvedValueOnce({ ...testFolder, id: 'new-folder-id', images: [] });
    vi.mocked(addItem).mockImplementationOnce(() => {
      throw new Error('save failed');
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread },
        { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }
      ]
    });
    router.push('/images/y2k-main-001/spread');
    await router.isReady();

    const wrapper = mount(ImageSpread, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { ConstellationBackground: true } }
    });

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!;

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
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

      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(document.querySelector('input')).not.toBeNull();
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  it('重開 SAVE TO NEW FOLDER modal 後 input 不再 disabled', async () => {
    vi.useFakeTimers();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/images/:imageId/spread', name: 'image-spread', component: ImageSpread },
        { path: '/images/:imageId', name: 'picture-detail', component: { template: '<div />' } }
      ]
    });
    router.push('/images/y2k-main-001/spread');
    await router.isReady();

    const wrapper = mount(ImageSpread, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { ConstellationBackground: true } }
    });

    try {
      const findBtn = (text: string) =>
        wrapper.findAll('button').find((b) => b.text().includes(text))!;

      await findBtn('ADD TO MOODBOARD').trigger('click');
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
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
      await findBtn('SAVE TO NEW FOLDER').trigger('click');
      await flushPromises();

      expect((document.querySelector('input') as HTMLInputElement).disabled).toBe(false);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });
});
