import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { classifyStyleGroup } from '@/services/styleGroupClassifier.service';
import { meetsSimilarityThreshold, validateImageFile } from '@/services/imageSearch.service';
import { searchImagesByEmbedding } from '@/api/imageSearch.api';
import { useClipModelStore } from '@/stores/clipModel.store';
import { useClassificationAnchorsStore } from '@/stores/classificationAnchors.store';
import type { ImageSearchResult } from '@/types/imageSearch';

export type ImageSearchStatus = 'idle' | 'searching' | 'success' | 'no-match' | 'error';

// Pinia store，理由同 clipModel.store：使用者從搜尋結果點進詳情頁再按返回時，
// ImageSearch 頁面會被卸載又重新掛載，若搜尋結果放在元件內部會被清空，使用者會看到
// 自己剛剛上傳的圖片和搜尋結果憑空消失。
export const useImageSearchStore = defineStore('image-search', () => {
  const status = ref<ImageSearchStatus>('idle');
  const results = ref<ImageSearchResult[]>([]);
  const error = ref<string | null>(null);

  async function search(file: File) {
    if (status.value === 'searching') return;

    const validationError = validateImageFile(file);
    if (validationError) {
      status.value = 'error';
      error.value = validationError;
      return;
    }

    status.value = 'searching';
    error.value = null;
    results.value = [];

    try {
      const clipModelStore = useClipModelStore();
      const anchorsStore = useClassificationAnchorsStore();
      const embedding = await clipModelStore.computeEmbedding(file);
      const styleGroup = classifyStyleGroup(embedding, anchorsStore.anchors);
      const matches = await searchImagesByEmbedding(embedding, styleGroup);
      const filtered = matches.filter((match) => meetsSimilarityThreshold(match.similarity));

      if (filtered.length === 0) {
        status.value = 'no-match';
        return;
      }

      results.value = filtered;
      status.value = 'success';
    } catch (e) {
      console.warn('[imageSearch] search failed:', e);
      status.value = 'error';
      error.value = i18n.global.t('imageSearch.searchFailed');
    }
  }

  return { status, results, error, search };
});
