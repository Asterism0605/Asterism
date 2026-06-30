<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue';
import { computed } from 'vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import Button from '@/components/ui/Button.vue';
import ActionButton from '@/components/feature/image/ActionButton.vue';
import type { ImageSpreadNode } from '@/types/image';

const props = defineProps<{
  image: ImageSpreadNode;
  saved?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  return: [];
  'create-folder': [];
  'save-to-folder': [];
}>();

const mainImageLabel = computed(() => {
  const isMainEntryImage = props.image.src.includes('main');

  if (isMainEntryImage) {
    return undefined;
  }

  if (props.image.medium && !props.image.subMedium) {
    return props.image.medium;
  }

  return props.image.style[0] ?? props.image.styleGroup;
});
</script>

<template>
  <ImageSpreadEntrance
    as="section"
    kind="center"
    class="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-5"
  >
    <div class="relative flex w-full justify-center">
      <ConstellationBackground
        active
        class-name="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
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

      <ImageSpreadEntrance
        as="figure"
        kind="centerFrame"
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
      </ImageSpreadEntrance>
    </div>

    <ImageSpreadEntrance
      kind="actions"
      :delay="180"
      class="flex flex-wrap items-center justify-center gap-3 pt-1"
    >
      <Button variant="primary" type="button" data-testid="return-home" @click="emit('return')">
        <span class="inline-flex items-center gap-2">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Return
        </span>
      </Button>
      <ActionButton
        class="min-w-48"
        spread
        :saved="props.saved"
        :disabled="props.disabled"
        @create-folder="emit('create-folder')"
        @save-to-folder="emit('save-to-folder')"
      />
    </ImageSpreadEntrance>
  </ImageSpreadEntrance>
</template>
