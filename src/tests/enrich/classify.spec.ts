import { describe, it, expect } from 'vitest';
import { classifyImage } from '../../../scripts/enrich/classify';
import type { Scorer, ScoredLabel } from '../../../scripts/enrich/scorer';
import { STYLE_GROUP_ANCHORS } from '../../../scripts/enrich/taxonomy';

// 假 scorer：依傳入的分數表回傳排序結果。
function fakeScorer(scoreMap: Record<string, number>): Scorer {
  return {
    async classify(_imageRef: string, labels: string[]): Promise<ScoredLabel[]> {
      return labels
        .map((label) => ({ label, score: scoreMap[label] ?? 0 }))
        .sort((a, b) => b.score - a.score);
    }
  };
}

const Y2K_PROMPT = STYLE_GROUP_ANCHORS['Y2K & Internet Aesthetics'];

describe('classifyImage', () => {
  it('挑出最高分 styleGroup，並把錨點文字對回 styleGroup 名稱', async () => {
    const scorer = fakeScorer({
      [Y2K_PROMPT]: 0.4,
      'Graphic Design': 0.5,
      'Poster Design': 0.6,
      McBling: 0.6
    });

    const result = await classifyImage(scorer, 'img');

    expect(result.styleGroup).toBe('Y2K & Internet Aesthetics');
    expect(result.confidence.styleGroup).toBe(0.4);
  });

  it('每個 medium 都強制給出 top-1 subMedium（不再有 null）', async () => {
    const graphic = fakeScorer({ [Y2K_PROMPT]: 0.4, 'Graphic Design': 0.5, 'Poster Design': 0.7 });
    const architecture = fakeScorer({ [Y2K_PROMPT]: 0.4, Architecture: 0.9, Facade: 0.8 });

    const a = await classifyImage(graphic, 'img');
    const b = await classifyImage(architecture, 'img');

    expect(a.medium).toBe('Graphic Design');
    expect(a.subMedium).toBe('Poster Design');
    // Architecture 以前沒有子類 → null；現在強制在 4 個候選裡挑 top-1
    expect(b.medium).toBe('Architecture');
    expect(b.subMedium).toBe('Facade');
    expect(typeof b.confidence.subMedium).toBe('number');
  });

  it('style[] 只在所選 styleGroup 的子風格詞庫裡比', async () => {
    const scorer = fakeScorer({
      [Y2K_PROMPT]: 0.4,
      'Graphic Design': 0.1,
      McBling: 0.9,
      Y2K: 0.8
    });

    const result = await classifyImage(scorer, 'img');

    expect(result.style).toContain('McBling');
    expect(result.style).not.toContain('Cyberpunk');
  });

  it('styleGroup/medium 低於門檻被標記 needsReview；subMedium 一律送審', async () => {
    const scorer = fakeScorer({ [Y2K_PROMPT]: 0.1, 'Graphic Design': 0.5, 'Poster Design': 0.7 });

    const result = await classifyImage(scorer, 'img');

    expect(result.needsReview.styleGroup).toBe(true);
    expect(result.needsReview.medium).toBe(false);
    // 強制猜出來的 subMedium 不論信心高低，一律標記人工待審
    expect(result.needsReview.subMedium).toBe(true);
  });
});
