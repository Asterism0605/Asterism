/**
 * FloatingImageNetwork 的純 layout 計算工具。
 * 負責容器尺寸解析、d3-force 佈局運算、fallback 卡片與 constellation 尺寸推導，
 * 不依賴 Vue reactivity，方便獨立維護與測試。
 */
import { forceSimulation, forceCollide, forceCenter, forceManyBody, forceX, forceY } from 'd3-force';
import { applyAvoidAreas } from './avoidance';
import { LAYOUT_PRESETS, type LayoutPreset, type NodePosition } from './config';

export function resolveConfiguredHeight(rawHeight: string | undefined) {
  const resolvedHeight = rawHeight ?? '600px';

  if (resolvedHeight.endsWith('px')) {
    return Number.parseFloat(resolvedHeight);
  }

  if (resolvedHeight.endsWith('vh') && typeof window !== 'undefined') {
    return (window.innerHeight * Number.parseFloat(resolvedHeight)) / 100;
  }

  return 600;
}

export function resolveContainerSize(container: HTMLElement, height: string | undefined) {
  const bounds = container.getBoundingClientRect();
  const width =
    container.clientWidth ||
    bounds.width ||
    (typeof window !== 'undefined' ? window.innerWidth : 0) ||
    1200;
  const resolvedHeight = container.clientHeight || bounds.height || resolveConfiguredHeight(height);

  return {
    width,
    height: resolvedHeight
  };
}

export function resolveLayoutPreset(layout: 'auto' | 'home') {
  return LAYOUT_PRESETS[layout];
}

function getRandomPosition(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function computeEvenYPositions(
  count: number,
  height: number,
  random: () => number = Math.random
): number[] {
  const slot = height / count;

  return Array.from({ length: count }, (_, i) => (i + random()) * slot);
}

function buildLayoutNodes(count: number, width: number, height: number, preset: LayoutPreset) {
  const evenYs = preset.evenYDistribution ? computeEvenYPositions(count, height) : null;

  return Array.from({ length: count }, (_, i) => {
    const x = getRandomPosition(width * preset.randomX[0], width * preset.randomX[1]);
    const y = evenYs
      ? evenYs[i]
      : getRandomPosition(height * preset.randomY[0], height * preset.randomY[1]);
    return {
      x,
      y,
      width: preset.widths[i % preset.widths.length],
      aspect: preset.aspects[i % preset.aspects.length],
      constellationSize: preset.constellationSizes?.[i % preset.constellationSizes.length],
      targetX: evenYs ? x : undefined,
      targetY: evenYs ? y : undefined
    };
  });
}

function runLayoutSimulation(
  nodes: NodePosition[],
  width: number,
  height: number,
  preset: LayoutPreset
) {
  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(preset.chargeStrength))
    .force(
      'collide',
      forceCollide((node: NodePosition) => node.width * preset.collideMultiplier).strength(1)
    )
    .stop();

  if (preset.evenYDistribution) {
    // X 錨在每張自己的隨機初始位置（不是畫面中央），配合 charge 斥力 + collide
    // 把每 100vh 的卡片橫向隨機散開，而不是擠成中間一條直欄。
    simulation
      .force(
        'x',
        forceX((node: NodePosition) => node.targetX ?? width * preset.center[0]).strength(0.12)
      )
      .force(
        'y',
        forceY((node: NodePosition) => node.targetY ?? node.y).strength(0.12)
      );
  } else {
    simulation.force(
      'center',
      forceCenter(width * preset.center[0], height * preset.center[1]).strength(
        preset.centerStrength
      )
    );
  }

  for (let i = 0; i < preset.ticks; i++) simulation.tick();
}

export function buildFloatingImageLayout(
  count: number,
  width: number,
  height: number,
  preset: LayoutPreset
) {
  const nodes = buildLayoutNodes(count, width, height, preset);

  runLayoutSimulation(nodes, width, height, preset);

  const clampedNodes = nodes.map((node) => preset.clampPosition(node, width, height));
  const resolvedNodes = applyAvoidAreas(clampedNodes, width, height, preset.avoidAreas);

  return resolvedNodes.map((node) => preset.clampPosition(node, width, height));
}

export function getFallbackCard(layout: 'auto' | 'home') {
  const preset = resolveLayoutPreset(layout);

  return {
    x: 0,
    y: 0,
    width: preset.widths[0] ?? 160,
    aspect: preset.aspects[0] ?? '3/4',
    constellationSize: preset.constellationSizes?.[0]
  };
}

export function getConstellationSize(position: NodePosition | undefined) {
  return position?.constellationSize ?? Math.max(300, (position?.width ?? 160) * 2.2);
}
