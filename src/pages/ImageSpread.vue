<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue'
import ImageSpreadOverlay from '@/components/feature/image/ImageSpreadOverlay.vue'
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue'
import Button from '@/components/ui/Button.vue'
import ImageSpreadLabel from '@/components/ui/ImageSpreadLabel.vue'
import {
  getImageById,
  getMediumGroupImages,
  getSubMediumGroupImages
} from '@/services/image.service'
import { useSaveToMoodboard } from '@/composables/useSaveToMoodboard'
import { useTaxonomyLabel } from '@/composables/useTaxonomyLabel'
import { isImageSaved } from '@/services/moodboard.service'
import { useMoodboardStore } from '@/stores/moodboard.store'
import { useAuthStore } from '@/stores/auth.store'
import { usePageUserTour } from '@/composables/guide/usePageUserTour'
import CreateNewFolder from '@/components/feature/moodboard/CreateNewFolder.vue'
import type { ImageSpreadNode } from '@/types/image'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const coreTour = usePageUserTour(computed(() => authStore.user?.id))
const { localizeTaxon } = useTaxonomyLabel()

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
} = useSaveToMoodboard()
const moodboardStore = useMoodboardStore()
const isSaved = computed(() => isImageSaved(moodboardStore.folders, centerImage.value?.id ?? ''))
const folders = computed(() =>
  moodboardStore.folders.map((f) => ({
    id: f.id,
    name: f.name,
    saved: f.images.some((image) => image.id === centerImage.value?.id)
  }))
)
const showCreateFolder = ref(false)
const saveMenuOpenRequest = ref(0)
const centerImage = ref<ImageSpreadNode | undefined>()
const rootImage = ref<ImageSpreadNode | undefined>()
const relatedImages = ref<ImageSpreadNode[]>([])
const visitedImageIds = ref<string[]>([])
const spreadDepth = ref(0)
let syncedRouteImageId: string | undefined

const routeImageId = computed(() => {
  const rawImageId = route.params.imageId

  return Array.isArray(rawImageId) ? rawImageId[0] : rawImageId
})

function refreshRelatedImages(imageId: string) {
  const fn = spreadDepth.value === 0 ? getMediumGroupImages : getSubMediumGroupImages

  relatedImages.value = fn(imageId, {
    visitedImageIds: visitedImageIds.value
  })
}

function getRelatedImageLabel(image: ImageSpreadNode) {
  return localizeTaxon(spreadDepth.value === 0 ? image.medium : image.subMedium)
}

function loadImageSpread(imageId: string | undefined) {
  if (!imageId) {
    centerImage.value = undefined
    rootImage.value = undefined
    relatedImages.value = []
    visitedImageIds.value = []
    spreadDepth.value = 0
    return
  }

  const image = getImageById(imageId)
  const rawRootId = route.query.rootId
  const rootId = Array.isArray(rawRootId) ? rawRootId[0] : rawRootId

  if (image) {
    if (rootId && typeof rootId === 'string' && rootId !== imageId) {
      const rImage = getImageById(rootId)
      if (rImage && rImage.styleGroup === image.styleGroup) {
        rootImage.value = rImage
        centerImage.value = image
        spreadDepth.value = 1
        visitedImageIds.value = [rImage.id, image.id]
        refreshRelatedImages(image.id)
        return
      }
    }

    centerImage.value = image
    rootImage.value = image
    spreadDepth.value = 0
    visitedImageIds.value = [image.id]
    refreshRelatedImages(image.id)
  } else {
    centerImage.value = undefined
    rootImage.value = undefined
    relatedImages.value = []
    visitedImageIds.value = []
    spreadDepth.value = 0
  }
}

function syncSpreadRoute(imageId: string) {
  const currentRootId = spreadDepth.value === 1 ? rootImage.value?.id : undefined
  if (routeImageId.value === imageId && route.query.rootId === currentRootId) {
    return
  }

  syncedRouteImageId = imageId
  const query = currentRootId ? { rootId: currentRootId } : undefined

  void router
    .replace({
      name: 'image-spread',
      params: { imageId },
      query
    })
    .catch(() => {
      if (syncedRouteImageId === imageId) {
        syncedRouteImageId = undefined
      }
    })
}

function returnToPreviousLayer() {
  // 路徑階層：
  // 詳情頁 Back -> medium spread（?rootId=main）
  // medium Return -> main spread
  // main Return -> 首頁
  if (spreadDepth.value > 0 && rootImage.value) {
    centerImage.value = rootImage.value
    visitedImageIds.value = [rootImage.value.id]
    spreadDepth.value = 0
    refreshRelatedImages(rootImage.value.id)
    syncSpreadRoute(rootImage.value.id)
    return
  }

  router.push({ name: 'home' })
}

function handleRelatedSelect(image: ImageSpreadNode) {
  if (spreadDepth.value >= 1) {
    if (
      coreTour.state.value.status === 'active' &&
      coreTour.state.value.step === 'spread-related-image'
    ) {
      coreTour.advance('detail-thumbnail', image.id)
      coreTour.destroy()
    }

    void router.push({
      name: 'picture-detail',
      params: { imageId: image.id },
      query: {
        spreadImageId: centerImage.value?.id,
        spreadDetailImageId: image.id,
        spreadRootId: rootImage.value?.id
      }
    })
    return
  }

  if (
    coreTour.state.value.status === 'active' &&
    coreTour.state.value.step === 'spread-related-image'
  ) {
    coreTour.advance('spread-related-image', image.id)
    coreTour.destroy()
  }

  centerImage.value = image
  visitedImageIds.value = [...visitedImageIds.value, image.id]
  spreadDepth.value = 1
  refreshRelatedImages(image.id)
  syncSpreadRoute(image.id)
}

function handlePreviousSpreadTourStep(): void {
  const step = coreTour.state.value.step

  if (step === 'spread-related-image') {
    coreTour.advance('spread-related-group', coreTour.state.value.targetImageId)
    void showCurrentSpreadTourStep()
    return
  }

  if (step === 'spread-related-group') {
    coreTour.advance('home-image', coreTour.state.value.targetImageId)
    coreTour.destroy()
    void router.push({ name: 'home' })
  }
}

async function showCurrentSpreadTourStep() {
  const step = coreTour.state.value.step
  if (coreTour.state.value.status !== 'active') {
    return
  }

  if (step === 'detail-thumbnail' || step === 'detail-style-tag' || step === 'detail-save') {
    coreTour.destroy()
    return
  }

  if (step === 'home-image' || step === 'home-overview') {
    return
  }

  if (step !== 'spread-related-group' && step !== 'spread-related-image') {
    coreTour.pause()
    return
  }

  await coreTour.showStep(step, { onPrevious: handlePreviousSpreadTourStep })
}

function handleCreateFolder() {
  isCreateFolderSuccess.value = false
  showCreateFolder.value = true
}

async function handleSubmitFolder(name: string) {
  if (!centerImage.value) return
  const success = await createNewFolder(name, centerImage.value.id)
  if (success) showCreateFolder.value = false
}

async function handleSaveToFolder(folderId: string) {
  if (!centerImage.value) return
  await saveToMoodboard(folderId, centerImage.value.id)
}

watch(
  routeImageId,
  (imageId) => {
    if (imageId && syncedRouteImageId === imageId) {
      syncedRouteImageId = undefined
      return
    }

    loadImageSpread(imageId)
  },
  { immediate: true }
)

watch(
  [centerImage, relatedImages, () => coreTour.state.value.status, () => coreTour.state.value.step],
  () => {
    void showCurrentSpreadTourStep()
  },
  { immediate: true }
)

watch(
  [routeImageId, canSave],
  ([imageId, authenticated]) => {
    if (imageId && authenticated && consumePendingSaveMenu(imageId, Boolean(centerImage.value))) {
      saveMenuOpenRequest.value += 1
    }
  },
  { immediate: true }
)
</script>

<template>
  <ImageSpreadEntrance
    as="main"
    kind="page"
    class="relative min-h-screen overflow-x-hidden overflow-y-auto bg-void pt-[var(--app-header-height)] text-text-primary [--app-header-height:92px]"
  >
    <ImageSpreadEntrance
      kind="wash"
      class="pointer-events-none absolute inset-0 z-0 image-spread__wash"
      aria-hidden="true"
    />

    <!-- 桌面版整個空白背景返回上一層；圖片卡片與中央操作區位於更高層，不會觸發此按鈕。 -->
    <button
      v-if="centerImage"
      type="button"
      data-testid="spread-background-return"
      class="absolute inset-0 z-[1] hidden cursor-pointer bg-transparent transition-colors duration-200 hover:bg-white/[0.03] lg:block"
      :aria-label="$t('image.return')"
      @click="returnToPreviousLayer"
    />

    <section
      v-if="centerImage"
      class="pointer-events-none relative z-10 mx-auto flex min-h-[calc(100vh-var(--app-header-height))] w-full max-w-[1600px] flex-col items-center justify-center gap-8 px-6 pb-10 pt-6 lg:px-10 lg:pt-8"
    >
      <div class="relative z-10 flex w-full flex-1 items-center justify-center">
        <RelatedImageCluster
          class="hidden lg:block"
          :images="relatedImages"
          :get-image-label="getRelatedImageLabel"
          @select="handleRelatedSelect"
        />

        <ImageSpreadOverlay
          class="pointer-events-auto"
          :image="centerImage"
          :saved="isSaved"
          :disabled="isSaving"
          :can-save="canSave"
          :save-menu-open-request="saveMenuOpenRequest"
          :folders="folders"
          :just-saved-folder-id="justSavedFolderId"
          @auth-required="redirectGuestToLogin(centerImage.id)"
          @return="returnToPreviousLayer"
          @create-folder="handleCreateFolder"
          @save-to-folder="handleSaveToFolder"
        />
      </div>

      <div class="pointer-events-auto grid w-full max-w-3xl grid-cols-2 gap-3 lg:hidden">
        <ImageSpreadEntrance
          v-for="(image, index) in relatedImages"
          :key="image.id"
          as="button"
          kind="relatedCard"
          :spread-index="index"
          data-testid="related-image-card-mobile"
          :data-tour="index === 0 ? 'spread-related-image' : undefined"
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
          <ImageSpreadLabel
            v-if="getRelatedImageLabel(image)"
            data-tour-medium-label
          >
            {{ getRelatedImageLabel(image) }}
          </ImageSpreadLabel>
        </ImageSpreadEntrance>
      </div>
    </section>

    <section
      v-else
      class="relative z-10 mx-auto flex min-h-[calc(100vh-var(--app-header-height))] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">
        {{ $t('image.notFoundEyebrow') }}
      </p>
      <h1 class="text-3xl font-bold tracking-normal sm:text-5xl">
        {{ $t('image.notFoundTitle') }}
      </h1>
      <p class="text-sm leading-7 text-text-secondary sm:text-base">
        {{ $t('image.notFoundDesc') }}
      </p>
      <Button
        data-testid="return-home"
        type="button"
        variant="primary"
        @click="returnToPreviousLayer"
      >
        {{ $t('image.returnHome') }}
      </Button>
    </section>
  </ImageSpreadEntrance>
  <CreateNewFolder
    v-model="showCreateFolder"
    :is-submitting="isCreatingFolder"
    :is-success="isCreateFolderSuccess"
    @submit="handleSubmitFolder"
  />
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
