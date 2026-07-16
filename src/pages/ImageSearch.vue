<script setup lang="ts">
import { computed, ref } from 'vue';
import { useClipModel } from '@/composables/useClipModel';
import { useImageSearch } from '@/composables/useImageSearch';
import Button from '@/components/ui/Button.vue';

const model = useClipModel();
const search = useImageSearch(model.computeEmbedding);

const selectedFile = ref<File | null>(null);

const isModelReady = computed(() => model.status.value === 'ready');

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
  <main class="mx-auto max-w-3xl px-6 py-10 text-text-primary">
    <h1 class="text-2xl font-bold">以圖搜圖</h1>

    <section v-if="!isModelReady" data-testid="model-gate" class="mt-6 space-y-4">
      <p v-if="model.status.value === 'idle'" class="text-sm text-text-secondary">
        首次使用需下載約 150MB 的 AI 模型，建議 Wi-Fi 環境下使用。
      </p>
      <p v-else-if="model.status.value === 'loading'" data-testid="model-progress" class="text-sm">
        下載中… {{ model.progress.value }}%
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

    <section v-else data-testid="search-panel" class="mt-6 space-y-4">
      <input
        data-testid="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="handleFileChange"
      />
      <Button
        data-testid="search-button"
        type="button"
        :disabled="!selectedFile || search.status.value === 'searching'"
        @click="handleSearch"
      >
        {{ search.status.value === 'searching' ? '搜尋中…' : '開始搜尋' }}
      </Button>

      <p v-if="search.status.value === 'error'" data-testid="search-error" class="text-red-400">
        {{ search.error.value }}
      </p>
      <p v-else-if="search.status.value === 'no-match'" data-testid="search-no-match">
        找不到相似的圖，換一張試試？
      </p>

      <div
        v-if="search.status.value === 'success'"
        data-testid="search-results"
        class="grid grid-cols-2 gap-3"
      >
        <RouterLink
          v-for="result in search.results.value"
          :key="result.id"
          :to="{ name: 'picture-detail', params: { imageId: result.id } }"
          data-testid="search-result-card"
        >
          <img
            :src="result.src"
            :alt="result.alt"
            loading="lazy"
            class="aspect-[4/5] w-full rounded-lg object-cover"
          />
        </RouterLink>
      </div>
    </section>
  </main>
</template>
