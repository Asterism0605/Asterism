import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

// 只 mock 網路/重運算邊界（Supabase RPC + REST 查詢 + CLIP 推論）；useImageSearchStore →
// searchSimilarImages/fetchClassificationAnchors（真實 api，映射欄位）→ imageSearch.service
// 門檻邏輯（真實 domainGateScore/isRejected/isWeakMatch）整條串接都走真實實作，驗證是真的
// 接起來、不是靠 mock 撐過去。
const rpc = vi.fn();
const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => ({ rpc, from }) }));

const computeImageEmbeddingMock = vi.fn();
vi.mock('@/services/clipEmbedding.service', () => ({
  computeImageEmbedding: (...args: unknown[]) => computeImageEmbeddingMock(...args)
}));

import { useImageSearchStore } from '@/stores/imageSearch.store';

function makeFile(type = 'image/jpeg', size = 1024): File {
  return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

// 二維單位向量，跟 fakeEmbedding=[1,0,0]（第三維補 0）算 cosine 時第三維不影響結果，
// 用 x 分量直接湊出目標 gate 分數，跟 store 單元測試同一招。
const fakeEmbedding = [1, 0, 0];
function gateAnchorRow(score: number) {
  return { label: 'gate::Outfit', embedding: `[${score},${Math.sqrt(1 - score * score)},0]` };
}
const passingGateAnchors = [gateAnchorRow(1)];

describe('useImageSearchStore 整合測試（真實 api 映射 + 真實門檻邏輯）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    computeImageEmbeddingMock.mockResolvedValue(fakeEmbedding);
    eq.mockResolvedValue({ data: passingGateAnchors, error: null });
  });

  it('成功流程：Domain Gate 過、全庫 kNN 打真實 RPC，top-1 過門檻的結果留下', async () => {
    rpc.mockResolvedValue({
      data: [
        { id: 'a', url: 'https://img/a.jpg', title: 'A', style_group: 'Retro & Nostalgia', similarity: 0.9 },
        { id: 'b', url: 'https://img/b.jpg', title: 'B', style_group: 'Y2K & Internet Aesthetics', similarity: 0.8 }
      ],
      error: null
    });

    const search = useImageSearchStore();
    await search.search(makeFile());

    // 驗證真的查了 gate + styleGroup 兩種 anchor，且用全庫 kNN RPC 拉重排候選數
    expect(from).toHaveBeenCalledWith('classification_anchors');
    expect(eq).toHaveBeenCalledWith('dimension', 'gate');
    expect(eq).toHaveBeenCalledWith('dimension', 'styleGroup');
    expect(rpc).toHaveBeenCalledWith('search_similar_images', {
      query_embedding: fakeEmbedding,
      match_count: IMAGE_SEARCH_CONFIG.rerankCandidateCount
    });

    expect(search.status).toBe('success');
    expect(search.results).toEqual([
      { id: 'a', src: 'https://img/a.jpg', alt: 'A', styleGroup: 'Retro & Nostalgia', similarity: 0.9 },
      { id: 'b', src: 'https://img/b.jpg', alt: 'B', styleGroup: 'Y2K & Internet Aesthetics', similarity: 0.8 }
    ]);
  });

  it('無匹配流程：真實 Domain Gate 門檻把分數太低的圖判成 no-match，不打檢索 RPC', async () => {
    eq.mockResolvedValue({ data: [gateAnchorRow(IMAGE_SEARCH_CONFIG.domainGateThreshold - 0.1)], error: null });

    const search = useImageSearchStore();
    await search.search(makeFile());

    expect(search.status).toBe('no-match');
    expect(search.results).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
});
