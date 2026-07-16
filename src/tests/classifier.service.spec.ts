import { describe, expect, it } from 'vitest';
import { classifyByCosineSimilarity } from '@/services/classifier.service';

describe('classifyByCosineSimilarity', () => {
  const anchors = [
    { label: 'A', embedding: [1, 0] },
    { label: 'B', embedding: [0, 1] },
    { label: 'C', embedding: [-1, 0] }
  ];

  it('回傳 cosine similarity 最高的 label', () => {
    expect(classifyByCosineSimilarity([0.9, 0.1], anchors)).toBe('A');
    expect(classifyByCosineSimilarity([0.1, 0.9], anchors)).toBe('B');
    expect(classifyByCosineSimilarity([-0.9, 0.1], anchors)).toBe('C');
  });

  it('沒有 anchors 時丟錯', () => {
    expect(() => classifyByCosineSimilarity([1, 0], [])).toThrow('No anchors available.');
  });
});
