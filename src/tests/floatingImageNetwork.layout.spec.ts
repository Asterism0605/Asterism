import { describe, expect, it } from 'vitest';
import {
  computeEvenYPositions,
  buildFloatingImageLayout
} from '@/components/sections/FloatingImageNetwork/layout';
import { LAYOUT_PRESETS } from '@/components/sections/FloatingImageNetwork/config';

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

describe('buildFloatingImageLayout (home)', () => {
  it('keeps nodes spread across the full height instead of clustering at the center', () => {
    const width = 1200;
    const height = 9000;
    const nodes = buildFloatingImageLayout(45, width, height, LAYOUT_PRESETS.home);

    const ys = nodes.map((n) => n.y);
    const span = Math.max(...ys) - Math.min(...ys);
    expect(span).toBeGreaterThan(height * 0.7);
  });

  it('scatters nodes horizontally across the width instead of a centered column', () => {
    const width = 1440;
    const height = 9000;
    const nodes = buildFloatingImageLayout(45, width, height, LAYOUT_PRESETS.home);

    const xs = nodes.map((n) => n.x);
    const inLeftThird = xs.filter((x) => x < width / 3).length;
    const inRightThird = xs.filter((x) => x > (width * 2) / 3).length;

    // 左右兩側都要有卡片，且整體橫向跨幅夠大（不是擠在中間一條直欄）
    expect(inLeftThird).toBeGreaterThan(0);
    expect(inRightThird).toBeGreaterThan(0);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(width * 0.5);
  });
});
