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

  it('三層門檻都是合法機率值（0~1）', () => {
    // 原本假設「越細的層信心越低、門檻要越高」→ styleGroup < medium < subMedium，
    // 但實機 239 張顯示三層信心分布沒有這種固定順序（styleGroup 中位數 0.95 反而最高、
    // medium 0.74 最低），門檻應各自照自己的分布獨立校準，不該強加大小關係。
    for (const value of Object.values(THRESHOLDS)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
