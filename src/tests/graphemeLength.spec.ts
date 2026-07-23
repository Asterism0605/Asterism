import { describe, expect, it } from 'vitest';
import { graphemeLength } from '@/utils/graphemeLength';

describe('graphemeLength', () => {
  it('計算純英文字串的字數', () => {
    expect(graphemeLength('Studio')).toBe(6);
  });

  it('計算中英混合字串的字數', () => {
    expect(graphemeLength('我的 Studio')).toBe(9);
  });

  it('計算 surrogate pair emoji 的字數，不會被 UTF-16 code unit 數放大', () => {
    expect(graphemeLength('😀😀😀😀😀😀😀😀')).toBe(8);
  });

  it('計算組合字元（combining character）的字數，視為單一可見字元', () => {
    const decomposedE = 'é';
    expect(graphemeLength(decomposedE.repeat(3))).toBe(3);
  });

  it('空字串回傳 0', () => {
    expect(graphemeLength('')).toBe(0);
  });
});
