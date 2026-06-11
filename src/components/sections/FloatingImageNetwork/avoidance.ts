import type { AvoidArea, NodePosition } from './config';

interface PixelRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function parseAspectRatio(aspect: string) {
  const [rawWidth, rawHeight] = aspect.split('/').map(Number);

  if (!rawWidth || !rawHeight) {
    return 3 / 4;
  }

  return rawWidth / rawHeight;
}

function getNodeHeight(node: NodePosition) {
  return node.width / parseAspectRatio(node.aspect);
}

function getNodeRect(node: NodePosition): PixelRect {
  const nodeHeight = getNodeHeight(node);

  return {
    left: node.x - node.width / 2,
    top: node.y - nodeHeight / 2,
    right: node.x + node.width / 2,
    bottom: node.y + nodeHeight / 2
  };
}

function getPixelAvoidArea(area: AvoidArea, width: number, height: number): PixelRect {
  return {
    left: area.left * width,
    top: area.top * height,
    right: area.right * width,
    bottom: area.bottom * height
  };
}

function shouldUseAvoidArea(area: AvoidArea, width: number) {
  return (
    (area.minWidth === undefined || width >= area.minWidth) &&
    (area.maxWidth === undefined || width <= area.maxWidth)
  );
}

function rectsOverlap(first: PixelRect, second: PixelRect) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

function clampCenter(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function moveNodeOutsideAvoidArea(
  node: NodePosition,
  area: AvoidArea,
  width: number,
  height: number
) {
  const avoidRect = getPixelAvoidArea(area, width, height);
  const nodeRect = getNodeRect(node);

  if (!rectsOverlap(nodeRect, avoidRect)) {
    return node;
  }

  const nodeHeight = getNodeHeight(node);
  const minX = node.width / 2;
  const maxX = width - node.width / 2;
  const minY = nodeHeight / 2;
  const maxY = height - nodeHeight / 2;
  const preferredCandidates = [
    { x: avoidRect.right + area.padding + node.width / 2, y: node.y },
    { x: node.x, y: avoidRect.bottom + area.padding + nodeHeight / 2 },
    { x: avoidRect.left - area.padding - node.width / 2, y: node.y },
    { x: node.x, y: avoidRect.top - area.padding - nodeHeight / 2 }
  ]
    .map((candidate) => ({
      x: clampCenter(candidate.x, minX, maxX),
      y: clampCenter(candidate.y, minY, maxY)
    }))
    .filter((candidate) => {
      const candidateRect = getNodeRect({ ...node, ...candidate });
      return !rectsOverlap(candidateRect, avoidRect);
    });

  const [bestCandidate] = preferredCandidates.sort((a, b) => {
    const distanceA = Math.hypot(a.x - node.x, a.y - node.y);
    const distanceB = Math.hypot(b.x - node.x, b.y - node.y);

    return distanceA - distanceB;
  });

  return bestCandidate ? { ...node, ...bestCandidate } : node;
}

export function applyAvoidAreas(
  nodes: NodePosition[],
  width: number,
  height: number,
  avoidAreas: AvoidArea[] | undefined
) {
  const activeAvoidAreas = avoidAreas?.filter((area) => shouldUseAvoidArea(area, width)) ?? [];

  if (!activeAvoidAreas.length) {
    return nodes;
  }

  return nodes.map((node) =>
    activeAvoidAreas.reduce(
      (currentNode, area) => moveNodeOutsideAvoidArea(currentNode, area, width, height),
      node
    )
  );
}
