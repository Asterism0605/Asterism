<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageStagePanel from '@/components/feature/image/ImageStagePanel.vue';
import ImageMetaPanel from '@/components/feature/image/ImageMetaPanel.vue';
import {
  getImageById,
  getMediumEntryImage,
  getRelatedImages,
  getSourceLinkInfo,
  getStyleGroupRootImage,
  resolvePhotographerInfo
} from '@/services/image.service';
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard';
import { useAuthStore } from '@/stores/auth.store';
import { usePageUserTour } from '@/composables/guide/usePageUserTour';
import { isImageSaved } from '@/services/moodboard.service';
import { useMoodboardStore } from '@/stores/moodboard.store';
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue';
import StyleTagModal from '@/components/feature/dna/StyleTagModal.vue';
import TourTransition from '@/components/feature/guide/TourTransition.vue';
import type { ImageSpreadNode } from '@/types/image';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const coreTour = usePageUserTour(computed(() => authStore.user?.id));

const imageId = computed(() => route.params.imageId as string);
const currentImage = computed(() => getImageById(imageId.value));

const photographerInfo = computed(() => resolvePhotographerInfo(currentImage.value?.attribution));
const sourceLinkInfo = computed(() => getSourceLinkInfo(currentImage.value?.sourceUrl));

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
const activeStyleTag = ref<string | null>(null);

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
  if (route.query.from === 'image-search') {
    router.push({ name: 'image-search' });
    return;
  }

  if (!currentImage.value) {
    router.back();
    return;
  }

  const moodboardSlug = firstQueryValue(route.query.moodboardSlug);
  if (moodboardSlug) {
    router.push({ name: 'moodboard', params: { slug: moodboardSlug } });
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

function handleSelectStyleTag(tag: string) {
  if (
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'detail-style-tag'
  ) {
    coreTour.advance('detail-consult', currentImage.value?.id);
    coreTour.destroy();
  }

  activeStyleTag.value = tag;
}

async function handleSubmitFolder(name: string) {
  if (!currentImage.value) return;
  const success = await createNewFolder(name, currentImage.value.id);
  if (success) {
    showCreateFolder.value = false;
    completeExplorationChapter();
  }
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
  if (
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'detail-thumbnail'
  ) {
    coreTour.advance('detail-style-tag', imageId);
    coreTour.destroy();
  }

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

function handleSaveOpened() {
  if (coreTour.state.value.status === 'active' && coreTour.state.value.step === 'detail-save') {
    coreTour.pause();
    coreTour.destroy();
  }
}

function completeExplorationChapter(): void {
  if (
    (coreTour.state.value.status === 'active' || coreTour.state.value.status === 'paused') &&
    coreTour.state.value.step === 'detail-save'
  ) {
    coreTour.completeChapter('exploration');
    coreTour.destroy();
  }
}

async function proceedToMoodboard(): Promise<void> {
  coreTour.enterChapter('moodboard', 'moodboard-images');
  await router.push({ name: 'moodboard' });
  await nextTick();
  coreTour.resume();
}

function continueToMoodboardLater(): void {
  coreTour.enterChapter('moodboard', 'moodboard-images');
}

function hasVisibleTourTarget(selector: string): boolean {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return false;

  return window.getComputedStyle(target).display !== 'none' && target.getClientRects().length > 0;
}

function shouldSkipMobileThumbnailStep(): boolean {
  return window.innerWidth < 768;
}

function returnToSpreadTourStep(): void {
  coreTour.advance('spread-related-image', coreTour.state.value.targetImageId);

  const spreadPathContext = getSpreadPathContext();
  if (spreadPathContext) {
    void router.push({
      name: 'image-spread',
      params: { imageId: spreadPathContext.imageId },
      query: spreadPathContext.rootId ? { rootId: spreadPathContext.rootId } : undefined
    });
    return;
  }

  const spreadImage = currentImage.value
    ? getMediumEntryImage(currentImage.value.id) ?? currentImage.value
    : undefined;
  if (spreadImage) {
    void router.push({ name: 'image-spread', params: { imageId: spreadImage.id } });
  }
}

function handlePreviousDetailTourStep(): void {
  const step = coreTour.state.value.step;

  if (step === 'detail-save') {
    coreTour.advance('detail-consult', currentImage.value?.id);
    void showCurrentDetailTourStep();
    return;
  }

  if (step === 'detail-consult') {
    activeStyleTag.value = null;
    coreTour.advance('detail-style-tag', currentImage.value?.id);
    void showCurrentDetailTourStep();
    return;
  }

  if (step === 'detail-style-tag') {
    if (window.innerWidth >= 768 && hasVisibleTourTarget('[data-tour="detail-thumbnail"]')) {
      coreTour.advance('detail-thumbnail', currentImage.value?.id);
      void showCurrentDetailTourStep();
      return;
    }

    returnToSpreadTourStep();
    return;
  }

  if (step === 'detail-thumbnail') {
    returnToSpreadTourStep();
  }
}

async function showCurrentDetailTourStep() {
  const step = coreTour.state.value.step;
  if (coreTour.state.value.status !== 'active') {
    return;
  }

  if (
    coreTour.state.value.currentChapter === 'moodboard' ||
    step === 'home-overview' ||
    step === 'home-image' ||
    step === 'spread-related-group' ||
    step === 'spread-related-image'
  ) {
    return;
  }

  if (
    step !== 'detail-thumbnail' &&
    step !== 'detail-style-tag' &&
    step !== 'detail-consult' &&
    step !== 'detail-save'
  ) {
    coreTour.pause();
    return;
  }

  if (
    step === 'detail-thumbnail' &&
    coreTour.state.value.targetImageId &&
    coreTour.state.value.targetImageId !== currentImage.value?.id
  ) {
    coreTour.pause();
    return;
  }

  if (step === 'detail-thumbnail' && shouldSkipMobileThumbnailStep()) {
    coreTour.advance('detail-style-tag', currentImage.value?.id);
    await coreTour.showStep('detail-style-tag', { onPrevious: handlePreviousDetailTourStep });
    return;
  }

  await coreTour.showStep(step, { onPrevious: handlePreviousDetailTourStep });
}

async function handleSaveToFolder(folderId: string) {
  if (!currentImage.value) return;
  const success = await saveToMoodboard(folderId, currentImage.value.id);
  if (success) completeExplorationChapter();
}

// Esc 返回是全頁級的慣例快捷鍵，不需要先 Tab 聚焦到哪個區塊；
// 跳過 showCreateFolder 開啟中的情況，避免使用者想關彈窗卻整頁被導走。
function handleKeydown(event: KeyboardEvent) {
  if (
    event.key === 'Escape' &&
    !showCreateFolder.value &&
    coreTour.state.value.status !== 'transition'
  ) {
    handleBack();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown));

watch(
  [currentImage, () => coreTour.state.value.status, () => coreTour.state.value.step, activeStyleTag],
  ([, , , styleTag]) => {
    if (styleTag === null) void showCurrentDetailTourStep();
  },
  { immediate: true }
);
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
        :source-url="sourceLinkInfo?.url"
        :source-label="sourceLinkInfo?.label"
        :color-palette="currentImage.colorPalette"
        :style-tags="currentImage.style"
        :similar-images="similarImages"
        :photographer-name="photographerInfo.name"
        photographer-role="Photographer"
        :photographer-avatar-url="photographerInfo.avatarUrl"
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
        @save-opened="handleSaveOpened"
        @select-style-tag="handleSelectStyleTag"
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
  <StyleTagModal
    :model-value="activeStyleTag !== null"
    :tag-label="activeStyleTag"
    @update:model-value="activeStyleTag = null"
  />
  <TourTransition
    v-if="
      coreTour.state.value.status === 'transition' &&
      coreTour.state.value.currentChapter === 'exploration'
    "
    :title="$t('userTour.transition.title')"
    :description="$t('userTour.transition.description')"
    :next-description="$t('userTour.transition.nextDescription')"
    :proceed-label="$t('userTour.transition.proceed')"
    :later-label="$t('userTour.transition.later')"
    @proceed="proceedToMoodboard"
    @later="continueToMoodboardLater"
  />
</template>
