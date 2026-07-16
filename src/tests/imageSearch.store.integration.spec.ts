import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

// 只 mock 網路/重運算邊界（Supabase RPC + CLIP 推論）；useImageSearchStore →
// searchSimilarImages（真實 api，映射欄位）→ imageSearch.service 門檻邏輯（真實 isRejected/
// isWeakMatch）整條串接都走真實實作，驗證是真的接起來、不是靠 mock 撐過去。
const rpc = vi.fn();
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc }) }));

const computeImageEmbeddingMock = vi.fn();
vi.mock('@/services/clipEmbedding.service', () => ({
  computeImageEmbedding: (...args: unknown[]) => computeImageEmbeddingMock(...args)
}));

import { useImageSearchStore } from '@/stores/imageSearch.store';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

const fakeEmbedding = [1, 0, 0];

describe('useImageSearchStore 整合測試（真實 api 映射 + 真實門檻邏輯）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    computeImageEmbeddingMock.mockResolvedValue(fakeEmbedding);
  });

  it('成功流程：全庫 kNN 打真實 RPC，top-1 過門檻的結果留下', async () => {
    rpc.mockResolvedValue({
      data: [
        { id: 'a', url: 'https://img/a.jpg', title: 'A', style_group: 'Retro & Nostalgia', similarity: 0.9 },
        { id: 'b', url: 'https://img/b.jpg', title: 'B', style_group: 'Y2K & Internet Aesthetics', similarity: 0.8 }
      ],
      error: null
    });

    const search = useImageSearchStore();
    await search.search(makeFile());

    // 驗證真的用全庫 kNN RPC（不帶 styleGroup），且 embedding 是真實算出的那個
    expect(rpc).toHaveBeenCalledWith('search_similar_images', {
      query_embedding: fakeEmbedding,
      match_count: 4
    });

    expect(search.status).toBe('success');
    expect(search.results).toEqual([
      { id: 'a', src: 'https://img/a.jpg', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 },
      { id: 'b', src: 'https://img/b.jpg', alt: 'B', styleGroup: 'Y2K & Internet Aesthetics', similarity: 0.8 }
    ]);
  });

  it('無匹配流程：真實 reject 門檻把 top-1 太低的結果判成 no-match', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'a',
          url: 'https://img/a.jpg',
          title: 'A',
          style_group: 'Retro & Nostalgia',
          similarity: IMAGE_SEARCH_CONFIG.retrievalRejectThreshold - 0.1
        }
      ],
      error: null
    });

    const search = useImageSearchStore();
    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
  });
});
