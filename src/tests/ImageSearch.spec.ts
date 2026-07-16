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

describe('ImageSearch.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clipModelState.status.value = 'idle';
    clipModelState.progress.value = 0;
    clipModelState.error.value = null;
    imageSearchState.status.value = 'idle';
    imageSearchState.results.value = [];
    imageSearchState.error.value = null;
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

  it('model ready 後顯示搜尋面板，選檔前搜尋按鈕 disabled', async () => {
    clipModelState.status.value = 'ready';
    const wrapper = await mountImageSearch();

    expect(wrapper.find('[data-testid="search-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="search-button"]').attributes('disabled')).toBeDefined();
  });

  it('選檔後點搜尋呼叫 search()', async () => {
    clipModelState.status.value = 'ready';
    const wrapper = await mountImageSearch();
    const file = new File([new Uint8Array(4)], 'a.jpg', { type: 'image/jpeg' });
    const input = wrapper.find('[data-testid="image-file-input"]').element as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    await wrapper.find('[data-testid="image-file-input"]').trigger('change');

    await wrapper.find('[data-testid="search-button"]').trigger('click');

    expect(searchMock).toHaveBeenCalledWith(file);
  });

  it('搜尋成功顯示結果卡片', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'success';
    imageSearchState.results.value = [
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 }
    ];
    const wrapper = await mountImageSearch();

    expect(wrapper.findAll('[data-testid="search-result-card"]')).toHaveLength(1);
  });

  it('無相似結果顯示空狀態', async () => {
    clipModelState.status.value = 'ready';
    imageSearchState.status.value = 'no-match';
    const wrapper = await mountImageSearch();

    expect(wrapper.find('[data-testid="search-no-match"]').exists()).toBe(true);
  });
});
