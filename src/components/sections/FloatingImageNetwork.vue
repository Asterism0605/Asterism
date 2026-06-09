<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { forceSimulation, forceCollide, forceCenter, forceManyBody } from 'd3-force';

interface ImageItem {
  src: string;
  alt?: string;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  aspect: string;
}


const props = defineProps<{
  images: ImageItem[];
  height?: string;
}>();

const emit = defineEmits<{
  click: [index: number];
}>();

const containerRef = ref<HTMLElement | null>(null);
const positions = ref<NodePosition[]>([]);

const CARD_WIDTHS = [130, 150, 160, 170, 200, 210];
const CARD_ASPECTS = ['3/4', '3/4', '3/4', '3/4', '4/3', '4/3'];

const MAX_IMAGES = 6;
const visibleImages = computed(() => props.images.slice(0, MAX_IMAGES));

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  const W = container.clientWidth;
  const H = container.clientHeight;

  const nodes: NodePosition[] = visibleImages.value.map((_, i) => ({
    x: W * 0.2 + Math.random() * W * 0.6,
    y: H * 0.2 + Math.random() * H * 0.6,
    width: CARD_WIDTHS[i % CARD_WIDTHS.length],
    aspect: CARD_ASPECTS[i % CARD_ASPECTS.length]
  }));

  const sim = forceSimulation(nodes)
    .force('center', forceCenter(W / 2, H / 2).strength(0.3))
    .force('charge', forceManyBody().strength(-60))
    .force('collide', forceCollide((node: NodePosition) => node.width * 0.65).strength(1))
    .stop();

  for (let i = 0; i < 200; i++) sim.tick();

  positions.value = nodes.map((n) => ({
    x: Math.max(n.width / 2, Math.min(W - n.width, n.x - n.width / 2)),
    y: Math.max(0, Math.min(H - 80, n.y - 80)),
    width: n.width,
    aspect: n.aspect,
  }));
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
  { left: '82%', top: '33%' },
] as const;
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
        zIndex: 0,
      }"
    />

    <!-- Image cards -->
    <div
      v-for="(image, i) in visibleImages"
      :key="`${i}-${image.src}`"
      data-testid="image-card"
      class="image-card absolute cursor-pointer"
      :style="{
        left: `${positions[i]?.x ?? 0}px`,
        top: `${positions[i]?.y ?? 0}px`,
        width: `${positions[i]?.width ?? 160}px`,
        zIndex: 2,
        animationDelay: `${i * 0.8}s`,
        opacity: positions.length ? 1 : 0,
      }"
      @click="emit('click', i)"
    >
      <img
        :src="image.src"
        :alt="image.alt ?? ''"
        class="w-full"
        :style="`aspect-ratio: ${positions[i]?.aspect ?? '3/4'}; object-fit: cover; display: block; border-radius: 4px;`"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes floatY {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}

.image-card {
  animation: floatY 4s ease-in-out infinite;
  border: 1px solid rgba(240, 237, 230, 0.12);
  border-radius: 4px;
  transition: scale 0.3s ease, border-color 0.3s ease, opacity 0.4s ease;
}

.image-card:hover {
  scale: 1.05;
  border-color: rgba(240, 237, 230, 0.4);
}
</style>
