import { describe, it, expect } from 'vitest';
import { reclassifyRowSubMedium } from '../../../scripts/reclassifySubMedium';
import type { ExistingRow } from '../../../scripts/reclassifySubMedium';
import type { Scorer, ScoredLabel } from '../../../scripts/enrich/scorer';

// 假 scorer：依分數表回傳排序結果（與 classify.spec 同套路）。
function fakeScorer(scoreMap: Record<string, number>): Scorer {
  return {
    async classify(_imageRef: string, labels: string[]): Promise<ScoredLabel[]> {
      return labels
        .map((label) => ({ label, score: scoreMap[label] ?? 0 }))
        .sort((a, b) => b.score - a.score);
    }
  };
}

const baseRow: ExistingRow = {
  id: 'ext-pexels-1',
  url: 'https://img/1.jpg',
  medium: 'Outfit',
  confidence: { styleGroup: 0.9, medium: 0.7, subMedium: null },
  needsReview: { styleGroup: false, medium: false, subMedium: false }
};

describe('reclassifyRowSubMedium', () => {
  it('挑出 medium 候選裡的 top-1，並合併進既有 JSONB（保留其他欄位）', async () => {
    const scorer = fakeScorer({ Top: 0.2, Bottom: 0.6, Dress: 0.3, Accessory: 0.1 });

    const update = await reclassifyRowSubMedium(scorer, baseRow);

    expect(update).not.toBeNull();
    expect(update?.subMedium).toBe('Bottom');
    // 合併：subMedium 被覆寫，styleGroup/medium 原樣保留
    expect(update?.confidence).toEqual({ styleGroup: 0.9, medium: 0.7, subMedium: 0.6 });
  });

  it('subMedium 一律標記待審，且不動其他層的 needs_review', async () => {
    const scorer = fakeScorer({ Top: 0.99 });
    const row: ExistingRow = {
      ...baseRow,
      needsReview: { styleGroup: true, medium: false, subMedium: false }
    };

    const update = await reclassifyRowSubMedium(scorer, row);

    expect(update?.needsReview).toEqual({ styleGroup: true, medium: false, subMedium: true });
  });

  it('缺 medium 時回 null（呼叫端略過）', async () => {
    const update = await reclassifyRowSubMedium(fakeScorer({}), { ...baseRow, medium: null });

    expect(update).toBeNull();
  });

  it('medium 不在候選表時回 null', async () => {
    const update = await reclassifyRowSubMedium(fakeScorer({}), {
      ...baseRow,
      medium: 'Sculpture'
    });

    expect(update).toBeNull();
  });
});
