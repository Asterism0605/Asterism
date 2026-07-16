import { beforeEach, describe, expect, it, vi } from 'vitest';

const classifyStyleGroupMock = vi.fn();
vi.mock('@/services/styleGroupClassifier.service', () => ({
  classifyStyleGroup: (...args: unknown[]) => classifyStyleGroupMock(...args)
}));

const searchImagesByEmbeddingMock = vi.fn();
vi.mock('@/api/imageSearch.api', () => ({
  searchImagesByEmbedding: (...args: unknown[]) => searchImagesByEmbeddingMock(...args)
}));

import { useImageSearch } from '@/composables/useImageSearch';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

describe('useImageSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('檔案格式不對 → 不呼叫 embedding、直接進 error', async () => {
    const computeEmbedding = vi.fn();
    const search = useImageSearch(computeEmbedding);

    await search.search(makeFile('application/pdf'));

    expect(computeEmbedding).not.toHaveBeenCalled();
    expect(search.status.value).toBe('error');
    expect(search.error.value).toBe('請上傳 JPG、PNG 或 WebP 格式的圖片。');
  });

  it('成功流程：算 embedding → 分類 styleGroup → 查詢 → 依門檻過濾', async () => {
    const computeEmbedding = vi.fn().mockResolvedValue([1, 0]);
    classifyStyleGroupMock.mockReturnValue('Retro & Nostalgia');
    searchImagesByEmbeddingMock.mockResolvedValue([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 },
      { id: 'b', src: 'u2', alt: 'B', styleGroup: 'Retro & Nostalgia', similarity: 0.4 }
    ]);
    const search = useImageSearch(computeEmbedding);

    await search.search(makeFile());

    expect(classifyStyleGroupMock).toHaveBeenCalledWith([1, 0]);
    expect(searchImagesByEmbeddingMock).toHaveBeenCalledWith([1, 0], 'Retro & Nostalgia');
    expect(search.status.value).toBe('success');
    expect(search.results.value).toEqual([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 }
    ]);
  });

  it('全部結果都低於門檻 → status 變 no-match', async () => {
    const computeEmbedding = vi.fn().mockResolvedValue([1, 0]);
    classifyStyleGroupMock.mockReturnValue('Retro & Nostalgia');
    searchImagesByEmbeddingMock.mockResolvedValue([
      { id: 'a', src: 'u1', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.2 }
    ]);
    const search = useImageSearch(computeEmbedding);

    await search.search(makeFile());

    expect(search.status.value).toBe('no-match');
    expect(search.results.value).toEqual([]);
  });

  it('embedding 運算失敗 → status 變 error', async () => {
    const computeEmbedding = vi.fn().mockRejectedValue(new Error('boom'));
    const search = useImageSearch(computeEmbedding);

    await search.search(makeFile());

    expect(search.status.value).toBe('error');
    expect(search.error.value).toBe('搜尋失敗，請稍後再試。');
  });
});
