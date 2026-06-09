<script setup lang="ts">
import { ref, computed } from 'vue'

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

const hoveredIndex = ref<number | null>(null)

const IMAGE_POSITIONS = [
  { left: '3%',  top: '25%', width: '160px', aspect: '3/4' },
  { left: '55%', top: '8%',  width: '200px', aspect: '4/3' },
  { left: '38%', top: '50%', width: '170px', aspect: '3/4' },
  { left: '70%', top: '45%', width: '210px', aspect: '4/3' },
  { left: '15%', top: '62%', width: '130px', aspect: '3/4' },
  { left: '80%', top: '18%', width: '135px', aspect: '3/4' },
] as const

// Burst lines originate from card center (0,0), radiate outward
// SVG viewBox is -250 -250 500 500 (500×500px centered on card)
const BURST_LINES = [
  { dx: -120, dy: -165, r: 8  },  // 左上
  { dx: -68,  dy: -190, r: 6  },  // 正上偏左
  { dx: -180, dy: -78,  r: 7  },  // 左偏上
  { dx: -195, dy: 38,   r: 9  },  // 正左
  { dx: -155, dy: 148,  r: 7  },  // 左下
  { dx: -82,  dy: 200,  r: 8  },  // 左偏下
  { dx: 38,   dy: 210,  r: 7  },  // 正下
  { dx: 155,  dy: 145,  r: 8  },  // 右下
  { dx: 200,  dy: 55,   r: 7  },  // 右偏下
  { dx: 135,  dy: -95,  r: 6  },  // 右偏上
  { dx: 62,   dy: -195, r: 8  },  // 正上偏右
] as const

// Small ambient dots scattered across canvas (always visible)
const AMBIENT_DOTS = [
  { left: '35%', top: '8%'  },
  { left: '49%', top: '13%' },
  { left: '62%', top: '6%'  },
  { left: '75%', top: '2%'  },
  { left: '87%', top: '9%'  },
  { left: '94%', top: '3%'  },
  { left: '43%', top: '33%' },
  { left: '50%', top: '58%' },
  { left: '85%', top: '58%' },
  { left: '90%', top: '80%' },
  { left: '20%', top: '83%' },
  { left: '32%', top: '80%' },
  { left: '65%', top: '25%' },
  { left: '82%', top: '33%' },
] as const

const visibleImages = computed(() => props.images.slice(0, IMAGE_POSITIONS.length))
</script>

<template>
  <div class="relative w-full overflow-hidden" :style="{ height: props.height ?? '600px' }">

    <!-- Ambient dots: always visible, no lines -->
    <div
      v-for="(dot, i) in AMBIENT_DOTS"
      :key="`dot-${i}`"
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
    <!--
      floatY 使用 transform: translateY
      hover scale 改用獨立 CSS `scale` property，避免覆蓋 transform
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
        zIndex: 2,
        animationDelay: `${i * 0.8}s`,
      }"
      @mouseenter="hoveredIndex = i"
      @mouseleave="hoveredIndex = null"
      @click="emit('click', i)"
    >
      <!-- Burst SVG: behind img, centered on card, overflow extends outward -->
      <!-- Lines originate from card center → extend outside image bounds     -->
      <svg
        class="burst-svg"
        :class="{ 'burst-svg--visible': hoveredIndex === i }"
        viewBox="-250 -250 500 500"
        width="500"
        height="500"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          v-for="(line, j) in BURST_LINES"
          :key="`line-${j}`"
          x1="0" y1="0"
          :x2="line.dx"
          :y2="line.dy"
          stroke="rgba(240,237,230,0.75)"
          stroke-width="1.5"
        />
        <circle
          v-for="(line, j) in BURST_LINES"
          :key="`circle-${j}`"
          :cx="line.dx"
          :cy="line.dy"
          :r="line.r"
          fill="rgba(240,237,230,0.9)"
        />
        <!-- Satellite circles: no line, positioned 1.35× further along same direction -->
        <circle
          v-for="(line, j) in BURST_LINES"
          :key="`satellite-${j}`"
          :cx="Math.round(line.dx * 1.35)"
          :cy="Math.round(line.dy * 1.35)"
          r="3.5"
          fill="rgba(240,237,230,0.55)"
        />
      </svg>

      <img
        :src="image.src"
        :alt="image.alt ?? ''"
        class="w-full"
        :style="`aspect-ratio: ${IMAGE_POSITIONS[i].aspect}; object-fit: cover; display: block; border-radius: 4px; position: relative; z-index: 1;`"
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

/* Burst SVG: behind the image (z-index < img's z-index:1), centered on card */
.burst-svg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  overflow: visible;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 0;
}

.burst-svg--visible {
  opacity: 1;
}
</style>
