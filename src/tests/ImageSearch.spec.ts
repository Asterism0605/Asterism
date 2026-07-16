import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

const loadMock = vi.fn();
const clipModelState = {
  status: ref<'idle' | 'loading' | 'ready' | 'error'>('idle'),
  progress: ref(0),
  error: ref<string | null>(null)
};
vi.mock('@/composables/useClipModel', () => ({
  useClipModel: () => ({
    status: clipModelState.status,
    progress: clipModelState.progress,
    error: clipModelState.error,
    load: loadMock,
    computeEmbedding: vi.fn()
  })
}));

const searchMock = vi.fn();
const imageSearchState = {
  status: ref<'idle' | 'searching' | 'success' | 'no-match' | 'error'>('idle'),
  results: ref<{ id: string; src: string; alt: string; styleGroup: string; similarity: number }[]>(
    []
  ),
  error: ref<string | null>(null)
};
vi.mock('@/composables/useImageSearch', () => ({
  useImageSearch: () => ({
    status: imageSearchState.status,
    results: imageSearchState.results,
    error: imageSearchState.error,
    search: searchMock
  })
}));

import ImageSearch from '@/pages/ImageSearch.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'picture-detail', component: { template: '<div/>' } }]
});

async function mountImageSearch() {
  const wrapper = mount(ImageSearch, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

async function selectFile(wrapper: Awaited<ReturnType<typeof mountImageSearch>>) {
  const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
  const input = wrapper.find('[data-testid="image-file-input"]').element as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file] });
  await wrapper.find('[data-testid="image-file-input"]').trigger('change');
  return file;
}

describe('ImageSearch.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clipModelState.status.value = 'idle';
    clipModelState.progress.value = 0;
    clipModelState.error.value = null;
    imageSearchState.status.value = 'idle';
    imageSearchState.results.value = [];
    imageSearchState.error.value = null;
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('model 未就緒時顯示下載按鈕，隱藏搜尋面板', async () => {
    const wrapper = await mountImageSearch();
    expect(wrapper.find('[data-testid="model-gate"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="search-panel"]').exists()).toBe(false);
  });

  it('點下載按鈕呼叫 model.load()', async () => {
    const wrapper = await mountImageSearch();
    await wrapper.find('[data-testid="download-model-button"]').trigger('click');
    expect(loadMock).toHaveBeenCalled();
  });

  it('model loading 時顯示進度', async () => {
    clipModelState.status.value = 'loading';
    clipModelState.progress.value = 42;
    const wrapper = await mountImageSearch();
    expect(wrapper.find('[data-testid="model-progress"]').text()).toContain('42');
  });

  it('model progress 到 100 但還在 loading 時顯示「準備中」而非停在 100%', async () => {
    clipModelState.status.value = 'loading';
    clipModelState.progress.value = 100;
    const wrapper = await mountImageSearch();
    expect(wrapper.find('[data-testid="model-progress"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="model-finalizing"]').exists()).toBe(true);
  });

  it('model 下載失敗顯示錯誤訊息，點重試按鈕再次呼叫 load()', async () => {
    clipModelState.status.value = 'error';
    clipModelState.error.value = '模型下載失敗，請檢查網路連線後重試。';
    const wrapper = await mountImageSearch();

    expect(wrapper.find('[data-testid="model-error"]').text()).toBe('模型下載失敗，請檢查網路連線後重試。');
    await wrapper.find('[data-testid="download-model-button"]').trigger('click');
    expect(loadMock).toHaveBeenCalled();
  });

  it('model ready 後顯示搜尋面板，選檔前搜尋按鈕 disabled、還沒有中心預覽圖', async () => {
    clipModelState.status.value = 'ready';
    const wrapper = await mountImageSearch();

    expect(wrapper.find('[data-testid="search-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="search-button"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="search-preview-image"]').exists()).toBe(false);
  });

  it('選檔後顯示中心預覽圖（探索頁式版面），點搜尋呼叫 search()', async () => {
    clipModelState.status.value = 'ready';
    const wrapper = await mountImageSearch();
    const file = await selectFile(wrapper);

    expect(wrapper.find('[data-testid="search-preview-image"]').attributes('src')).toBe(
      'blob:mock-preview-url'
    );

    await wrapper.find('[data-testid="search-button"]').trigger('click');

    expect(searchMock).toHaveBeenCalledWith(file);
  });

  it('搜尋中顯示 spinner，搜尋按鈕維持 disabled', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'searching';
    const wrapper = await mountImageSearch();
    await selectFile(wrapper);

    expect(wrapper.find('[data-testid="search-spinner"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="search-button"]').attributes('disabled')).toBeDefined();
  });

  it('搜尋失敗顯示錯誤訊息', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'error';
    imageSearchState.error.value = '搜尋失敗，請稍後再試。';
    const wrapper = await mountImageSearch();
    await selectFile(wrapper);

    expect(wrapper.find('[data-testid="search-error"]').text()).toBe('搜尋失敗，請稍後再試。');
  });

  it('搜尋成功時，中心是使用者上傳的圖、四張結果卡片在周圍發散（桌機浮動群集 + 手機 2x2 網格）', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'success';
    imageSearchState.results.value = [
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.92 },
      { id: 'b', src: 'u2', alt: 'B', styleGroup: 'Retro & Nostalgia', similarity: 0.81 }
    ];
    const wrapper = await mountImageSearch();
    await selectFile(wrapper);

    // 中心：使用者上傳的圖，不是搜尋結果
    expect(wrapper.find('[data-testid="search-preview-image"]').attributes('src')).toBe(
      'blob:mock-preview-url'
    );
    // 桌機：重用 RelatedImageCluster（探索頁同一顆元件，內部固定 testid related-image-card）
    expect(wrapper.findAll('[data-testid="related-image-card"]')).toHaveLength(2);
    // 手機：2x2 網格 fallback
    expect(wrapper.findAll('[data-testid="search-result-card-mobile"]')).toHaveLength(2);
  });

  it('點桌機浮動群集裡的結果卡片會導到該圖片的詳情頁', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'success';
    imageSearchState.results.value = [
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.92 }
    ];
    const wrapper = await mountImageSearch();
    await selectFile(wrapper);
    const pushSpy = vi.spyOn(router, 'push');

    await wrapper.find('[data-testid="related-image-card"]').trigger('click');

    expect(pushSpy).toHaveBeenCalledWith({ name: 'picture-detail', params: { imageId: 'a' } });
  });

  it('無相似結果顯示空狀態', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'no-match';
    const wrapper = await mountImageSearch();
    await selectFile(wrapper);

    expect(wrapper.find('[data-testid="search-no-match"]').exists()).toBe(true);
  });
});
