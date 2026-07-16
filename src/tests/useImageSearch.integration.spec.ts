import { beforeEach, describe, expect, it, vi } from 'vitest';

// 只 mock 網路邊界（Supabase RPC），classifyStyleGroup / meetsSimilarityThreshold /
// validateImageFile 全部走真實實作，驗證 useImageSearch → styleGroupClassifier →
// imageSearch.service 門檻邏輯這條串接是真的接起來、不是靠 mock 撐過去。
const rpc = vi.fn();
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc }) }));

import { useImageSearch } from '@/composables/useImageSearch';
import { STYLE_GROUP_ANCHOR_EMBEDDINGS } from '@/data/styleGroupAnchorEmbeddings';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

// 直接拿某個錨點的真實 embedding 當作 fake computeEmbedding 的輸出。
// cosine similarity 跟自己算一定是 1.0（理論最大值），所以真正的 classifyStyleGroup
// 一定會把它分類到這個錨點對應的 styleGroup，不會因浮點數誤差而不穩定。
const targetAnchor = STYLE_GROUP_ANCHOR_EMBEDDINGS[0];
const fakeEmbedding = targetAnchor.embedding;
const expectedStyleGroup = targetAnchor.styleGroup;

async function computeEmbedding(): Promise<number[]> {
  return fakeEmbedding;
}

describe('useImageSearch 整合測試（真實 classifyStyleGroup + 真實門檻邏輯）', () => {
  beforeEach(() => vi.clearAllMocks());

  it('成功流程：真實分類出的 styleGroup 會被拿去查詢，高於門檻的結果留下', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'a',
          url: 'https://img/a.jpg',
          title: 'A',
          style_group: expectedStyleGroup,
          similarity: 0.9
        },
        {
          id: 'b',
          url: 'https://img/b.jpg',
          title: 'B',
          style_group: expectedStyleGroup,
          similarity: 0.5
        }
      ],
      error: null
    });

    const search = useImageSearch(computeEmbedding);
    await search.search(makeFile());

    // 驗證真的用「真實分類器算出來的 styleGroup」去打 RPC，而不是隨便帶一個字串
    expect(rpc).toHaveBeenCalledWith('search_images_by_embedding', {
      query_embedding: fakeEmbedding,
      p_style_group: expectedStyleGroup,
      match_count: 4
    });

    expect(search.status.value).toBe('success');
    expect(search.results.value).toEqual([
      { id: 'a', src: 'https://img/a.jpg', alt: 'A', styleGroup: expectedStyleGroup, similarity: 0.9 }
    ]);
  });

  it('無匹配流程：真實門檻邏輯會把低於 0.75 的結果全部濾掉', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'a',
          url: 'https://img/a.jpg',
          title: 'A',
          style_group: expectedStyleGroup,
          similarity: 0.6
        },
        {
          id: 'b',
          url: 'https://img/b.jpg',
          title: 'B',
          style_group: expectedStyleGroup,
          similarity: 0.1
        }
      ],
      error: null
    });

    const search = useImageSearch(computeEmbedding);
    await search.search(makeFile());

    expect(rpc).toHaveBeenCalledWith('search_images_by_embedding', {
      query_embedding: fakeEmbedding,
      p_style_group: expectedStyleGroup,
      match_count: 4
    });

    expect(search.status.value).toBe('no-match');
    expect(search.results.value).toEqual([]);
  });
});
