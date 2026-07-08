import { describe, expect, it, vi } from 'vitest';
import {
  computeEvenYPositions,
  buildFloatingImageLayout,
  HOME_MIN_GAP
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
    const nodes = buildFloatingImageLayout(45, width, height, LAYOUT_PRESETS.home, 900);

    const ys = nodes.map((n) => n.y);
    const span = Math.max(...ys) - Math.min(...ys);
    expect(span).toBeGreaterThan(height * 0.7);
  });

  it('scatters nodes horizontally across the width instead of a centered column', () => {
    const width = 1440;
    const height = 9000;
    const nodes = buildFloatingImageLayout(45, width, height, LAYOUT_PRESETS.home, 900);

    const xs = nodes.map((n) => n.x);
    const inLeftThird = xs.filter((x) => x < width / 3).length;
    const inRightThird = xs.filter((x) => x > (width * 2) / 3).length;

    // 左右兩側都要有卡片，且整體橫向跨幅夠大（不是擠在中間一條直欄）
    expect(inLeftThird).toBeGreaterThan(0);
    expect(inRightThird).toBeGreaterThan(0);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(width * 0.5);
  });

  it('uses each image real aspect ratio when provided (照原圖比例、不裁切)', () => {
    const aspects = Array.from({ length: 45 }, () => '1000/500');
    const nodes = buildFloatingImageLayout(45, 1440, 9000, LAYOUT_PRESETS.home, 900, aspects);

    expect(nodes.every((node) => node.aspect === '1000/500')).toBe(true);
  });

  it('does not overlap home cards with each other (合理尺寸 + 真實比例)', () => {
    // 測演算法本身不重疊：用合理寬度 + 多種真實圖片比例（直/橫/方）。
    // 不直接綁 LAYOUT_PRESETS.home 的 widths，因為那是視覺調校值（卡片越大越擠是密度取捨，非演算法問題）。
    const width = 1440;
    const height = 9000;
    const viewportHeight = 900;
    const preset = { ...LAYOUT_PRESETS.home, widths: [180, 260, 200, 240, 260, 210] };
    const aspects = Array.from({ length: 45 }, (_, i) =>
      ['1122/1402', '1536/1024', '3/4', '1402/1122', '4/3'][i % 5]
    );
    const nodes = buildFloatingImageLayout(45, width, height, preset, viewportHeight, aspects);

    expect(countOverlappingPairs(nodes)).toBe(0);
  });

  it('keeps a minimum gap between home cards (不只不重疊，視覺上一定分開)', () => {
    const width = 1440;
    const height = 9000;
    const viewportHeight = 900;
    const preset = { ...LAYOUT_PRESETS.home, widths: [180, 260, 200, 240, 260, 210] };
    const aspects = Array.from({ length: 45 }, (_, i) =>
      ['1122/1402', '1536/1024', '3/4', '1402/1122', '4/3'][i % 5]
    );
    const nodes = buildFloatingImageLayout(45, width, height, preset, viewportHeight, aspects);

    // 容 1px 浮點/夾邊界誤差
    expect(minPairGap(nodes)).toBeGreaterThanOrEqual(HOME_MIN_GAP - 1);
  });

  it('keeps home cards clear of the title area in the first viewport', () => {
    const width = 1440;
    const height = 9000;
    const viewportHeight = 900;
    // 合理尺寸 + 真實比例（測演算法的標題避讓，不綁視覺調校用的 widths）
    const preset = { ...LAYOUT_PRESETS.home, widths: [180, 260, 200, 240, 260, 210] };
    const aspects = Array.from({ length: 45 }, (_, i) =>
      ['1122/1402', '1536/1024', '3/4', '1402/1122', '4/3'][i % 5]
    );
    const nodes = buildFloatingImageLayout(45, width, height, preset, viewportHeight, aspects);

    // 標題在第一個 viewport 左側（桌機 avoid 區 ~0.28~0.64 viewport、左 0~0.62 寬）
    const titleBox = {
      left: 0,
      right: width * 0.5,
      top: viewportHeight * 0.28,
      bottom: viewportHeight * 0.64
    };
    const offenders = nodes.filter((node) => rectsOverlap(nodeRect(node), titleBox));

    expect(offenders).toHaveLength(0);
  });

  it('keeps a randomized home hero image to the right of the title without cropping', () => {
    const width = 1440;
    const height = 9000;
    const viewportHeight = 900;
    const aspects = Array.from({ length: 45 }, (_, i) =>
      ['1122/1402', '1536/1024', '3/4', '1402/1122', '4/3'][i % 5]
    );

    const lowRandom = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const firstLayout = buildFloatingImageLayout(
      45,
      width,
      height,
      LAYOUT_PRESETS.home,
      viewportHeight,
      aspects
    );
    lowRandom.mockRestore();

    const highRandom = vi.spyOn(Math, 'random').mockReturnValue(0.8);
    const secondLayout = buildFloatingImageLayout(
      45,
      width,
      height,
      LAYOUT_PRESETS.home,
      viewportHeight,
      aspects
    );
    highRandom.mockRestore();

    const firstHero = firstLayout[0];
    const secondHero = secondLayout[0];
    const firstRect = nodeRect(firstHero);
    const secondRect = nodeRect(secondHero);

    expect(firstHero.x).toBeGreaterThan(width * 0.62);
    expect(secondHero.x).toBeGreaterThan(width * 0.62);
    expect(firstRect.top).toBeGreaterThanOrEqual(0);
    expect(firstRect.bottom).toBeLessThanOrEqual(viewportHeight);
    expect(secondRect.top).toBeGreaterThanOrEqual(0);
    expect(secondRect.bottom).toBeLessThanOrEqual(viewportHeight);
    expect(secondHero.x).not.toBe(firstHero.x);
    expect(secondHero.y).not.toBe(firstHero.y);
  });
});

function nodeRect(node: { x: number; y: number; width: number; aspect: string }) {
  const [w, h] = node.aspect.split('/').map(Number);
  const aspectRatio = w && h ? w / h : 3 / 4;
  const nodeHeight = node.width / aspectRatio;
  return {
    left: node.x - node.width / 2,
    right: node.x + node.width / 2,
    top: node.y - nodeHeight / 2,
    bottom: node.y + nodeHeight / 2
  };
}

function rectsOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number }
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// 任兩張卡片之間的最小空隙（px）；重疊則為 0。
function minPairGap(nodes: { x: number; y: number; width: number; aspect: string }[]) {
  let min = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodeRect(nodes[i]);
      const b = nodeRect(nodes[j]);
      const gapX = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const gapY = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      min = Math.min(min, Math.hypot(gapX, gapY));
    }
  }
  return min;
}

// 容許 8px 以下的接觸（視覺看不出、且 floatY 動畫本來就會 ±6px 飄動），
// 只把「穿透超過 8px」視為真正的重疊。
function countOverlappingPairs(
  nodes: { x: number; y: number; width: number; aspect: string }[],
  tolerance = 8
) {
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodeRect(nodes[i]);
      const b = nodeRect(nodes[j]);
      const penetrationX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const penetrationY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (Math.min(penetrationX, penetrationY) > tolerance) {
        overlaps++;
      }
    }
  }
  return overlaps;
}
