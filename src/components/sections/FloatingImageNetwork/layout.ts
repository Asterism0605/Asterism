/**
 * FloatingImageNetwork 的純 layout 計算工具。
 * 負責容器尺寸解析、d3-force 佈局運算、fallback 卡片與 constellation 尺寸推導，
 * 不依賴 Vue reactivity，方便獨立維護與測試。
 */
import {
  forceSimulation,
  forceCollide,
  forceCenter,
  forceManyBody,
  forceX,
  forceY
} from 'd3-force';
import { applyAvoidAreas, getActiveAvoidRects, type PixelRect } from './avoidance';
import { LAYOUT_PRESETS, type LayoutPreset, type NodePosition } from './config';

// home 卡片之間保證的最小視覺間距（px）。不只「不重疊」，而是一定留出空隙。
// 取 16 是因為卡片有 floatY ±6px 飄動（兩張相向最多靠近 ~12px），靜態留 16 動畫時仍分得開。
export const HOME_MIN_GAP = 16;

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

function getNodeHeight(node: NodePosition) {
  const [rawWidth, rawHeight] = node.aspect.split('/').map(Number);
  const aspectRatio = rawWidth && rawHeight ? rawWidth / rawHeight : 3 / 4;

  return node.width / aspectRatio;
}

// home（均勻分帶）用卡片外接圓半徑當 collide 半徑——把卡片的「高」也算進去，
// 避免 3:4 直幅卡片只用寬度當半徑、垂直方向保護不足而疊在一起。
function collideRadius(node: NodePosition, preset: LayoutPreset) {
  if (preset.evenYDistribution) {
    return 0.5 * Math.hypot(node.width, getNodeHeight(node));
  }

  return node.width * preset.collideMultiplier;
}

export function computeEvenYPositions(
  count: number,
  height: number,
  random: () => number = Math.random,
  margin = 0
): number[] {
  const usable = height - 2 * margin;
  const slot = usable / count;

  return Array.from({ length: count }, (_, i) => margin + (i + random()) * slot);
}

function getPresetMaxHalfHeight(preset: LayoutPreset) {
  return Math.max(
    ...preset.widths.map((width, i) => {
      const [rawWidth, rawHeight] = preset.aspects[i % preset.aspects.length].split('/').map(Number);
      const aspectRatio = rawWidth && rawHeight ? rawWidth / rawHeight : 3 / 4;
      return width / aspectRatio / 2;
    })
  );
}

function buildLayoutNodes(
  count: number,
  width: number,
  height: number,
  preset: LayoutPreset,
  aspects?: (string | undefined)[]
) {
  // 均勻分帶從頂/底內縮一個卡片半高 + 緩衝，避免頭尾卡片被 clamp 擠在邊界疊在一起。
  const margin = preset.evenYDistribution ? getPresetMaxHalfHeight(preset) + 60 : 0;
  const evenYs = preset.evenYDistribution
    ? computeEvenYPositions(count, height, Math.random, margin)
    : null;

  return Array.from({ length: count }, (_, i) => {
    const x = getRandomPosition(width * preset.randomX[0], width * preset.randomX[1]);
    const y = evenYs
      ? evenYs[i]
      : getRandomPosition(height * preset.randomY[0], height * preset.randomY[1]);
    return {
      x,
      y,
      width: preset.widths[i % preset.widths.length],
      // 有提供圖片真實比例就用它（照原圖顯示、不裁切），否則退回 preset 預設比例
      aspect: aspects?.[i] ?? preset.aspects[i % preset.aspects.length],
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
    .force('collide', forceCollide((node: NodePosition) => collideRadius(node, preset)).strength(1))
    .stop();

  if (preset.evenYDistribution) {
    // X 錨在每張自己的隨機初始位置（不是畫面中央），配合 charge 斥力 + collide
    // 把每 100vh 的卡片橫向隨機散開，而不是擠成中間一條直欄。
    // 錨定力放鬆，讓 collide 有空間把重疊的卡片推開。
    simulation
      .force(
        'x',
        forceX((node: NodePosition) => node.targetX ?? width * preset.center[0]).strength(0.06)
      )
      .force('y', forceY((node: NodePosition) => node.targetY ?? node.y).strength(0.18));
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

function entersObstacle(node: NodePosition, dx: number, dy: number, obstacles: PixelRect[]) {
  const nodeHeight = getNodeHeight(node);
  const left = node.x + dx - node.width / 2;
  const right = node.x + dx + node.width / 2;
  const top = node.y + dy - nodeHeight / 2;
  const bottom = node.y + dy + nodeHeight / 2;

  return obstacles.some(
    (o) => left < o.right && right > o.left && top < o.bottom && bottom > o.top
  );
}

// 移動這張卡片是否會「撞進障礙物」或「被邊界 clamp 擋回」——兩者都視為推不動。
function moveBlocked(
  node: NodePosition,
  dx: number,
  dy: number,
  obstacles: PixelRect[],
  width: number,
  height: number
) {
  if (entersObstacle(node, dx, dy, obstacles)) {
    return true;
  }

  const nodeHeight = getNodeHeight(node);
  const newX = node.x + dx;
  const newY = node.y + dy;

  return (
    newX < node.width / 2 ||
    newX > width - node.width / 2 ||
    newY < nodeHeight / 2 ||
    newY > height - nodeHeight / 2
  );
}

// 把一對重疊卡片沿某軸分開總距離 distance；但「絕不把卡片推進障礙物或推出邊界」——
// 若某張往它的方向會被擋，就讓另一張全額讓開，藉此打破來回振盪 / 邊界卡死。
function separatePair(
  a: NodePosition,
  b: NodePosition,
  axis: 'x' | 'y',
  distance: number,
  obstacles: PixelRect[],
  width: number,
  height: number
) {
  const sign = (axis === 'x' ? b.x - a.x : b.y - a.y) < 0 ? -1 : 1;
  const aStep = -sign;
  const bStep = sign;
  const half = distance / 2;
  const aBlocked = moveBlocked(a, axis === 'x' ? aStep * half : 0, axis === 'y' ? aStep * half : 0, obstacles, width, height);
  const bBlocked = moveBlocked(b, axis === 'x' ? bStep * half : 0, axis === 'y' ? bStep * half : 0, obstacles, width, height);

  let aMove = half;
  let bMove = half;
  if (aBlocked && !bBlocked) {
    aMove = 0;
    bMove = distance;
  } else if (bBlocked && !aBlocked) {
    aMove = distance;
    bMove = 0;
  }

  if (axis === 'x') {
    a.x += aStep * aMove;
    b.x += bStep * bMove;
  } else {
    a.y += aStep * aMove;
    b.y += bStep * bMove;
  }
}

// 確定性鬆弛：把「卡片彼此不重疊」與「卡片避開標題」放在同一個迴圈解。
// 標題避讓區當成「不可移動的障礙物」——卡片只會被推出障礙物、不會被推進去，
// 兩兩重疊也沿最小軸推開且不推進障礙物。對稀疏版面幾輪就收斂。
function resolveOverlaps(
  nodes: NodePosition[],
  obstacles: PixelRect[],
  width: number,
  height: number,
  iterations = 400
): NodePosition[] {
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;

    // 卡片 vs 標題障礙物：只移動卡片，沿「離開障礙物最短的一邊」推出去
    for (const node of nodes) {
      const nodeHeight = getNodeHeight(node);

      for (const obstacle of obstacles) {
        const left = node.x - node.width / 2;
        const right = node.x + node.width / 2;
        const top = node.y - nodeHeight / 2;
        const bottom = node.y + nodeHeight / 2;

        if (
          left >= obstacle.right ||
          right <= obstacle.left ||
          top >= obstacle.bottom ||
          bottom <= obstacle.top
        ) {
          continue;
        }

        moved = true;

        const exits = [
          { axis: 'x' as const, delta: obstacle.left - right },
          { axis: 'x' as const, delta: obstacle.right - left },
          { axis: 'y' as const, delta: obstacle.top - bottom },
          { axis: 'y' as const, delta: obstacle.bottom - top }
        ];
        // 只考慮「推出去後（含邊界 clamp）真的逃出障礙物」的方向，
        // 避免把太高/太寬的卡片往空間不足的一側推、被 clamp 拉回又卡在障礙物裡。
        const escapable = exits.filter((exit) => {
          const nx =
            exit.axis === 'x'
              ? Math.max(node.width / 2, Math.min(width - node.width / 2, node.x + exit.delta))
              : node.x;
          const ny =
            exit.axis === 'y'
              ? Math.max(nodeHeight / 2, Math.min(height - nodeHeight / 2, node.y + exit.delta))
              : node.y;
          return (
            nx - node.width / 2 >= obstacle.right ||
            nx + node.width / 2 <= obstacle.left ||
            ny - nodeHeight / 2 >= obstacle.bottom ||
            ny + nodeHeight / 2 <= obstacle.top
          );
        });
        const candidates = escapable.length ? escapable : exits;
        const best = candidates.reduce((a, b) => (Math.abs(a.delta) <= Math.abs(b.delta) ? a : b));

        if (best.axis === 'x') {
          node.x += best.delta;
        } else {
          node.y += best.delta;
        }
      }
    }

    // 卡片 vs 卡片：沿最小重疊軸分開，且不推進障礙物
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        // 半寬/半高各灌上 HOME_MIN_GAP：兩張在兩軸都落在 gap 範圍內才算「太近」，
        // 沿最小軸推開後該軸間距即 ≥ HOME_MIN_GAP（不只是剛好不重疊）。
        const overlapX = (a.width + b.width) / 2 + HOME_MIN_GAP - Math.abs(b.x - a.x);
        const overlapY = (getNodeHeight(a) + getNodeHeight(b)) / 2 + HOME_MIN_GAP - Math.abs(b.y - a.y);

        if (overlapX <= 0 || overlapY <= 0) {
          continue;
        }

        moved = true;

        if (overlapX < overlapY) {
          separatePair(a, b, 'x', overlapX + 1, obstacles, width, height);
        } else {
          separatePair(a, b, 'y', overlapY + 1, obstacles, width, height);
        }
      }
    }

    // 每輪夾回邊界
    for (const node of nodes) {
      const nodeHeight = getNodeHeight(node);
      node.x = Math.max(node.width / 2, Math.min(width - node.width / 2, node.x));
      node.y = Math.max(nodeHeight / 2, Math.min(height - nodeHeight / 2, node.y));
    }

    if (!moved) {
      break;
    }
  }

  return nodes;
}

export function buildFloatingImageLayout(
  count: number,
  width: number,
  height: number,
  preset: LayoutPreset,
  viewportHeight: number = height,
  aspects?: (string | undefined)[]
) {
  const nodes = buildLayoutNodes(count, width, height, preset, aspects);

  runLayoutSimulation(nodes, width, height, preset);

  const clampedNodes = nodes.map((node) => preset.clampPosition(node, width, height));

  if (!preset.evenYDistribution) {
    // 非 home：沿用原本的避讓搬移
    const avoidedNodes = applyAvoidAreas(
      clampedNodes,
      width,
      height,
      preset.avoidAreas,
      viewportHeight
    );
    return avoidedNodes.map((node) => preset.clampPosition(node, width, height));
  }

  // home：把標題避讓區當不可移動障礙物，跟卡片去重疊一起鬆弛解，最後 clamp 進邊界。
  const obstacles = getActiveAvoidRects(preset.avoidAreas, width, height, viewportHeight);
  const resolved = resolveOverlaps(
    clampedNodes.map((node) => ({ ...node })),
    obstacles,
    width,
    height
  );

  return resolved.map((node) => ({
    ...node,
    x: Math.max(node.width / 2, Math.min(width - node.width / 2, node.x)),
    y: Math.max(getNodeHeight(node) / 2, Math.min(height - getNodeHeight(node) / 2, node.y))
  }));
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
