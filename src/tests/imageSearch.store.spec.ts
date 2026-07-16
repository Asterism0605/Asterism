import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const computeEmbeddingMock = vi.fn();
vi.mock('@/stores/clipModel.store', () => ({
  useClipModelStore: () => ({ computeEmbedding: computeEmbeddingMock })
}));

const testAnchors = [{ label: 'Retro & Nostalgia', embedding: [1, 0] }];
vi.mock('@/stores/classificationAnchors.store', () => ({
  useClassificationAnchorsStore: () => ({ anchors: testAnchors })
}));

const classifyStyleGroupMock = vi.fn();
vi.mock('@/services/styleGroupClassifier.service', () => ({
  classifyStyleGroup: (...args: unknown[]) => classifyStyleGroupMock(...args)
}));

const searchImagesByEmbeddingMock = vi.fn();
vi.mock('@/api/imageSearch.api', () => ({
  searchImagesByEmbedding: (...args: unknown[]) => searchImagesByEmbeddingMock(...args)
}));

import { useImageSearchStore } from '@/stores/imageSearch.store';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

describe('useImageSearchStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it('檔案格式不對 → 不呼叫 embedding、直接進 error', async () => {
    const search = useImageSearchStore();

    await search.search(makeFile('application/pdf'));

    expect(computeEmbeddingMock).not.toHaveBeenCalled();
    expect(search.status).toBe('error');
    expect(search.error).toBe('Please upload a JPG, PNG, or WebP image.');
  });

  it('成功流程：算 embedding → 分類 styleGroup（帶入 useClassificationAnchorsStore 的錨點）→ 查詢 → 依門檻過濾', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    classifyStyleGroupMock.mockReturnValue('Retro & Nostalgia');
    searchImagesByEmbeddingMock.mockResolvedValue([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 },
      { id: 'b', src: 'u2', alt: 'B', styleGroup: 'Retro & Nostalgia', similarity: 0.4 }
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(classifyStyleGroupMock).toHaveBeenCalledWith([1, 0], testAnchors);
    expect(searchImagesByEmbeddingMock).toHaveBeenCalledWith([1, 0], 'Retro & Nostalgia');
    expect(search.status).toBe('success');
    expect(search.results).toEqual([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 }
    ]);
  });

  it('全部結果都低於門檻 → status 變 no-match', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    classifyStyleGroupMock.mockReturnValue('Retro & Nostalgia');
    searchImagesByEmbeddingMock.mockResolvedValue([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.2 }
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
  });

  it('embedding 運算失敗 → status 變 error', async () => {
    computeEmbeddingMock.mockRejectedValue(new Error('boom'));
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('error');
    expect(search.error).toBe('Search failed. Please try again later.');
  });

  it('連續呼叫兩次 search，第二次在第一次還在 searching 時會被擋下（重入防呆）', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    classifyStyleGroupMock.mockReturnValue('Retro & Nostalgia');
    searchImagesByEmbeddingMock.mockResolvedValue([]);
    const search = useImageSearchStore();

    const first = search.search(makeFile());
    const second = search.search(makeFile());
    await Promise.all([first, second]);

    expect(computeEmbeddingMock).toHaveBeenCalledTimes(1);
  });
});
