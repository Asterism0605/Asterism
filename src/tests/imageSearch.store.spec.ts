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

const fetchClassificationAnchorsMock = vi.fn();
vi.mock('@/api/classificationAnchors.api', () => ({
  fetchClassificationAnchors: (...args: unknown[]) => fetchClassificationAnchorsMock(...args)
}));

import { useImageSearchStore } from '@/stores/imageSearch.store';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

function makeResult(id: string, styleGroup: string, similarity: number) {
  return { id, src: `u-${id}`, alt: id, styleGroup, similarity };
}

const { domainGateThreshold, weakMatchThreshold } = IMAGE_SEARCH_CONFIG;
// embedding=[1,0]、anchor=[1,0] → cosine 剛好 1（過任何門檻）；用比例縮放 anchor 的
// x 分量湊出目標分數（兩個二維單位向量的 cosine 就是 x 分量本身，計算單純好推）。
const passingAnchors = [{ label: 'gate::Outfit', embedding: [1, 0] }];
function anchorsScoring(score: number) {
  return [{ label: 'gate::Outfit', embedding: [score, Math.sqrt(1 - score * score)] }];
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

  it('Domain Gate 過、top-1 過 weak 門檻 → success，結果照 RPC 排序、weakMatch 為 false', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    searchSimilarImagesMock.mockResolvedValue([
      makeResult('a', 'Retro & Nostalgia', 0.9),
      makeResult('b', 'Y2K & Internet Aesthetics', 0.8)
    ]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledWith('gate');
    expect(fetchClassificationAnchorsMock).toHaveBeenCalledWith('styleGroup');
    expect(searchSimilarImagesMock).toHaveBeenCalledWith([1, 0], IMAGE_SEARCH_CONFIG.rerankCandidateCount);
    expect(search.status).toBe('success');
    expect(search.results.map((r) => r.id)).toEqual(['a', 'b']);
    expect(search.weakMatch).toBe(false);
  });

  it('Domain Gate 分數低於門檻 → no-match、不留結果、不打檢索 RPC', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(anchorsScoring(domainGateThreshold - 0.05));
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
    expect(searchSimilarImagesMock).not.toHaveBeenCalled();
  });

  it('Domain Gate 過、top-1 低於 weak 門檻 → success + weakMatch 提示（照樣給最像的）', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    searchSimilarImagesMock.mockResolvedValue([makeResult('a', 'Retro & Nostalgia', weakMatchThreshold - 0.2)]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('success');
    expect(search.results).toHaveLength(1);
    expect(search.weakMatch).toBe(true);
  });

  it('Domain Gate 過、RPC 回空陣列 → no-match', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    searchSimilarImagesMock.mockResolvedValue([]);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
  });

  it('embedding 運算失敗 → status 變 error', async () => {
    computeEmbeddingMock.mockRejectedValue(new Error('boom'));
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    const search = useImageSearchStore();

    await search.search(makeFile());

    expect(search.status).toBe('error');
    expect(search.error).toBe('Search failed. Please try again later.');
  });

  it('gate/styleGroup anchor 各只抓一次，第二次 search 重用快取', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    searchSimilarImagesMock.mockResolvedValue([]);
    const search = useImageSearchStore();

    await search.search(makeFile());
    await search.search(makeFile());

    expect(fetchClassificationAnchorsMock).toHaveBeenCalledTimes(2);
  });

  it('連續呼叫兩次 search，第二次在第一次還在 searching 時會被擋下（重入防呆）', async () => {
    computeEmbeddingMock.mockResolvedValue([1, 0]);
    fetchClassificationAnchorsMock.mockResolvedValue(passingAnchors);
    searchSimilarImagesMock.mockResolvedValue([]);
    const search = useImageSearchStore();

    const first = search.search(makeFile());
    const second = search.search(makeFile());
    await Promise.all([first, second]);

    expect(computeEmbeddingMock).toHaveBeenCalledTimes(1);
  });
});
