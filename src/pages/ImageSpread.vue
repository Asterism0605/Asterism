<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageSpreadOverlay from '@/components/feature/image/ImageSpreadOverlay.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import Button from '@/components/ui/Button.vue';
import { getImageById, getRelatedImages } from '@/services/image.service';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();

const centerImage = ref<ImageSpreadNode | undefined>();
const relatedImages = ref<ImageSpreadNode[]>([]);
const visitedImageIds = ref<string[]>([]);
const spreadDepth = ref(0);

const routeImageId = computed(() => {
  const rawImageId = route.params.imageId;

  return Array.isArray(rawImageId) ? rawImageId[0] : rawImageId;
});

function refreshRelatedImages(imageId: string) {
  relatedImages.value = getRelatedImages(imageId, {
    visitedImageIds: visitedImageIds.value
  });
}

function loadImageSpread(imageId: string | undefined) {
  if (!imageId) {
    centerImage.value = undefined;
    relatedImages.value = [];
    visitedImageIds.value = [];
    spreadDepth.value = 0;
    return;
  }

  const image = getImageById(imageId);
  centerImage.value = image;
  relatedImages.value = [];
  visitedImageIds.value = image ? [image.id] : [];
  spreadDepth.value = 0;

  if (image) {
    refreshRelatedImages(image.id);
  }
}

function returnHome() {
  void router.push({ name: 'home' });
}

function handleRelatedSelect(image: ImageSpreadNode) {
  if (spreadDepth.value >= 1) {
    void router.push({ path: `/images/${image.id}` });
    return;
  }

  centerImage.value = image;
  visitedImageIds.value = [...visitedImageIds.value, image.id];
  spreadDepth.value = 1;
  refreshRelatedImages(image.id);
}

watch(routeImageId, loadImageSpread, { immediate: true });
</script>

<template>
  <main
    class="relative min-h-screen overflow-hidden bg-void pt-[92px] text-text-primary"
  >
    <div class="pointer-events-none absolute inset-0 z-0 image-spread__wash" aria-hidden="true" />

    <section
      v-if="centerImage"
      class="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-[1600px] flex-col items-center justify-center gap-8 px-6 pb-10 lg:px-10"
    >
      <div class="relative flex w-full flex-1 items-center justify-center">
        <RelatedImageCluster
          class="hidden lg:block"
          :images="relatedImages"
          @select="handleRelatedSelect"
        />

        <ImageSpreadOverlay :image="centerImage" @return="returnHome" />
      </div>

      <div class="grid w-full max-w-3xl grid-cols-2 gap-3 lg:hidden">
        <button
          v-for="image in relatedImages"
          :key="image.id"
          data-testid="related-image-card-mobile"
          type="button"
          class="relative cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-elevated/70 text-left"
          @click="handleRelatedSelect(image)"
        >
          <img
            :src="image.src"
            :alt="image.alt"
            loading="lazy"
            class="aspect-[4/5] w-full cursor-pointer object-cover"
          />
          <span
            class="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-void/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-primary"
          >
            {{ image.style[0] ?? image.styleGroup }}
          </span>
        </button>
      </div>
    </section>

    <section
      v-else
      class="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">Image not found</p>
      <h1 class="text-3xl font-bold tracking-normal sm:text-5xl">
        This inspiration point is outside the current map.
      </h1>
      <p class="text-sm leading-7 text-text-secondary sm:text-base">
        Return home and choose another visual path from the exploration field.
      </p>
      <Button data-testid="return-home" type="button" variant="primary" @click="returnHome">
        Return home
      </Button>
    </section>
  </main>
</template>

<style scoped>
.image-spread__wash {
  background:
    radial-gradient(circle at 50% 42%, rgb(168 137 58 / 0.13), transparent 30%),
    radial-gradient(circle at 18% 24%, rgb(240 237 230 / 0.06), transparent 24%),
    radial-gradient(circle at 82% 72%, rgb(216 91 55 / 0.09), transparent 22%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 56%, var(--color-void) 100%);
}

.image-spread__wash::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.14;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.05) 1px, transparent 1px);
  background-size: 128px 128px;
  mask-image: linear-gradient(180deg, transparent, black 16%, black 82%, transparent);
}
</style>
