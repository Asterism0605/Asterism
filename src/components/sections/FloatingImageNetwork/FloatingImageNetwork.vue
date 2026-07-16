<script setup lang="ts">
/**
 * FloatingImageNetwork 的 Vue 元件入口。
 * 負責管理生命週期、互動狀態與畫面渲染，
 * 並在 mounted 時呼叫外部 layout 工具產生圖片卡片座標。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import { AMBIENT_DOTS, type ImageItem, type NodePosition } from './config';
import {
  buildFloatingImageLayout,
  getConstellationSize,
  getFallbackCard,
  reflowFloatingImageLayout,
  resolveContainerSize,
  resolveLayoutPreset
} from './layout';

const props = defineProps<{
  images: ImageItem[];
  height?: string;
  layout?: 'auto' | 'home';
  showConstellations?: boolean;
  guideTargetIndex?: number;
}>();

const emit = defineEmits<{
  click: [index: number];
  ready: [];
  imagesLoaded: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const positions = ref<NodePosition[]>([]);
const hoveredIndex = ref<number | null>(null);
const visibleImages = computed(() => props.images);

// 記住每張圖載入後的「真實寬高比」（src -> "w/h"），餵給 layout 算間距，
// 讓卡片照原圖比例顯示又不重疊。
const naturalAspects = new Map<string, string>();
// 圖片載入前用 preset 假比例排的第一版先不顯示，等拿到真實比例排好的版本才淡入，
// 避免使用者看到「假比例 → 真比例」跳動兩次的感覺。
const isReady = ref(false);
let loadedCount = 0;
let hasEmittedImagesLoaded = false;
let recomputeTimer: ReturnType<typeof setTimeout> | undefined;
let readyTimer: ReturnType<typeof setTimeout> | undefined;

function clearLoadTimers(): void {
  clearTimeout(recomputeTimer);
  clearTimeout(readyTimer);
  recomputeTimer = undefined;
  readyTimer = undefined;
}

function finalizeReady(): void {
  if (isReady.value) {
    return;
  }

  clearLoadTimers();
  recomputeLayout();
  isReady.value = true;
  emit('ready');
}

function scheduleRecompute() {
  if (typeof window === 'undefined') {
    recomputeLayout();
    return;
  }
  clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(recomputeLayout, 120);
}

function scheduleAspectReflow() {
  if (typeof window === 'undefined') {
    reflowLayout();
    return;
  }
  clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(reflowLayout, 120);
}

function onImageLoad(src: string, event: Event) {
  const img = event.target as HTMLImageElement;

  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspect = `${img.naturalWidth}/${img.naturalHeight}`;

    if (naturalAspects.get(src) !== aspect) {
      naturalAspects.set(src, aspect);

      if (!isReady.value) {
        scheduleRecompute();
      } else {
        scheduleAspectReflow();
      }
    }
  }

  loadedCount += 1;

  if (loadedCount >= visibleImages.value.length && !hasEmittedImagesLoaded) {
    hasEmittedImagesLoaded = true;
    // 全部載入完：用真實比例做最後一次排版，然後一次淡入。
    // 同時清掉 1 秒後備計時器，否則它會在卡片已顯示後再重算一次隨機排版，造成二次跳動。
    finalizeReady();
    emit('imagesLoaded');
  }
}

function startLoadCycle() {
  clearLoadTimers();
  isReady.value = false;
  loadedCount = 0;
  hasEmittedImagesLoaded = false;
  recomputeLayout();
  if (visibleImages.value.length === 0) {
    return;
  }

  if (typeof window !== 'undefined') {
    // 後備：lazy 圖片可能尚未進入 viewport 而不觸發 load，
    // 因此最多等待一段時間後仍要顯示第一版穩定 layout。
    readyTimer = setTimeout(() => {
      finalizeReady();
    }, 1000);
  }
}
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
    opacity: isReady.value ? 1 : 0
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

function isCardClickable(index: number): boolean {
  return props.guideTargetIndex === undefined || props.guideTargetIndex === index;
}

function handleCardClick(index: number): void {
  if (isCardClickable(index)) {
    emit('click', index);
  }
}

function recomputeLayout() {
  const container = containerRef.value;
  if (!container) return;

  const { width, height } = resolveContainerSize(container, props.height);
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height;
  const aspects = visibleImages.value.map((image) => naturalAspects.get(image.src));
  positions.value = buildFloatingImageLayout(
    visibleImages.value.length,
    width,
    height,
    resolveLayoutPreset(layoutKey.value),
    viewportHeight,
    aspects
  );
}

function reflowLayout() {
  const container = containerRef.value;
  if (!container) return;

  const { width, height } = resolveContainerSize(container, props.height);
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height;
  const aspects = visibleImages.value.map((image) => naturalAspects.get(image.src));
  positions.value = reflowFloatingImageLayout(
    positions.value,
    width,
    height,
    resolveLayoutPreset(layoutKey.value),
    viewportHeight,
    aspects
  );
}

onMounted(() => {
  startLoadCycle();
  // images 常是 mount 後才非同步抓回來（例如 Home 的 getHomeInspirationImages），
  // 圖片陣列一變就重置載入週期：先用 preset 排版（隱藏），等真實比例排好才淡入。
  watch(visibleImages, startLoadCycle);
});

onBeforeUnmount(() => {
  clearLoadTimers();
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
      :data-guide-image-index="i"
      :data-guide-target="props.guideTargetIndex === i ? 'true' : undefined"
      :aria-disabled="isCardClickable(i) ? undefined : 'true'"
      class="group image-card absolute"
      :class="{
        'image-card--home': isHomeLayout,
        'image-card--guide-target': props.guideTargetIndex === i,
        'cursor-pointer': isCardClickable(i),
        'cursor-not-allowed': !isCardClickable(i)
      }"
      :style="getCardStyle(positions[i], i)"
      :tabindex="isCardClickable(i) ? 0 : -1"
      @mouseenter="activateCard(i)"
      @mouseleave="deactivateCard(i)"
      @focusin="activateCard(i)"
      @focusout="deactivateCard(i)"
      @click="handleCardClick(i)"
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
            :loading="i === 0 ? 'eager' : 'lazy'"
            :fetchpriority="i === 0 ? 'high' : 'auto'"
            decoding="async"
            class="w-full"
            style="display: block; width: 100%; height: auto; border-radius: 4px"
            @load="onImageLoad(image.src, $event)"
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
    scale 0.6s ease,
    border-color 0.6s ease,
    opacity 0.7s ease;
}

.image-card--home {
  transform: translate(-50%, -50%);
}

.image-card__float {
  animation: floatY 4.3s ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
  transition: scale 0.6s ease;
}

.image-card__frame {
  position: relative;
  border: 1px solid rgba(240, 237, 230, 0.12);
  border-radius: 4px;
  transition: border-color 0.6s ease;
}

.image-card--guide-target .image-card__frame {
  border-color: rgb(240 237 230 / 0.78);
}

.image-card--guide-target .image-card__frame::after {
  position: absolute;
  inset: -4px;
  border: 2px solid rgb(168 137 58 / 0.54);
  border-radius: inherit;
  box-shadow:
    0 0 28px rgb(168 137 58 / 0.72),
    0 0 60px rgb(240 237 230 / 0.24);
  content: '';
  pointer-events: none;
  opacity: 0.55;
  transform: scale(0.98);
  animation: guideGlow 1.8s ease-in-out infinite alternate;
  will-change: opacity, transform;
}

@keyframes guideGlow {
  to {
    opacity: 1;
    transform: scale(1.025);
  }
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

  .image-card--guide-target .image-card__frame::after {
    animation: none;
  }
}
</style>
