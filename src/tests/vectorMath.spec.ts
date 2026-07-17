import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from '@/utils/vectorMath';

describe('cosineSimilarity', () => {
  it('回傳 1 表示完全相同方向的向量', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1);
  });

  it('回傳 0 表示正交向量', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('回傳負值表示方向相反的向量', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1);
  });

  it('向量長度不同時丟錯', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have the same length.'
    );
  });

  it('零向量回傳 0（避免除以 0）', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});
