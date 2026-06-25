<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageStagePanel from '@/components/feature/image/ImageStagePanel.vue';
import ImageMetaPanel from '@/components/feature/image/ImageMetaPanel.vue';
import {
  getImageById,
  getMediumEntryImage,
  getRelatedImages,
  getStyleGroupRootImage
} from '@/services/image.service';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();

const imageId = computed(() => route.params.imageId as string);
const currentImage = computed(() => getImageById(imageId.value));

const relatedImages = ref<ImageSpreadNode[]>([]);
watch(
  imageId,
  (newId) => {
    relatedImages.value = getRelatedImages(newId, { limit: 6 });
  },
  { immediate: true }
);
const smallImages = computed(() => relatedImages.value.slice(0, 2));
const similarImages = computed(() => relatedImages.value.slice(2, 6));

const { isSaving, saveError, saveToMoodboard } = useSaveToMoodboard();

function handleBack() {
  if (!currentImage.value) {
    router.back();
    return;
  }

  const rootImage = getStyleGroupRootImage(currentImage.value.id);
  const spreadImage = getMediumEntryImage(currentImage.value.id) ?? currentImage.value;
  const query =
    rootImage && rootImage.id !== spreadImage.id ? { rootId: rootImage.id } : undefined;

  router.push({
    name: 'image-spread',
    params: { imageId: spreadImage.id },
    query
  });
}

function handleCreateFolder() {
  // TODO: 開啟新建資料夾 modal
}

async function handleSaveToFolder() {
  if (!currentImage.value) return;
  await saveToMoodboard(currentImage.value);
}
</script>

<template>
  <div class="flex flex-col text-text-primary md:h-screen md:flex-row md:overflow-hidden">
    <ImageStagePanel
      v-if="currentImage"
      class="hidden md:flex"
      :main-image-url="currentImage.src"
      :small-images="smallImages"
    />

    <div class="w-full overflow-y-auto md:w-2/5 md:overflow-hidden">
      <ImageMetaPanel
        v-if="currentImage"
        source-url="https://unsplash.com/"
        source-label="Source URL.com"
        :color-palette="currentImage.colorPalette"
        :style-tags="currentImage.style"
        :similar-images="similarImages"
        photographer-name="Zhenya Rukhlov"
        photographer-role="Photographer"
        photographer-date="Aug 19, 2025"
        :loading="isSaving"
        :error="saveError"
        @back="handleBack"
        @create-folder="handleCreateFolder"
        @save-to-folder="handleSaveToFolder"
      />
    </div>
  </div>
</template>
