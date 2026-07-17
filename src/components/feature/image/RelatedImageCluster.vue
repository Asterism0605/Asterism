<script setup lang="ts">
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import type { ImageSpreadNode } from '@/types/image';

defineProps<{
  images: ImageSpreadNode[];
  getImageLabel?: (image: ImageSpreadNode) => string | undefined;
}>();

const emit = defineEmits<{
  select: [image: ImageSpreadNode];
}>();

const desktopPositions = [
  'lg:left-[10%] lg:top-[0.8%] lg:z-30',
  'lg:left-[14%] lg:bottom-[3%] lg:z-20',
  'lg:right-[8%] lg:top-[8%] lg:z-30',
  'lg:right-[14%] lg:bottom-[5%] lg:z-20'
];

function getPositionClass(index: number) {
  return desktopPositions[index] ?? desktopPositions[0];
}
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-10" data-tour="spread-related-group">
    <ImageSpreadEntrance
      v-for="(image, index) in images"
      :key="image.id"
      as="button"
      kind="relatedCard"
      :spread-index="index"
      data-testid="related-image-card"
      :data-tour="index === 0 ? 'spread-related-image' : undefined"
      type="button"
      class="pointer-events-auto group relative cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-elevated/70 text-left shadow-[0_20px_70px_rgba(0,0,0,0.38)] transition duration-300 hover:z-40 hover:-translate-y-1 hover:border-white/34 focus-visible:z-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim lg:absolute lg:w-[clamp(132px,14vw,220px)]"
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
        v-if="getImageLabel?.(image)"
        data-tour-medium-label
        class="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-full bg-void/78 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary backdrop-blur-md"
      >
        {{ getImageLabel(image) }}
      </span>
    </ImageSpreadEntrance>
  </div>
</template>
