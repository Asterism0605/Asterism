<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useClipModel } from '@/composables/useClipModel';
import { useImageSearch } from '@/composables/useImageSearch';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ImageSpreadEntrance from '@/components/effects/ImageSpreadEntrance.vue';
import RelatedImageCluster from '@/components/feature/image/RelatedImageCluster.vue';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';
import type { ImageSearchResult } from '@/types/imageSearch';
import type { ImageSpreadNode } from '@/types/image';

const router = useRouter();
const model = useClipModel();
const search = useImageSearch(model.computeEmbedding);

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

const isModelReady = computed(() => model.status.value === 'ready');
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

function handleResultSelect(node: ImageSpreadNode) {
  void router.push({ name: 'picture-detail', params: { imageId: node.id } });
}

watch(selectedFile, (file) => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = file ? URL.createObjectURL(file) : null;
});

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
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

      <section v-if="!isModelReady" data-testid="model-gate" class="mt-6 space-y-4">
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
      </section>

      <section v-else data-testid="search-panel" class="mt-6">
        <div class="flex flex-wrap items-center gap-3">
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
             手機退回 2x2 網格（跟探索頁的響應式策略一致）。 -->
        <div v-if="previewUrl" class="relative mt-10 flex min-h-[420px] w-full flex-col items-center gap-8">
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
              :to="{ name: 'picture-detail', params: { imageId: result.id } }"
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
</style>
