import { describe, it, expect } from 'vitest';
import {
  STYLE_GROUP_ANCHORS,
  STYLE_VOCAB_BY_GROUP,
  MEDIUM_LABELS,
  SUBMEDIUM_BY_MEDIUM,
  THRESHOLDS
} from '../../../scripts/enrich/taxonomy';

describe('taxonomy', () => {
  it('有 9 個 styleGroup 錨點', () => {
    expect(Object.keys(STYLE_GROUP_ANCHORS)).toHaveLength(9);
  });

  it('每個 styleGroup 都有對應的 style 候選詞', () => {
    for (const styleGroup of Object.keys(STYLE_GROUP_ANCHORS)) {
      expect(STYLE_VOCAB_BY_GROUP[styleGroup]).toBeDefined();
      expect(STYLE_VOCAB_BY_GROUP[styleGroup].length).toBeGreaterThan(0);
    }
  });

  it('SUBMEDIUM_BY_MEDIUM 的每個 key 必須是合法 medium', () => {
    for (const medium of Object.keys(SUBMEDIUM_BY_MEDIUM)) {
      expect(MEDIUM_LABELS).toContain(medium);
    }
  });

  it('門檻越細越嚴：styleGroup < medium < subMedium', () => {
    expect(THRESHOLDS.styleGroup).toBeLessThan(THRESHOLDS.medium);
    expect(THRESHOLDS.medium).toBeLessThan(THRESHOLDS.subMedium);
  });
});
