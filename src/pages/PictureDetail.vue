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

const {
  isSaving,
  canSave,
  redirectGuestToLogin,
  consumePendingSaveMenu,
  saveToMoodboard,
  createNewFolder,
  isCreatingFolder,
  isCreateFolderSuccess,
  justSavedFolderId
} = useSaveToMoodboard();
const moodboardStore = useMoodboardStore();
const isSaved = computed(() =>
  isImageSaved(moodboardStore.folders, currentImage.value?.id ?? '')
);
const folders = computed(() =>
  moodboardStore.folders.map((f) => ({
    id: f.id,
    name: f.name,
    saved: f.images.some((image) => image.id === currentImage.value?.id)
  }))
);
const showCreateFolder = ref(false);
const saveMenuOpenRequest = ref(0);

watch(
  [imageId, canSave],
  ([currentImageId, authenticated]) => {
    if (authenticated && consumePendingSaveMenu(currentImageId, Boolean(currentImage.value))) {
      saveMenuOpenRequest.value += 1;
    }
  },
  { immediate: true }
);

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;

  return typeof value === 'string' ? value : undefined;
}

function getSpreadPathContext() {
  const spreadImageId = firstQueryValue(route.query.spreadImageId);
  const spreadRootId = firstQueryValue(route.query.spreadRootId);
  const spreadDetailImageId = firstQueryValue(route.query.spreadDetailImageId);
  const spreadImage = spreadImageId ? getImageById(spreadImageId) : undefined;
  const spreadRoot = spreadRootId ? getImageById(spreadRootId) : undefined;

  if (spreadDetailImageId !== currentImage.value?.id) return undefined;
  if (!spreadImage) return undefined;

  return {
    imageId: spreadImage.id,
    rootId:
      spreadRoot &&
      spreadRoot.id !== spreadImage.id &&
      spreadRoot.styleGroup === spreadImage.styleGroup
        ? spreadRoot.id
        : undefined
  };
}

function handleBack() {
  if (!currentImage.value) {
    router.back();
    return;
  }

  const spreadPathContext = getSpreadPathContext();

  if (spreadPathContext) {
    router.push({
      name: 'image-spread',
      params: { imageId: spreadPathContext.imageId },
      query: spreadPathContext.rootId ? { rootId: spreadPathContext.rootId } : undefined
    });
    return;
  }

  const rootImage = getStyleGroupRootImage(currentImage.value.id);
  const spreadImage = getMediumEntryImage(currentImage.value.id) ?? currentImage.value;
  const query = rootImage && rootImage.id !== spreadImage.id ? { rootId: rootImage.id } : undefined;

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
  if (!currentImage.value) return;
  const success = await createNewFolder(name, currentImage.value.id);
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
  const spreadPathContext = getSpreadPathContext();
  const nextImage = getImageById(imageId);
  const spreadRoot = spreadPathContext?.rootId ? getImageById(spreadPathContext.rootId) : undefined;
  const spreadImage = spreadPathContext ? getImageById(spreadPathContext.imageId) : undefined;
  const isInSameSpreadPath =
    nextImage &&
    spreadImage &&
    nextImage.styleGroup === spreadImage.styleGroup &&
    nextImage.medium === spreadImage.medium;
  const nextQuery =
    spreadPathContext && nextImage && isInSameSpreadPath
      ? {
          spreadImageId: spreadPathContext.imageId,
          spreadDetailImageId: nextImage.id,
          ...(spreadRoot &&
          spreadRoot.id !== spreadPathContext.imageId &&
          spreadRoot.styleGroup === spreadImage.styleGroup
            ? { spreadRootId: spreadRoot.id }
            : {})
        }
      : undefined;

  router.push({ name: 'picture-detail', params: { imageId }, query: nextQuery });
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
      @back="handleBack"
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
        :can-save="canSave"
        :save-menu-open-request="saveMenuOpenRequest"
        :folders="folders"
        :just-saved-folder-id="justSavedFolderId"
        @auth-required="redirectGuestToLogin(currentImage.id)"
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
