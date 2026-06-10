/**
 * FloatingImageNetwork 的純 layout 計算工具。
 * 負責容器尺寸解析、d3-force 佈局運算、fallback 卡片與 constellation 尺寸推導，
 * 不依賴 Vue reactivity，方便獨立維護與測試。
 */
import { forceSimulation, forceCollide, forceCenter, forceManyBody } from 'd3-force';
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

function buildLayoutNodes(count: number, width: number, height: number, preset: LayoutPreset) {
  return Array.from({ length: count }, (_, i) => ({
    x: getRandomPosition(width * preset.randomX[0], width * preset.randomX[1]),
    y: getRandomPosition(height * preset.randomY[0], height * preset.randomY[1]),
    width: preset.widths[i % preset.widths.length],
    aspect: preset.aspects[i % preset.aspects.length],
    constellationSize: preset.constellationSizes?.[i % preset.constellationSizes.length]
  }));
}

function runLayoutSimulation(
  nodes: NodePosition[],
  width: number,
  height: number,
  preset: LayoutPreset
) {
  const simulation = forceSimulation(nodes)
    .force(
      'center',
      forceCenter(width * preset.center[0], height * preset.center[1]).strength(
        preset.centerStrength
      )
    )
    .force('charge', forceManyBody().strength(preset.chargeStrength))
    .force(
      'collide',
      forceCollide((node: NodePosition) => node.width * preset.collideMultiplier).strength(1)
    )
    .stop();

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

  return nodes.map((node) => preset.clampPosition(node, width, height));
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
