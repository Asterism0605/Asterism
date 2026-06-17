<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageStagePanel from '@/components/feature/image/ImageStagePanel.vue';
import ImageMetaPanel from '@/components/feature/image/ImageMetaPanel.vue';
import { getImageById, getRelatedImages } from '@/services/image.service';
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
const smallImages = computed(() => relatedImages.value.slice(0, 2).map((img) => img.src));
const similarImages = computed(() => relatedImages.value.slice(2, 6).map((img) => img.src));

const isSaving = ref(false);
const saveError = ref<string | null>(null);

function handleBack() {
  router.back();
}

function handleCreateFolder() {
  // TODO: 開啟新建資料夾 modal
}

async function handleSaveToFolder() {
  isSaving.value = true;
  saveError.value = null;
  try {
    // TODO: 接入實際 API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch {
    saveError.value = '儲存失敗，請再試一次';
  } finally {
    isSaving.value = false;
  }
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
        :title="currentImage.title"
        source-url="https://unsplash.com/"
        source-label="圖片來源網址.com"
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
