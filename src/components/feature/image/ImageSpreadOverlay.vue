<script setup lang="ts">
import { ArrowLeft, Bookmark } from '@lucide/vue';
import { computed } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import Button from '@/components/ui/Button.vue';
import type { ImageSpreadNode } from '@/types/image';

const props = defineProps<{
  image: ImageSpreadNode;
}>();

const emit = defineEmits<{
  return: [];
}>();

const mainImageLabel = computed(() => {
  const isMainEntryImage = props.image.src.includes('main');
  const isMediumEntryImage = props.image.medium && !props.image.subMedium;

  if (isMainEntryImage || isMediumEntryImage) {
    return undefined;
  }

  return props.image.style[0] ?? props.image.styleGroup;
});
</script>

<template>
  <section class="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-5">
    <ConstellationBackground
      active
      class-name="absolute left-1/2 top-[20%] -z-10 -translate-x-1/2 -translate-y-1/2"
      size="min(104vw, 760px)"
      :line-length="320"
      :line-width="1.2"
      :line-opacity="0.85"
      :inactive-node-opacity="0.25"
      :active-node-opacity="0.5"
      :glow-opacity="0.04"
      :node-size="5"
      :spacing="70"
    />

    <figure
      data-testid="spread-main-image-frame"
      class="relative w-full max-w-[min(72vw,360px)] cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-elevated/60 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
    >
      <img
        data-testid="spread-main-image"
        :src="image.src"
        :alt="image.alt"
        class="aspect-[4/5] w-full cursor-pointer object-cover"
      />
      <figcaption
        v-if="mainImageLabel"
        data-testid="spread-main-image-label"
        class="absolute bottom-4 left-4 rounded-full bg-void/80 px-4 py-2 text-sm font-semibold text-text-primary backdrop-blur-md"
      >
        {{ mainImageLabel }}
      </figcaption>
    </figure>

    <div class="flex flex-wrap items-center justify-center gap-3 pt-1">
      <Button variant="primary" type="button" data-testid="return-home" @click="emit('return')">
        <span class="inline-flex items-center gap-2">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Return
        </span>
      </Button>
      <Button variant="secondary" type="button">
        <span class="inline-flex items-center gap-2">
          <Bookmark class="size-4" aria-hidden="true" />
          Add to moodboard
        </span>
      </Button>
    </div>
  </section>
</template>
