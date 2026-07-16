<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClipModel } from '@/composables/useClipModel';
import { useImageSearch } from '@/composables/useImageSearch';
import { useClassificationAnchors } from '@/composables/useClassificationAnchors';
import { useUploadedImagePreview } from '@/composables/useUploadedImagePreview';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import type { ImageSearchResult } from '@/types/imageSearch';
import type { ImageSpreadNode } from '@/types/image';

const router = useRouter();
const model = useClipModel();
const anchorsState = useClassificationAnchors('styleGroup');
const search = useImageSearch(model.computeEmbedding, anchorsState.anchors);

// 錨點資料只是 9 筆小查詢，不像 CLIP model 要下載 150MB，不需要另外跳確認，
// 進頁就在背景默默載入即可。
// CLIP model 如果這台裝置先前已經下載過（瀏覽器 Cache Storage 裡還在），就不用
// 再讓使用者手動點一次「下載模型」——直接背景載入，pipeline() 會自己從快取讀取。
onMounted(() => {
  void anchorsState.load();
  if (model.hasDownloadedBefore()) {
    void model.load();
  }
});

const { selectedFile, previewUrl, setFile } = useUploadedImagePreview();

const isModelReady = computed(() => model.status.value === 'ready');
const isFullyReady = computed(() => isModelReady.value && anchorsState.status.value === 'ready');
// model.progress 到 100 只代表「檔案下載完」，pipeline() 之後還要花時間初始化
// （建立 ONNX runtime session 等），這段沒有位元組進度可回報，UI 會卡在 100% 好幾秒。
// 用這個旗標切到「準備中」文案 + spinner，至少讓使用者知道還在動，不是卡住了。
const isFinalizingModel = computed(
  () => model.status.value === 'loading' && model.progress.value >= 100
);
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

const similarityById = computed(() => {
  const map = new Map<string, number>();
  for (const result of search.results.value) {
    map.set(result.id, result.similarity);
  }
  return map;
});

function getResultLabel(node: ImageSpreadNode): string | undefined {
  const similarity = similarityById.value.get(node.id);
  return similarity === undefined ? undefined : `${Math.round(similarity * 100)}% 相似`;
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
  <main class="relative min-h-[calc(100vh-var(--app-header-height))] overflow-x-hidden bg-void pt-[var(--app-header-height)] text-text-primary [--app-header-height:60px]">
    <ImageSpreadEntrance
      kind="wash"
      class="pointer-events-none absolute inset-0 z-0 image-search__wash"
      aria-hidden="true"
    />

    <div class="relative z-10 mx-auto max-w-3xl px-6 py-10">
      <h1 class="text-2xl font-bold">以圖搜圖</h1>
      <p class="mt-2 text-sm text-text-secondary">上傳一張圖片，找出圖庫裡風格最相似的作品。</p>

      <section v-if="!isFullyReady" data-testid="model-gate" class="mt-6 space-y-4">
        <p v-if="model.status.value === 'idle'" class="text-sm text-text-secondary">
          首次使用需下載約 150MB 的 AI 模型，建議 Wi-Fi 環境下使用。
        </p>
        <p
          v-else-if="model.status.value === 'loading' && !isFinalizingModel"
          data-testid="model-progress"
          class="flex items-center gap-2 text-sm"
        >
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          下載中… {{ model.progress.value }}%
        </p>
        <p
          v-else-if="isFinalizingModel"
          data-testid="model-finalizing"
          class="flex items-center gap-2 text-sm"
        >
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          準備中，快好了…
        </p>
        <p v-else-if="model.status.value === 'error'" data-testid="model-error" class="text-sm text-red-400">
          {{ model.error.value }}
        </p>

        <Button
          v-if="model.status.value === 'idle' || model.status.value === 'error'"
          data-testid="download-model-button"
          type="button"
          @click="model.load()"
        >
          {{ model.status.value === 'error' ? '重試下載' : '下載模型' }}
        </Button>

        <p
          v-if="isModelReady && anchorsState.status.value === 'loading'"
          data-testid="anchors-loading"
          class="flex items-center gap-2 text-sm"
        >
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
          載入風格資料中…
        </p>
        <template v-else-if="isModelReady && anchorsState.status.value === 'error'">
          <p data-testid="anchors-error" class="text-sm text-red-400">
            {{ anchorsState.error.value }}
          </p>
          <Button data-testid="retry-anchors-button" type="button" @click="anchorsState.load()">
            重試
          </Button>
        </template>
      </section>
    </div>

    <!-- search-panel 不跟著上面標題區用窄版 max-w-3xl：底下的探索頁式發散版面需要
         接近探索頁本身的寬版面（max-w-[1600px]）才不會擠在一起重疊，上傳控制項
         自己用內層的窄版寬度即可。 -->
    <section v-if="isFullyReady" data-testid="search-panel" class="relative z-10 mt-6">
      <div class="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-6">
        <input
          data-testid="image-file-input"
          type="file"
          :accept="acceptedFileTypes"
          @change="handleFileChange"
        />
        <Button
          data-testid="search-button"
          type="button"
          :disabled="!selectedFile || search.status.value === 'searching'"
          @click="handleSearch"
        >
          <span
            v-if="search.status.value === 'searching'"
            data-testid="search-spinner"
            class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white align-[-2px]"
            aria-hidden="true"
          />
          {{ search.status.value === 'searching' ? '搜尋中…' : '開始搜尋' }}
        </Button>
      </div>

      <!-- 探索頁式版面：中心是使用者上傳的圖，四張衛星卡片是搜尋結果，桌機用浮動群集、
           手機退回 2x2 網格（跟探索頁的響應式策略一致）。
           高度刻意跟探索頁的 section 一樣用滿版視窗高（不是固定 420px）：
           RelatedImageCluster 的四張卡片是用 top-X%/bottom-X% 這種相對容器「高度」
           的百分比定位，容器不夠高的話同一側的兩張卡片百分比差距換算成實際像素會太
           小，擠在一起重疊——這正是之前只加寬、沒加高，重疊問題還在的原因。 -->
      <div
        v-if="previewUrl"
        class="relative mx-auto mt-10 flex min-h-[calc(100vh-var(--app-header-height))] w-full max-w-[1600px] flex-col items-center gap-8 px-6"
      >
        <div class="relative z-10 flex w-full flex-1 items-center justify-center">
          <RelatedImageCluster
            v-if="search.status.value === 'success'"
            class="hidden lg:block"
            :images="search.results.value.map(toSpreadNode)"
            :get-image-label="getResultLabel"
            @select="handleResultSelect"
          />

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
              data-testid="search-preview-frame"
              class="relative w-full max-w-[min(72vw,360px)] overflow-hidden rounded-lg border border-white/12 bg-elevated/60 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            >
              <img
                data-testid="search-preview-image"
                :src="previewUrl"
                alt="你上傳的圖片"
                class="aspect-[4/5] w-full object-cover"
              />
            </ImageSpreadEntrance>
          </div>
        </div>

        <p v-if="search.status.value === 'error'" data-testid="search-error" class="text-red-400">
          {{ search.error.value }}
        </p>
        <p v-else-if="search.status.value === 'no-match'" data-testid="search-no-match">
          找不到相似的圖，換一張試試？
        </p>

        <div
          v-if="search.status.value === 'success'"
          data-testid="search-results"
          class="grid w-full max-w-3xl grid-cols-2 gap-3 lg:hidden"
        >
          <RouterLink
            v-for="result in search.results.value"
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
    </section>
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
</style>
