import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc }) }));

import { searchSimilarImages } from '@/api/imageSearch.api';

describe('imageSearch.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('呼叫全庫 kNN RPC 並映射結果為 camelCase', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'a',
          url: 'https://img/a.jpg',
          title: 'A',
          style_group: 'Retro & Nostalgia',
          similarity: 0.9
        }
      ],
      error: null
    });

    const results = await searchSimilarImages([1, 0], 4);

    expect(rpc).toHaveBeenCalledWith('search_similar_images', {
      query_embedding: [1, 0],
      match_count: 4
    });
    expect(results).toEqual([
      { id: 'a', src: 'https://img/a.jpg', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 }
    ]);
  });

  it('matchCount 預設為 4', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await searchSimilarImages([1, 0]);
    expect(rpc).toHaveBeenCalledWith(
      'search_similar_images',
      expect.objectContaining({ match_count: 4 })
    );
  });

  it('RPC 出錯 → throw', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'db error' } });
    await expect(searchSimilarImages([1, 0])).rejects.toBeTruthy();
  });
});
