<script setup lang="ts">
/**
 * FloatingImageNetwork 的 Vue 元件入口。
 * 負責管理生命週期、互動狀態與畫面渲染，
 * 並在 mounted 時呼叫外部 layout 工具產生圖片卡片座標。
 */
import { computed, onMounted, ref, watch } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import { AMBIENT_DOTS, MAX_IMAGES, type ImageItem, type NodePosition } from './config';
import {
  buildFloatingImageLayout,
  getConstellationSize,
  getFallbackCard,
  resolveContainerSize,
  resolveLayoutPreset
} from './layout';

const props = defineProps<{
  images: ImageItem[];
  height?: string;
  layout?: 'auto' | 'home';
  showConstellations?: boolean;
}>();

const emit = defineEmits<{
  click: [index: number];
}>();

const containerRef = ref<HTMLElement | null>(null);
const positions = ref<NodePosition[]>([]);
const hoveredIndex = ref<number | null>(null);
const visibleImages = computed(() => props.images.slice(0, MAX_IMAGES));
const isHomeLayout = computed(() => props.layout === 'home');
const layoutKey = computed<'auto' | 'home'>(() => (props.layout === 'home' ? 'home' : 'auto'));

function getCardStyle(position: NodePosition | undefined, index: number) {
  const item = position ?? getFallbackCard(layoutKey.value);

  return {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.width}px`,
    zIndex: 2,
    '--float-delay': `${index * 0.8}s`,
    opacity: positions.value.length ? 1 : 0
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

function recomputeLayout() {
  const container = containerRef.value;
  if (!container) return;

  const { width, height } = resolveContainerSize(container, props.height);
  positions.value = buildFloatingImageLayout(
    visibleImages.value.length,
    width,
    height,
    resolveLayoutPreset(layoutKey.value)
  );
}

onMounted(() => {
  recomputeLayout();
  // images 常是 mount 後才非同步抓回來（例如 Home 的 getHomeInspirationImages），
  // 只在 onMounted 算一次 positions 會卡在初始的 0 張，圖片到位後仍 opacity:0。
  watch(visibleImages, recomputeLayout);
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-hidden"
    :style="{ height: props.height ?? '600px' }"
  >
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

    <div
      v-for="(image, i) in visibleImages"
      :key="`${i}-${image.src}`"
      data-testid="image-card"
      class="group image-card absolute cursor-pointer"
      :class="{ 'image-card--home': isHomeLayout }"
      :style="getCardStyle(positions[i], i)"
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
        :size="getConstellationSize(positions[i])"
        :line-length="Math.max(190, getConstellationSize(positions[i]) * 0.42)"
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
            :style="`aspect-ratio: ${positions[i]?.aspect ?? '3/4'}; object-fit: cover; display: block; border-radius: 4px;`"
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
