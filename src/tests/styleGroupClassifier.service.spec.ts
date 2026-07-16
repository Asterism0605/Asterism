import { describe, expect, it } from 'vitest';
import { classifyStyleGroup } from '@/services/styleGroupClassifier.service';

describe('classifyStyleGroup', () => {
  const anchors = [
    { label: 'A', embedding: [1, 0] },
    { label: 'B', embedding: [0, 1] },
    { label: 'C', embedding: [-1, 0] }
  ];

  it('回傳 cosine similarity 最高的 styleGroup', () => {
    expect(classifyStyleGroup([0.9, 0.1], anchors)).toBe('A');
    expect(classifyStyleGroup([0.1, 0.9], anchors)).toBe('B');
    expect(classifyStyleGroup([-0.9, 0.1], anchors)).toBe('C');
  });

  it('沒有 anchors 時丟錯（委派給共用的 classifyByCosineSimilarity）', () => {
    expect(() => classifyStyleGroup([1, 0], [])).toThrow('No anchors available.');
  });
});
