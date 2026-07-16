<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ImageUp, ScanSearch } from '@lucide/vue';
import { useClipModelStore } from '@/stores/clipModel.store';
import { useImageSearchStore } from '@/stores/imageSearch.store';
import { useUploadedImagePreviewStore } from '@/stores/uploadedImagePreview.store';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import type { ImageSearchResult } from '@/types/imageSearch';
import type { ImageSpreadNode } from '@/types/image';

const router = useRouter();
const model = useClipModelStore();
const search = useImageSearchStore();
const uploadedImagePreview = useUploadedImagePreviewStore();
const { selectedFile, previewUrl } = storeToRefs(uploadedImagePreview);
const { setFile } = uploadedImagePreview;

// CLIP model 如果這台裝置先前已經下載過（瀏覽器 Cache Storage 裡還在），就不用
// 再讓使用者手動點一次「下載模型」——直接背景載入，pipeline() 會自己從快取讀取。
onMounted(() => {
  if (model.hasDownloadedBefore()) {
    void model.load();
  }
});

// 純檢索不再需要 styleGroup 錨點分類，model 就緒即可搜尋。
const isModelReady = computed(() => model.status === 'ready');
const isFullyReady = computed(() => isModelReady.value);
// model.progress 到 100 只代表「檔案下載完」，pipeline() 之後還要花時間初始化
// （建立 ONNX runtime session 等），這段沒有位元組進度可回報，UI 會卡在 100% 好幾秒。
// 用這個旗標切到「準備中」文案 + spinner，至少讓使用者知道還在動，不是卡住了。
const isFinalizingModel = computed(() => model.status === 'loading' && model.progress >= 100);
const acceptedFileTypes = IMAGE_SEARCH_CONFIG.allowedFileTypes.join(',');

// 探索頁（ImageSpread）的中心卡片是給「已經在圖庫裡的圖」用的，帶著存收藏/返回上一層那些
// 動作，對「使用者剛上傳、還沒進圖庫的照片」沒有意義，所以中心卡片這裡自己刻，只借視覺
// （ConstellationBackground + 卡片邊框陰影），不重用 ImageSpreadOverlay。
// 四張衛星結果圖則直接重用 RelatedImageCluster——它內部其實只用得到 id/src/alt，
// 用 toSpreadNode() 把搜尋結果的欄位補成它宣告的 ImageSpreadNode 形狀即可，不用改動
// 這個既有元件（避免牽動探索頁本身已經測過、上線的行為）。
function toSpreadNode(result: ImageSearchResult): ImageSpreadNode {
  return {
    id: result.id,
    src: result.src,
    alt: result.alt,
    title: result.alt,
    styleGroup: result.styleGroup,
    style: [],
    colorPalette: []
  };
}

// 帶 from=image-search，讓 PictureDetail 的返回鍵知道要導回這頁，不是探索頁。
function handleResultSelect(node: ImageSpreadNode) {
  void router.push({
    name: 'picture-detail',
    params: { imageId: node.id },
    query: { from: 'image-search' }
  });
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  setFile(input.files?.[0] ?? null);
}

function handleSearch() {
  if (!selectedFile.value) return;
  void search.search(selectedFile.value);
}
</script>

<template>
  <main class="relative min-h-[calc(100vh-var(--app-header-height))] overflow-x-hidden bg-void pt-[var(--app-header-height)] text-text-primary [--app-header-height:69px] lg:h-[calc(100vh-var(--app-header-height))] lg:overflow-hidden">
    <ImageSpreadEntrance
      kind="wash"
      class="pointer-events-none absolute inset-0 z-0 image-search__wash"
      aria-hidden="true"
    />

    <!-- lg 以上改左右分欄：左邊放標題／控制項，右邊放搜尋結果的探索頁式版面。
         這樣選完圖按搜尋後，結果會跟控制項同時出現在第一屏，不用再往下滑——
         結果版面本身需要的高度（見下方 RelatedImageCluster 註解）留給右欄用滿高度處理。
         小螢幕維持原本上下堆疊，直向捲動在手機上本來就是常態，不特別處理。 -->
    <div class="relative z-10 flex h-full flex-col lg:flex-row lg:items-stretch">
      <div class="w-full shrink-0 px-6 py-10 md:py-14 lg:flex lg:h-full lg:w-[420px] lg:flex-col lg:justify-center lg:overflow-hidden lg:pt-16 lg:pb-10 lg:pl-16 lg:pr-6">
        <ImageSpreadEntrance kind="page">
          <p class="image-search-hero__eyebrow">{{ $t('imageSearch.eyebrow') }}</p>
          <h1 class="image-search-hero__title">
            <ScanSearch class="image-search-hero__title-icon" aria-hidden="true" />
            {{ $t('imageSearch.title') }}
          </h1>
          <p class="image-search-hero__subtitle">{{ $t('imageSearch.subtitle') }}</p>
        </ImageSpreadEntrance>

        <ImageSpreadEntrance
          v-if="!isFullyReady"
          :delay="140"
          as="section"
          data-testid="model-gate"
          class="image-search-panel mt-8"
        >
          <p v-if="model.status === 'idle'" class="text-sm text-text-secondary">
            {{ $t('imageSearch.downloadHint') }}
          </p>
          <div v-else-if="model.status === 'loading' && !isFinalizingModel" class="space-y-2">
            <p data-testid="model-progress" class="flex items-center justify-between text-sm">
              <span>{{ $t('imageSearch.downloading', { progress: model.progress }) }}</span>
            </p>
            <div class="image-search-progress">
              <div class="image-search-progress__fill" :style="{ width: model.progress + '%' }" />
            </div>
          </div>
          <p
            v-else-if="isFinalizingModel"
            data-testid="model-finalizing"
            class="flex items-center gap-2 text-sm"
          >
            <span
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
            {{ $t('imageSearch.finalizing') }}
          </p>
          <p v-else-if="model.status === 'error'" data-testid="model-error" class="text-sm text-red-400">
            {{ model.error }}
          </p>

          <Button
            v-if="model.status === 'idle' || model.status === 'error'"
            data-testid="download-model-button"
            type="button"
            class="mt-4"
            @click="model.load()"
          >
            {{ model.status === 'error' ? $t('imageSearch.retryDownload') : $t('imageSearch.downloadModel') }}
          </Button>

        </ImageSpreadEntrance>

        <ImageSpreadEntrance
          v-if="isFullyReady"
          kind="page"
          as="div"
          data-testid="search-panel"
          class="mt-8 flex flex-wrap items-center gap-4"
        >
          <label
            for="image-file-input"
            class="image-search-dropzone"
            :class="{ 'image-search-dropzone--filled': selectedFile }"
          >
            <ImageUp class="image-search-dropzone__icon" aria-hidden="true" />
            <span class="image-search-dropzone__text">
              <strong>{{ selectedFile ? selectedFile.name : $t('imageSearch.chooseFile') }}</strong>
              <small v-if="!selectedFile">{{ $t('imageSearch.chooseFileHint') }}</small>
            </span>
          </label>
          <input
            id="image-file-input"
            data-testid="image-file-input"
            type="file"
            class="sr-only"
            :accept="acceptedFileTypes"
            @change="handleFileChange"
          />
          <Button
            data-testid="search-button"
            type="button"
            :disabled="!selectedFile || search.status === 'searching'"
            @click="handleSearch"
          >
            <span
              v-if="search.status === 'searching'"
              data-testid="search-spinner"
              class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white align-[-2px]"
              aria-hidden="true"
            />
            {{ search.status === 'searching' ? $t('imageSearch.searching') : $t('imageSearch.search') }}
          </Button>
        </ImageSpreadEntrance>
      </div>

      <!-- 探索頁式版面：中心是使用者上傳的圖，四張衛星卡片是搜尋結果。
           右欄刻意用滿高度（lg:h-full，父層已是 lg:h-[100vh-header]）：
           RelatedImageCluster 的四張卡片是用 top-X%/bottom-X% 這種相對容器「高度」
           的百分比定位，容器不夠高的話同一側的兩張卡片百分比差距換算成實際像素會太
           小，擠在一起重疊——這正是之前只加寬、沒加高，重疊問題還在的原因。
           浮動群集斷點跟探索頁一樣用 lg（≥1024px），視覺上盡量比照探索頁的間距/展開
           程度。RelatedImageCluster 的卡片寬度是用 vw 算的，假設 host 接近整個視窗寬——
           這頁左邊固定占了側欄，host 比探索頁窄，窄寬度（~1024-1366px）時卡片跟中間
           預覽圖的邊角會有一點點交疊；這裡靠預覽圖那層的 z-20（比卡片群的 z-10 高）
           保底，交疊時一律是預覽圖蓋在卡片上面，不會反過來蓋住預覽圖，實際看起來
           像故意的堆疊效果，不是版面錯位。 -->
      <div v-if="isFullyReady && previewUrl" class="relative flex-1 lg:h-full">
        <div class="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col items-center justify-center gap-6 px-6 pb-10 lg:pb-6">
          <div class="relative z-10 flex w-full flex-1 items-center justify-center">
            <RelatedImageCluster
              v-if="search.status === 'success'"
              class="hidden lg:block"
              :images="search.results.map(toSpreadNode)"
              @select="handleResultSelect"
            />

            <div class="relative z-20 flex w-full justify-center">
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
                data-testid="search-preview-frame"
                class="image-search-preview-frame relative w-full max-w-[min(72vw,360px)] overflow-hidden rounded-lg border border-white/12 bg-elevated/60"
              >
                <img
                  data-testid="search-preview-image"
                  :src="previewUrl"
                  :alt="$t('imageSearch.uploadedAlt')"
                  class="aspect-[4/5] w-full object-cover"
                />
                <figcaption class="image-search-preview-frame__caption">
                  {{ $t('imageSearch.yourPhoto') }}
                </figcaption>
              </ImageSpreadEntrance>
            </div>
          </div>

          <p
            v-if="search.status === 'error'"
            data-testid="search-error"
            class="image-search-status image-search-status--error"
          >
            {{ search.error }}
          </p>
          <p v-else-if="search.status === 'no-match'" data-testid="search-no-match" class="image-search-status">
            {{ $t('imageSearch.noMatch') }}
          </p>
          <p
            v-else-if="search.status === 'success' && search.weakMatch"
            data-testid="search-weak-match"
            class="image-search-status"
          >
            {{ $t('imageSearch.weakMatchNotice') }}
          </p>

          <div
            v-if="search.status === 'success'"
            data-testid="search-results"
            class="grid w-full max-w-3xl grid-cols-2 gap-3 lg:hidden"
          >
            <RouterLink
              v-for="result in search.results"
              :key="result.id"
              :to="{ name: 'picture-detail', params: { imageId: result.id }, query: { from: 'image-search' } }"
              data-testid="search-result-card-mobile"
              class="overflow-hidden rounded-lg border border-white/12 bg-elevated/70"
            >
              <img
                :src="result.src"
                :alt="result.alt"
                loading="lazy"
                class="aspect-[4/5] w-full object-cover"
              />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.image-search__wash {
  background:
    radial-gradient(circle at 50% 42%, rgb(168 137 58 / 0.13), transparent 30%),
    radial-gradient(circle at 18% 24%, rgb(240 237 230 / 0.06), transparent 24%),
    radial-gradient(circle at 82% 72%, rgb(216 91 55 / 0.09), transparent 22%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 56%, var(--color-void) 100%);
}

.image-search-hero__eyebrow {
  margin-bottom: 10px;
  color: var(--color-gold-dim);
  font-family: var(--font-family-mono);
  font-size: var(--text-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.image-search-hero__title {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: clamp(2.25rem, 5.5vw, 4rem);
  font-weight: 200;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.image-search-hero__title-icon {
  width: 0.72em;
  height: 0.72em;
  flex-shrink: 0;
  color: var(--color-stellar-red);
  filter: drop-shadow(0 0 18px rgb(196 92 58 / 0.45));
}

.image-search-hero__subtitle {
  margin-top: 14px;
  max-width: 480px;
  color: #f0ede6c2;
  font-size: 14px;
  line-height: 1.6;
}

.image-search-panel {
  max-width: 560px;
  padding: 28px 32px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 20px;
  background: linear-gradient(160deg, rgb(255 255 255 / 0.05), rgb(255 255 255 / 0.015));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.3);
}

.image-search-progress {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.image-search-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-gold-dim), var(--color-stellar-red));
  transition: width 280ms ease;
}

.image-search-dropzone {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
  padding: 12px 20px;
  border: 1.5px dashed rgb(255 255 255 / 0.22);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.03);
  cursor: pointer;
  transition:
    border-color 200ms ease,
    background 200ms ease,
    box-shadow 200ms ease;
}

.image-search-dropzone:hover {
  border-color: rgb(168 137 58 / 0.55);
  background: rgb(168 137 58 / 0.08);
  box-shadow: 0 0 0 1px rgb(168 137 58 / 0.15);
}

.image-search-dropzone--filled {
  border-style: solid;
  border-color: rgb(168 137 58 / 0.4);
  background: rgb(255 255 255 / 0.05);
}

.image-search-dropzone__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-gold-dim);
}

.image-search-dropzone__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  text-align: left;
}

.image-search-dropzone__text strong {
  overflow: hidden;
  max-width: 220px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.image-search-dropzone__text small {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.image-search-preview-frame {
  box-shadow:
    0 30px 90px rgb(0 0 0 / 0.45),
    0 0 60px rgb(196 92 58 / 0.15);
}

.image-search-preview-frame__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20px 14px 10px;
  background: linear-gradient(180deg, transparent, rgb(6 6 8 / 0.75));
  color: rgb(240 237 230 / 0.75);
  font-family: var(--font-family-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
}

.image-search-status {
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.image-search-status--error {
  border-color: rgb(248 113 113 / 0.35);
  background: rgb(248 113 113 / 0.08);
  color: #f87171;
}

@media (max-width: 640px) {
  .image-search-panel {
    padding: 22px 20px;
  }

  .image-search-dropzone {
    min-width: 0;
  }

  .image-search-dropzone__text strong {
    max-width: 46vw;
  }
}
</style>
