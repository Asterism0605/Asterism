<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
  size?: number | string;
  lineLength?: number;
  centerSize?: number;
  nodeSize?: number;
  active?: boolean;
  className?: string;
  spacing?: number;
  intensity?: number;
  lineWidth?: number;
  lineOpacity?: number;
  inactiveNodeOpacity?: number;
  activeNodeOpacity?: number;
  glowOpacity?: number;
  lineColor?: string;
  nodeColor?: string;
}

interface GridNode {
  x: number;
  y: number;
  distance: number;
  strength: number;
  active: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 220,
  lineLength: 150,
  centerSize: 4,
  nodeSize: 2,
  active: false,
  className: '',
  spacing: 36,
  intensity: 1,
  lineWidth: 1.4,
  lineOpacity: 0.72,
  inactiveNodeOpacity: 0.12,
  activeNodeOpacity: 0.72,
  glowOpacity: 0.12,
  lineColor: '',
  nodeColor: ''
});

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const normalizedSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size
);

const containerStyle = computed(() => ({
  width: normalizedSize.value,
  height: normalizedSize.value
}));

function normalizeCanvasColor(value: string, fallback: string) {
  if (!value.startsWith('#')) {
    return value;
  }

  const hex = value.slice(1);
  const normalizedHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : hex;

  if (normalizedHex.length !== 6) {
    return fallback;
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return fallback;
  }

  return `${red} ${green} ${blue}`;
}

function getCssColor(variableName: string, fallback: string) {
  if (!containerRef.value) {
    return fallback;
  }

  const value = getComputedStyle(containerRef.value).getPropertyValue(variableName).trim();
  return value ? normalizeCanvasColor(value, fallback) : fallback;
}

function clampOpacity(value: number) {
  return Math.min(1, Math.max(0, value));
}

function buildConstellationNodes({
  width,
  height,
  spacing,
  influenceRadius,
  focalPoint
}: {
  width: number;
  height: number;
  spacing: number;
  influenceRadius: number;
  focalPoint: { x: number; y: number };
}) {
  const nodes: GridNode[] = [];
  const offsetX = (width % spacing) / 2;
  const offsetY = (height % spacing) / 2;

  for (let x = offsetX; x <= width + 1; x += spacing) {
    for (let y = offsetY; y <= height + 1; y += spacing) {
      const dx = x - focalPoint.x;
      const dy = y - focalPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const strength = Math.max(0, 1 - distance / influenceRadius);

      nodes.push({
        x,
        y,
        distance,
        strength,
        active: strength > 0
      });
    }
  }

  return nodes;
}

function drawNetwork() {
  const canvas = canvasRef.value;
  const container = containerRef.value;

  if (!canvas || !container) {
    return;
  }

  const rect = container.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const nodeColor = props.nodeColor || getCssColor('--color-text-primary', '240 237 230');
  const lineColor = props.lineColor || getCssColor('--color-gold-dim', '168 137 58');
  const spacing = Math.max(18, props.spacing);
  const influenceRadius = Math.max(spacing * 2, props.lineLength);
  const focalPoint = {
    x: width / 2,
    y: height / 2
  };
  const nodes = buildConstellationNodes({
    width,
    height,
    spacing,
    influenceRadius,
    focalPoint
  });

  ctx.fillStyle = `rgb(${nodeColor} / ${clampOpacity(props.inactiveNodeOpacity)})`;
  nodes.forEach((node) => {
    if (node.active) {
      return;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, Math.max(0.8, props.nodeSize * 0.42), 0, Math.PI * 2);
    ctx.fill();
  });

  nodes.forEach((node) => {
    if (!node.active) {
      return;
    }

    const alpha = clampOpacity(node.strength * props.lineOpacity * props.intensity);
    ctx.strokeStyle = `rgb(${lineColor} / ${alpha})`;
    ctx.lineWidth = props.lineWidth;
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(focalPoint.x, focalPoint.y);
    ctx.stroke();
  });

  nodes.forEach((node) => {
    const radius = node.active
      ? Math.max(1, props.nodeSize * 0.52) + node.strength * props.nodeSize
      : Math.max(0.8, props.nodeSize * 0.42);
    const alpha = node.active
      ? clampOpacity((props.activeNodeOpacity + node.strength * 0.18) * props.intensity)
      : clampOpacity(props.inactiveNodeOpacity);

    ctx.fillStyle = `rgb(${nodeColor} / ${alpha})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const radialGradient = ctx.createRadialGradient(
    focalPoint.x,
    focalPoint.y,
    0,
    focalPoint.x,
    focalPoint.y,
    influenceRadius
  );

  radialGradient.addColorStop(
    0,
    `rgb(${lineColor} / ${clampOpacity(props.glowOpacity * props.intensity)})`
  );
  radialGradient.addColorStop(
    0.45,
    `rgb(${lineColor} / ${clampOpacity(props.glowOpacity * 0.35 * props.intensity)})`
  );
  radialGradient.addColorStop(1, `rgb(${lineColor} / 0)`);

  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = `rgb(${nodeColor} / ${clampOpacity(0.82 * props.intensity)})`;
  ctx.beginPath();
  ctx.arc(focalPoint.x, focalPoint.y, props.centerSize, 0, Math.PI * 2);
  ctx.fill();
}

function scheduleDraw() {
  void nextTick(() => {
    requestAnimationFrame(drawNetwork);
  });
}

onMounted(() => {
  scheduleDraw();

  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

watch(
  () => [
    props.size,
    props.lineLength,
    props.centerSize,
    props.nodeSize,
    props.spacing,
    props.intensity,
    props.lineWidth,
    props.lineOpacity,
    props.inactiveNodeOpacity,
    props.activeNodeOpacity,
    props.glowOpacity,
    props.lineColor,
    props.nodeColor
  ],
  scheduleDraw
);
</script>

<template>
  <div
    ref="containerRef"
    class="constellation-background pointer-events-none"
    :class="[{ 'is-active': active }, className]"
    :style="containerStyle"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="constellation-background__canvas" />
  </div>
</template>

<style scoped>
.constellation-background {
  opacity: 0;
  transition: opacity 520ms ease;
}

.constellation-background.is-active,
:global(.group:hover) .constellation-background,
:global(.group:focus-within) .constellation-background {
  opacity: 1;
}

.constellation-background__canvas {
  display: block;
  height: 100%;
  width: 100%;
  transform: scale(0.82);
  transform-origin: center;
  transition: transform 620ms cubic-bezier(0.2, 0.8, 0.2, 1);
  border-radius: 50%;
}

.constellation-background.is-active .constellation-background__canvas,
:global(.group:hover) .constellation-background .constellation-background__canvas,
:global(.group:focus-within) .constellation-background .constellation-background__canvas {
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .constellation-background,
  .constellation-background__canvas {
    transition-duration: 1ms;
  }
}
</style>
