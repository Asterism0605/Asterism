<script setup lang="ts">
import type { ImageSpreadNode } from '@/types/image';

defineProps<{
  images: ImageSpreadNode[];
}>();

const emit = defineEmits<{
  select: [image: ImageSpreadNode];
}>();

const desktopPositions = [
  'lg:left-[7%] lg:top-[13%]',
  'lg:left-[11%] lg:bottom-[14%]',
  'lg:right-[8%] lg:top-[17%]',
  'lg:right-[14%] lg:bottom-[12%]'
];

function getPositionClass(index: number) {
  return desktopPositions[index] ?? desktopPositions[0];
}
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-10">
    <button
      v-for="(image, index) in images"
      :key="image.id"
      data-testid="related-image-card"
      type="button"
      class="pointer-events-auto group relative cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-elevated/70 text-left shadow-[0_20px_70px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-1 hover:border-white/34 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim lg:absolute lg:w-[clamp(132px,14vw,220px)]"
      :class="getPositionClass(index)"
      @click="emit('select', image)"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        loading="lazy"
        class="aspect-[4/5] w-full cursor-pointer object-cover transition duration-300 group-hover:scale-[1.03]"
      />
      <span
        class="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full bg-void/78 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary backdrop-blur-md"
      >
        {{ image.style[0] ?? image.styleGroup }}
      </span>
    </button>
  </div>
</template>
