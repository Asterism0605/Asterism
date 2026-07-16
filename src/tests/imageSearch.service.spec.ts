import { describe, expect, it } from 'vitest';
import { domainGateScore, isRejected, isWeakMatch, rerankByStyle, validateImageFile } from '@/services/imageSearch.service';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import type { ImageSearchResult } from '@/types/imageSearch';

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], 'photo.jpg', { type });
}

describe('validateImageFile', () => {
  it('接受 jpg/png/webp', () => {
    expect(validateImageFile(makeFile('image/jpeg', 1024))).toBeNull();
    expect(validateImageFile(makeFile('image/png', 1024))).toBeNull();
    expect(validateImageFile(makeFile('image/webp', 1024))).toBeNull();
  });

  it('拒絕非圖片格式', () => {
    expect(validateImageFile(makeFile('application/pdf', 1024))).toBe(
      'Please upload a JPG, PNG, or WebP image.'
    );
  });

  it('拒絕超過 10MB 的檔案', () => {
    expect(validateImageFile(makeFile('image/jpeg', 11 * 1024 * 1024))).toBe(
      'Image must be under 10MB.'
    );
  });

  it('拒絕 0 byte 的檔案', () => {
    expect(validateImageFile(makeFile('image/jpeg', 0))).toBe(
      'Please upload a JPG, PNG, or WebP image.'
    );
  });
});

describe('domainGateScore', () => {
  it('回傳跟所有 gate anchor 的最大 cosine', () => {
    const embedding = [1, 0];
    const gateAnchors = [
      { label: 'a::Outfit', embedding: [0, 1] }, // cosine 0
      { label: 'b::Outfit', embedding: [1, 0] }, // cosine 1
      { label: 'c::Outfit', embedding: [0.7, 0.7] } // cosine ~0.7
    ];
    expect(domainGateScore(embedding, gateAnchors)).toBeCloseTo(1);
  });
});

describe('isRejected', () => {
  it('gate 分數低於門檻 → 拒絕', () => {
    expect(isRejected(IMAGE_SEARCH_CONFIG.domainGateThreshold - 0.01)).toBe(true);
  });

  it('gate 分數達到門檻 → 不拒絕', () => {
    expect(isRejected(IMAGE_SEARCH_CONFIG.domainGateThreshold)).toBe(false);
  });
});

describe('rerankByStyle', () => {
  const makeResult = (id: string, styleGroup: string, similarity: number): ImageSearchResult => ({
    id,
    src: `${id}.jpg`,
    alt: id,
    styleGroup,
    similarity
  });

  it('查詢圖風格錨點分數高的 styleGroup 會被加權排到前面', () => {
    // 查詢圖 [1,0] 跟 earthy 錨點 cosine=1、跟 y2k 錨點 cosine=0
    const anchors = [
      { label: 'earthy', embedding: [1, 0] },
      { label: 'y2k', embedding: [0, 1] }
    ];
    const matches = [
      makeResult('a', 'y2k', 0.74),
      makeResult('b', 'earthy', 0.73) // sim 略低但風格對 → 重排後應在前
    ];
    const reranked = rerankByStyle([1, 0], matches, anchors);
    expect(reranked.map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('沒有對應錨點的 styleGroup 不加分、只比原始相似度，且結果截到 matchCount', () => {
    const matches = Array.from({ length: IMAGE_SEARCH_CONFIG.matchCount + 2 }, (_, i) =>
      makeResult(`m${i}`, 'unknown-group', 0.9 - i * 0.01)
    );
    const reranked = rerankByStyle([1, 0], matches, []);
    expect(reranked).toHaveLength(IMAGE_SEARCH_CONFIG.matchCount);
    expect(reranked[0].id).toBe('m0');
  });
});

describe('isWeakMatch', () => {
  it('top-1 低於 weak 門檻 → 弱相似（顯示提示）', () => {
    expect(isWeakMatch(IMAGE_SEARCH_CONFIG.weakMatchThreshold - 0.01)).toBe(true);
  });

  it('top-1 達到 weak 門檻 → 非弱相似', () => {
    expect(isWeakMatch(IMAGE_SEARCH_CONFIG.weakMatchThreshold)).toBe(false);
  });
});
