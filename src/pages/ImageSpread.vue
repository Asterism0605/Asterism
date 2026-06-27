<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import ImageSpreadOverlay from '@/components/feature/image/ImageSpreadOverlay.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import Button from '@/components/ui/Button.vue';
import {
  getImageById,
  getMediumGroupImages,
  getSubMediumGroupImages
} from '@/services/image.service';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import { isImageSaved, removeItem } from '@/services/moodboard.service';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();

const { saveToMoodboard } = useSaveToMoodboard();
const isSaved = computed(() => isImageSaved(centerImage.value?.id ?? ''));
const showCreateFolder = ref(false);
const centerImage = ref<ImageSpreadNode | undefined>();
const rootImage = ref<ImageSpreadNode | undefined>();
const relatedImages = ref<ImageSpreadNode[]>([]);
const visitedImageIds = ref<string[]>([]);
const spreadDepth = ref(0);
let syncedRouteImageId: string | undefined;

const routeImageId = computed(() => {
  const rawImageId = route.params.imageId;

  return Array.isArray(rawImageId) ? rawImageId[0] : rawImageId;
});

function refreshRelatedImages(imageId: string) {
  const fn = spreadDepth.value === 0 ? getMediumGroupImages : getSubMediumGroupImages;

  relatedImages.value = fn(imageId, {
    visitedImageIds: visitedImageIds.value
  });
}

function getRelatedImageLabel(image: ImageSpreadNode) {
  return spreadDepth.value === 0 ? image.medium : image.subMedium;
}

function loadImageSpread(imageId: string | undefined) {
  if (!imageId) {
    centerImage.value = undefined;
    rootImage.value = undefined;
    relatedImages.value = [];
    visitedImageIds.value = [];
    spreadDepth.value = 0;
    return;
  }

  const image = getImageById(imageId);
  const rawRootId = route.query.rootId;
  const rootId = Array.isArray(rawRootId) ? rawRootId[0] : rawRootId;

  if (image) {
    if (rootId && typeof rootId === 'string' && rootId !== imageId) {
      const rImage = getImageById(rootId);
      if (rImage && rImage.styleGroup === image.styleGroup) {
        rootImage.value = rImage;
        centerImage.value = image;
        spreadDepth.value = 1;
        visitedImageIds.value = [rImage.id, image.id];
        refreshRelatedImages(image.id);
        return;
      }
    }

    centerImage.value = image;
    rootImage.value = image;
    spreadDepth.value = 0;
    visitedImageIds.value = [image.id];
    refreshRelatedImages(image.id);
  } else {
    centerImage.value = undefined;
    rootImage.value = undefined;
    relatedImages.value = [];
    visitedImageIds.value = [];
    spreadDepth.value = 0;
  }
}

function syncSpreadRoute(imageId: string) {
  const currentRootId = spreadDepth.value === 1 ? rootImage.value?.id : undefined;
  if (routeImageId.value === imageId && route.query.rootId === currentRootId) {
    return;
  }

  syncedRouteImageId = imageId;
  const query = currentRootId ? { rootId: currentRootId } : undefined;

  void router
    .replace({
      name: 'image-spread',
      params: { imageId },
      query
    })
    .catch(() => {
      if (syncedRouteImageId === imageId) {
        syncedRouteImageId = undefined;
      }
    });
}

function returnToPreviousLayer() {
  // 路徑階層：
  // 詳情頁 Back -> medium spread（?rootId=main）
  // medium Return -> main spread
  // main Return -> 首頁
  if (spreadDepth.value > 0 && rootImage.value) {
    centerImage.value = rootImage.value;
    visitedImageIds.value = [rootImage.value.id];
    spreadDepth.value = 0;
    refreshRelatedImages(rootImage.value.id);
    syncSpreadRoute(rootImage.value.id);
    return;
  }

  router.push({ name: 'home' });
}

function handleRelatedSelect(image: ImageSpreadNode) {
  if (spreadDepth.value >= 1) {
    void router.push({ name: 'picture-detail', params: { imageId: image.id } });
    return;
  }

  centerImage.value = image;
  visitedImageIds.value = [...visitedImageIds.value, image.id];
  spreadDepth.value = 1;
  refreshRelatedImages(image.id);
  syncSpreadRoute(image.id);
}

function handleCreateFolder() {
  showCreateFolder.value = true;
}

async function handleSaveToFolder() {
  if (!centerImage.value) return;
  await saveToMoodboard('default', centerImage.value.id);
}

function handleRemove() {
  if (!centerImage.value) return;
  removeItem('default', centerImage.value.id);
}

watch(
  routeImageId,
  (imageId) => {
    if (imageId && syncedRouteImageId === imageId) {
      syncedRouteImageId = undefined;
      return;
    }

    loadImageSpread(imageId);
  },
  { immediate: true }
);
</script>

<template>
  <ImageSpreadEntrance
    as="main"
    kind="page"
    class="relative min-h-screen overflow-hidden bg-void pt-[var(--app-header-height)] text-text-primary [--app-header-height:92px]"
  >
    <ImageSpreadEntrance
      kind="wash"
      class="pointer-events-none absolute inset-0 z-0 image-spread__wash"
      aria-hidden="true"
    />

    <section
      v-if="centerImage"
      class="relative z-10 mx-auto flex min-h-[calc(100vh-var(--app-header-height))] w-full max-w-[1600px] flex-col items-center justify-center gap-8 px-6 pb-10 pt-6 lg:px-10 lg:pt-8"
    >
      <div class="relative z-10 flex w-full flex-1 items-center justify-center">
        <RelatedImageCluster
          class="hidden lg:block"
          :images="relatedImages"
          :get-image-label="getRelatedImageLabel"
          @select="handleRelatedSelect"
        />

        <ImageSpreadOverlay :image="centerImage" :saved="isSaved" @return="returnToPreviousLayer" @create-folder="handleCreateFolder" @save-to-folder="handleSaveToFolder" @remove="handleRemove" />
      </div>

      <div class="grid w-full max-w-3xl grid-cols-2 gap-3 lg:hidden">
        <ImageSpreadEntrance
          v-for="(image, index) in relatedImages"
          :key="image.id"
          as="button"
          kind="relatedCard"
          :spread-index="index"
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
            v-if="getRelatedImageLabel(image)"
            class="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-void/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-primary"
          >
            {{ getRelatedImageLabel(image) }}
          </span>
        </ImageSpreadEntrance>
      </div>
    </section>

    <section
      v-else
      class="relative z-10 mx-auto flex min-h-[calc(100vh-var(--app-header-height))] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">Image not found</p>
      <h1 class="text-3xl font-bold tracking-normal sm:text-5xl">
        This inspiration point is outside the current map.
      </h1>
      <p class="text-sm leading-7 text-text-secondary sm:text-base">
        Return home and choose another visual path from the exploration field.
      </p>
      <Button data-testid="return-home" type="button" variant="primary" @click="returnToPreviousLayer">
        Return home
      </Button>
    </section>
  </ImageSpreadEntrance>
  <CreateNewFolder v-model="showCreateFolder" />
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
