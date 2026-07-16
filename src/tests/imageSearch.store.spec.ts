import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

const computeEmbeddingMock = vi.fn();
vi.mock('@/stores/clipModel.store', () => ({
  useClipModelStore: () => ({ computeEmbedding: computeEmbeddingMock })
}));

const searchSimilarImagesMock = vi.fn();
vi.mock('@/api/imageSearch.api', () => ({
  searchSimilarImages: (...args: unknown[]) => searchSimilarImagesMock(...args)
}));

import { useImageSearchStore } from '@/stores/imageSearch.store';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

function makeResult(id: string, styleGroup: string, similarity: number) {
  return { id, src: `u-${id}`, alt: id, styleGroup, similarity };
}

const { retrievalRejectThreshold, weakMatchThreshold } = IMAGE_SEARCH_CONFIG;

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

  it('top-1 過門檻 → success，結果照 RPC 排序、weakMatch 為 false', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    searchSimilarImagesMock.mockResolvedValue([
      makeResult('a', 'Retro & Nostalgia', 0.9),
      makeResult('b', 'Y2K & Internet Aesthetics', 0.8)
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(searchSimilarImagesMock).toHaveBeenCalledWith([1, 0]);
    expect(search.status).toBe('success');
    expect(search.results.map((r) => r.id)).toEqual(['a', 'b']);
    expect(search.weakMatch).toBe(false);
  });

  it('top-1 低於 reject 門檻 → no-match、不留結果', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    searchSimilarImagesMock.mockResolvedValue([
      makeResult('a', 'Retro & Nostalgia', retrievalRejectThreshold - 0.05)
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
  });

  it('top-1 介於 reject 與 weak 之間 → success + weakMatch 提示', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    searchSimilarImagesMock.mockResolvedValue([
      makeResult('a', 'Retro & Nostalgia', (retrievalRejectThreshold + weakMatchThreshold) / 2)
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('success');
    expect(search.weakMatch).toBe(true);
  });

  it('RPC 回空陣列 → no-match', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    searchSimilarImagesMock.mockResolvedValue([]);
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
    searchSimilarImagesMock.mockResolvedValue([]);
    const search = useImageSearchStore();

    const first = search.search(makeFile());
    const second = search.search(makeFile());
    await Promise.all([first, second]);

    expect(computeEmbeddingMock).toHaveBeenCalledTimes(1);
  });
});
