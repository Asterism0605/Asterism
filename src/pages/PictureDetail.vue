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
import { useAuthStore } from '@/stores/auth.store';
import { isImageSaved } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

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

const { isSaving, saveToMoodboard, createNewFolder, isCreatingFolder, isCreateFolderSuccess, justSavedFolderId } =
  useSaveToMoodboard();
const isSaved = computed(() => isImageSaved(currentImage.value?.id ?? ''));
const moodboardStore = useMoodboardStore();
const folders = computed(() =>
  moodboardStore.folders.map((f) => ({
    id: f.id,
    name: f.name,
    saved: f.images.some((image) => image.id === currentImage.value?.id)
  }))
);
const showCreateFolder = ref(false);

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
  isCreateFolderSuccess.value = false;
  showCreateFolder.value = true;
}

async function handleSubmitFolder(name: string) {
  const success = await createNewFolder(name);
  if (success) showCreateFolder.value = false;
}

function handleConsult() {
  if (!currentImage.value) return;

  const consultantRoute = {
    name: 'consultant',
    query: { sourceImageId: currentImage.value.id }
  };

  if (authStore.isAuthenticated) {
    router.push(consultantRoute);
    return;
  }

  router.push({
    name: 'sign-up',
    query: { next: router.resolve(consultantRoute).fullPath }
  });
}

function handleSelectImage(imageId: string) {
  router.push({ name: 'picture-detail', params: { imageId } });
}

async function handleSaveToFolder(folderId: string) {
  if (!currentImage.value) return;
  await saveToMoodboard(folderId, currentImage.value.id);
}

</script>

<template>
  <div class="flex flex-col text-text-primary md:h-screen md:flex-row md:overflow-hidden">
    <ImageStagePanel
      v-if="currentImage"
      class="hidden md:flex"
      :main-image-url="currentImage.src"
      :small-images="smallImages"
      @select="handleSelectImage"
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
        :saved="isSaved"
        :disabled="isSaving"
        :folders="folders"
        :just-saved-folder-id="justSavedFolderId"
        @back="handleBack"
        @consult="handleConsult"
        @create-folder="handleCreateFolder"
        @save-to-folder="handleSaveToFolder"
        @select-image="handleSelectImage"
      />
    </div>
  </div>
  <CreateNewFolder
    v-model="showCreateFolder"
    :is-submitting="isCreatingFolder"
    :is-success="isCreateFolderSuccess"
    @submit="handleSubmitFolder"
  />
</template>
