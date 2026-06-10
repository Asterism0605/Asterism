<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { forceSimulation, forceCollide, forceCenter, forceManyBody } from 'd3-force';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';

interface ImageItem {
  src: string;
  alt?: string;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  aspect: string;
  left?: string;
  top?: string;
  constellationSize?: number;
}

const props = defineProps<{
  images: ImageItem[];
  height?: string;
  layout?: 'auto' | 'home';
  showConstellations?: boolean;
}>();

const emit = defineEmits<{
  click: [index: number];
}>();

const MAX_IMAGES = 6;
const CARD_WIDTHS = [130, 150, 160, 170, 200, 210];
const CARD_ASPECTS = ['3/4', '3/4', '3/4', '3/4', '4/3', '4/3'];
const HOME_CARD_WIDTHS = [112, 320, 118, 164, 232, 136];
const HOME_CARD_ASPECTS = ['3/4', '16/10', '3/4', '3/4', '4/3', '3/4'];
const HOME_CONSTELLATION_SIZES = [300, 360, 420, 440, 340, 320];

const containerRef = ref<HTMLElement | null>(null);
const autoPositions = ref<NodePosition[]>([]);
const homePositions = ref<NodePosition[]>([]);
const hoveredIndex = ref<number | null>(null);
const visibleImages = computed(() => props.images.slice(0, MAX_IMAGES));
const isHomeLayout = computed(() => props.layout === 'home');
const renderPositions = computed(() =>
  isHomeLayout.value ? homePositions.value : autoPositions.value
);

function getRandomPosition(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function resolveConfiguredHeight() {
  const rawHeight = props.height ?? '600px';

  if (rawHeight.endsWith('px')) {
    return Number.parseFloat(rawHeight);
  }

  if (rawHeight.endsWith('vh') && typeof window !== 'undefined') {
    return (window.innerHeight * Number.parseFloat(rawHeight)) / 100;
  }

  return 600;
}

function resolveContainerSize(container: HTMLElement) {
  const bounds = container.getBoundingClientRect();
  const width =
    container.clientWidth ||
    bounds.width ||
    (typeof window !== 'undefined' ? window.innerWidth : 0) ||
    1200;
  const height = container.clientHeight || bounds.height || resolveConfiguredHeight();

  return {
    width,
    height
  };
}

function buildAutoLayout(width: number, height: number) {
  const nodes: NodePosition[] = visibleImages.value.map((_, i) => ({
    x: getRandomPosition(width * 0.2, width * 0.8),
    y: getRandomPosition(height * 0.2, height * 0.8),
    width: CARD_WIDTHS[i % CARD_WIDTHS.length],
    aspect: CARD_ASPECTS[i % CARD_ASPECTS.length]
  }));

  const sim = forceSimulation(nodes)
    .force('center', forceCenter(width / 2, height / 2).strength(0.3))
    .force('charge', forceManyBody().strength(-60))
    .force('collide', forceCollide((node: NodePosition) => node.width * 0.65).strength(1))
    .stop();

  for (let i = 0; i < 200; i++) sim.tick();

  return nodes.map((n) => ({
    x: Math.max(n.width / 2, Math.min(width - n.width, n.x - n.width / 2)),
    y: Math.max(0, Math.min(height - 80, n.y - 80)),
    width: n.width,
    aspect: n.aspect
  }));
}

function buildHomeLayout(width: number, height: number) {
  const nodes: NodePosition[] = visibleImages.value.map((_, i) => ({
    x: getRandomPosition(width * 0.14, width * 0.86),
    y: getRandomPosition(height * 0.12, height * 0.78),
    width: HOME_CARD_WIDTHS[i % HOME_CARD_WIDTHS.length],
    aspect: HOME_CARD_ASPECTS[i % HOME_CARD_ASPECTS.length],
    constellationSize: HOME_CONSTELLATION_SIZES[i % HOME_CONSTELLATION_SIZES.length]
  }));

  const sim = forceSimulation(nodes)
    .force('center', forceCenter(width / 2, height * 0.42).strength(0.22))
    .force('charge', forceManyBody().strength(-90))
    .force('collide', forceCollide((node: NodePosition) => node.width * 0.72).strength(1))
    .stop();

  for (let i = 0; i < 240; i++) sim.tick();

  return nodes.map((n) => ({
    x: Math.max(n.width / 2, Math.min(width - n.width / 2, n.x)),
    y: Math.max(80, Math.min(height - 120, n.y)),
    width: n.width,
    aspect: n.aspect,
    constellationSize: n.constellationSize
  }));
}

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  const { width, height } = resolveContainerSize(container);

  if (isHomeLayout.value) {
    homePositions.value = buildHomeLayout(width, height);
    return;
  }

  autoPositions.value = buildAutoLayout(width, height);
});

const AMBIENT_DOTS = [
  { left: '35%', top: '8%' },
  { left: '49%', top: '13%' },
  { left: '62%', top: '6%' },
  { left: '75%', top: '2%' },
  { left: '87%', top: '9%' },
  { left: '94%', top: '3%' },
  { left: '43%', top: '33%' },
  { left: '50%', top: '58%' },
  { left: '85%', top: '58%' },
  { left: '90%', top: '80%' },
  { left: '20%', top: '83%' },
  { left: '32%', top: '80%' },
  { left: '65%', top: '25%' },
  { left: '82%', top: '33%' }
] as const;

function getCardStyle(position: NodePosition | undefined, index: number) {
  const fallback: NodePosition = {
    x: 0,
    y: 0,
    width: 160,
    aspect: '3/4'
  };
  const item = position ?? fallback;

  return {
    left: item.left ?? `${item.x}px`,
    top: item.top ?? `${item.y}px`,
    width: `${item.width}px`,
    zIndex: 2,
    '--float-delay': `${index * 0.8}s`,
    opacity: renderPositions.value.length ? 1 : 0
  };
}

function activateCard(index: number) {
  hoveredIndex.value = index;
}

function deactivateCard(index: number) {
  if (hoveredIndex.value === index) {
    hoveredIndex.value = null;
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-hidden"
    :style="{ height: props.height ?? '600px' }"
  >
    <!-- Ambient dots -->
    <div
      v-for="(dot, i) in AMBIENT_DOTS"
      :key="`dot-${i}`"
      data-testid="ambient-dot"
      class="absolute rounded-full pointer-events-none"
      :style="{
        left: dot.left,
        top: dot.top,
        width: '4px',
        height: '4px',
        background: 'rgba(240,237,230,0.35)',
        transform: 'translate(-50%, -50%)',
        zIndex: 0
      }"
    />

    <!-- Image cards -->
    <div
      v-for="(image, i) in visibleImages"
      :key="`${i}-${image.src}`"
      data-testid="image-card"
      class="group image-card absolute cursor-pointer"
      :class="{ 'image-card--home': isHomeLayout }"
      :style="getCardStyle(renderPositions[i], i)"
      tabindex="0"
      @mouseenter="activateCard(i)"
      @mouseleave="deactivateCard(i)"
      @focusin="activateCard(i)"
      @focusout="deactivateCard(i)"
      @click="emit('click', i)"
    >
      <ConstellationBackground
        v-if="showConstellations"
        data-testid="image-constellation"
        class-name="image-card__constellation absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
        :active="hoveredIndex === i"
        :size="
          renderPositions[i]?.constellationSize ??
          Math.max(300, (renderPositions[i]?.width ?? 160) * 2.2)
        "
        :line-length="
          Math.max(
            190,
            (renderPositions[i]?.constellationSize ?? (renderPositions[i]?.width ?? 160) * 2.2) *
              0.42
          )
        "
        :line-width="1.35"
        :line-opacity="0.74"
        :glow-opacity="0.08"
        :node-size="3.8"
        :spacing="52"
      />
      <div class="image-card__float relative z-10">
        <div class="image-card__frame">
          <img
            :src="image.src"
            :alt="image.alt ?? ''"
            class="w-full"
            :style="`aspect-ratio: ${renderPositions[i]?.aspect ?? '3/4'}; object-fit: cover; display: block; border-radius: 4px;`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes floatY {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

.image-card {
  overflow: visible;
  transform-origin: center;
  transition:
    scale 0.3s ease,
    border-color 0.3s ease,
    opacity 0.4s ease;
}

.image-card--home {
  transform: translate(-50%, -50%);
}

.image-card__float {
  animation: floatY 4s ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
  transition: scale 0.3s ease;
}

.image-card__frame {
  border: 1px solid rgba(240, 237, 230, 0.12);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.image-card:hover .image-card__float {
  scale: 1.05;
}

.image-card:hover .image-card__frame {
  border-color: rgba(240, 237, 230, 0.4);
}

.image-card__constellation {
  pointer-events: none;
}

@media (max-width: 768px) {
  .image-card {
    width: min(var(--mobile-card-width, 132px), 36vw) !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-card__float {
    animation-duration: 1ms;
  }
}
</style>
