import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc }) }));

import { searchImagesByEmbedding } from '@/api/imageSearch.api';

describe('imageSearch.api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('呼叫 RPC 並映射結果為 camelCase', async () => {
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

    const results = await searchImagesByEmbedding([1, 0], 'Retro & Nostalgia', 4);

    expect(rpc).toHaveBeenCalledWith('search_images_by_embedding', {
      query_embedding: [1, 0],
      p_style_group: 'Retro & Nostalgia',
      match_count: 4
    });
    expect(results).toEqual([
      { id: 'a', src: 'https://img/a.jpg', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 }
    ]);
  });

  it('matchCount 預設為 4', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await searchImagesByEmbedding([1, 0], 'Retro & Nostalgia');
    expect(rpc).toHaveBeenCalledWith(
      'search_images_by_embedding',
      expect.objectContaining({ match_count: 4 })
    );
  });

  it('RPC 出錯 → throw', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'db error' } });
    await expect(searchImagesByEmbedding([1, 0], 'Retro & Nostalgia')).rejects.toBeTruthy();
  });
});
