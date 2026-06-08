<script setup lang="ts">
import { computed } from 'vue'

interface ImageItem {
  src: string
  alt?: string
}

const props = defineProps<{
  images: ImageItem[]
  height?: string
}>()

const emit = defineEmits<{
  click: [index: number]
}>()

const IMAGE_POSITIONS = [
  { left: '3%',  top: '25%', width: '160px' },
  { left: '55%', top: '8%',  width: '140px' },
  { left: '38%', top: '50%', width: '170px' },
  { left: '70%', top: '45%', width: '150px' },
  { left: '15%', top: '62%', width: '130px' },
  { left: '80%', top: '18%', width: '135px' },
] as const

const NETWORK_NODES = [
  { x: 5,  y: 15 }, { x: 20, y: 5  }, { x: 45, y: 10 },
  { x: 65, y: 20 }, { x: 85, y: 5  }, { x: 90, y: 35 },
  { x: 75, y: 65 }, { x: 55, y: 80 }, { x: 35, y: 75 },
  { x: 10, y: 85 }, { x: 5,  y: 55 }, { x: 30, y: 40 },
] as const

const NETWORK_LINES: readonly [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 0], [1, 11], [3, 8], [2, 10],
]

const visibleImages = computed(() => props.images.slice(0, IMAGE_POSITIONS.length))
</script>

<template>
  <div class="relative w-full overflow-hidden" :style="{ height: props.height ?? '600px' }">
    <!-- SVG network layer -->
    <svg
      class="absolute inset-0 w-full h-full"
      style="z-index: 0;"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="([from, to], i) in NETWORK_LINES"
        :key="`line-${i}`"
        :x1="NETWORK_NODES[from].x"
        :y1="NETWORK_NODES[from].y"
        :x2="NETWORK_NODES[to].x"
        :y2="NETWORK_NODES[to].y"
        stroke="rgba(240,237,230,0.12)"
        stroke-width="0.3"
      />
      <circle
        v-for="(node, i) in NETWORK_NODES"
        :key="`node-${i}`"
        :cx="node.x"
        :cy="node.y"
        r="0.6"
        fill="rgba(240,237,230,0.25)"
      />
    </svg>

    <!-- Image cards -->
    <!--
      floatY 使用 transform: translateY，hover scale 改用獨立的 CSS `scale` property
      避免兩者都操作 transform 互相覆蓋
    -->
    <div
      v-for="(image, i) in visibleImages"
      :key="`${i}-${image.src}`"
      data-testid="image-card"
      class="image-card absolute cursor-pointer"
      :style="{
        left: IMAGE_POSITIONS[i].left,
        top: IMAGE_POSITIONS[i].top,
        width: IMAGE_POSITIONS[i].width,
        zIndex: 1,
        animationDelay: `${i * 0.8}s`,
      }"
      @click="emit('click', i)"
    >
      <img
        :src="image.src"
        :alt="image.alt ?? ''"
        class="w-full"
        style="aspect-ratio: 3/4; object-fit: cover; display: block; border-radius: 4px;"
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
  /* scale 是獨立 CSS property，不影響 transform animation */
  transition: scale 0.3s ease, border-color 0.3s ease;
}

.image-card:hover {
  scale: 1.05;
  border-color: rgba(240, 237, 230, 0.4);
}
</style>
