import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

// 只 mock 網路邊界（Supabase RPC），classifyStyleGroup / meetsSimilarityThreshold /
// validateImageFile 全部走真實實作，驗證 useImageSearch → styleGroupClassifier →
// imageSearch.service 門檻邏輯這條串接是真的接起來、不是靠 mock 撐過去。
const rpc = vi.fn();
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc }) }));

import { useImageSearch } from '@/composables/useImageSearch';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

// 固定測試錨點：用某一組錨點自己的 embedding 當作 fake computeEmbedding 的輸出。
// cosine similarity 跟自己算一定是 1.0（理論最大值），所以真正的 classifyStyleGroup
// 一定會把它分類到這個錨點對應的 label，不會因浮點數誤差而不穩定。
const testAnchors = ref([
  { label: 'Retro & Nostalgia', embedding: [1, 0, 0] },
  { label: 'Y2K & Internet Aesthetics', embedding: [0, 1, 0] }
]);
const targetAnchor = testAnchors.value[0];
const fakeEmbedding = targetAnchor.embedding;
const expectedStyleGroup = targetAnchor.label;

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
          similarity: 0.3
        }
      ],
      error: null
    });

    const search = useImageSearch(computeEmbedding, testAnchors);
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

  it('無匹配流程：真實門檻邏輯會把低於 0.5 的結果全部濾掉', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'a',
          url: 'https://img/a.jpg',
          title: 'A',
          style_group: expectedStyleGroup,
          similarity: 0.4
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

    const search = useImageSearch(computeEmbedding, testAnchors);
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
