import { describe, expect, it } from 'vitest';
import { computeEvenYPositions } from '@/components/sections/FloatingImageNetwork/layout';

describe('computeEvenYPositions', () => {
  it('spreads nodes evenly across the height, one per slot', () => {
    const height = 9000; // 900vh @ 1000px viewport
    const count = 45;
    const ys = computeEvenYPositions(count, height, () => 0.5);

    expect(ys).toHaveLength(count);
    expect(ys[0]).toBeCloseTo(100, 5);
    expect(ys[count - 1]).toBeCloseTo(height - 100, 5);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    }
    for (let band = 0; band < height / 1000; band++) {
      const inBand = ys.filter((y) => y >= band * 1000 && y < (band + 1) * 1000).length;
      expect(inBand).toBe(5);
    }
  });
});
