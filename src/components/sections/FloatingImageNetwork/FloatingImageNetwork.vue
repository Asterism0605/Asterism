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
const visibleImages = computed(() => props.images);

// 記住每張圖載入後的「真實寬高比」（src -> "w/h"），餵給 layout 算間距，
// 讓卡片照原圖比例顯示又不重疊。
const naturalAspects = new Map<string, string>();
// 圖片載入前用 preset 假比例排的第一版先不顯示，等拿到真實比例排好的版本才淡入，
// 避免使用者看到「假比例 → 真比例」跳動兩次的感覺。
const isReady = ref(false);
let loadedCount = 0;
let recomputeTimer: ReturnType<typeof setTimeout> | undefined;
let readyTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleRecompute() {
  if (typeof window === 'undefined') {
    recomputeLayout();
    return;
  }
  clearTimeout(recomputeTimer);
  recomputeTimer = setTimeout(recomputeLayout, 120);
}

function onImageLoad(src: string, event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspect = `${img.naturalWidth}/${img.naturalHeight}`;
    if (naturalAspects.get(src) !== aspect) {
      naturalAspects.set(src, aspect);
      scheduleRecompute();
    }
  }

  loadedCount += 1;
  if (loadedCount >= visibleImages.value.length) {
    // 全部載入完：用真實比例做最後一次排版，然後一次淡入。
    // 同時清掉 1 秒後備計時器，否則它會在卡片已顯示後再重算一次隨機排版，造成二次跳動。
    clearTimeout(recomputeTimer);
    clearTimeout(readyTimer);
    recomputeLayout();
    isReady.value = true;
  }
}

function startLoadCycle() {
  isReady.value = false;
  loadedCount = 0;
  recomputeLayout();
  if (typeof window !== 'undefined') {
    // 後備：就算有圖片載不出來，最多等一下也要顯示
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => {
      recomputeLayout();
      isReady.value = true;
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

onMounted(() => {
  startLoadCycle();
  // images 常是 mount 後才非同步抓回來（例如 Home 的 getHomeInspirationImages），
  // 圖片陣列一變就重置載入週期：先用 preset 排版（隱藏），等真實比例排好才淡入。
  watch(visibleImages, startLoadCycle);
});

onBeforeUnmount(() => {
  clearTimeout(recomputeTimer);
  clearTimeout(readyTimer);
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
