import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { isRejected, isWeakMatch, validateImageFile } from '@/services/imageSearch.service';
import { searchSimilarImages } from '@/api/imageSearch.api';
import { useClipModelStore } from '@/stores/clipModel.store';
import type { ImageSearchResult } from '@/types/imageSearch';

export type ImageSearchStatus = 'idle' | 'searching' | 'success' | 'no-match' | 'error';

// Pinia store，理由同 clipModel.store：使用者從搜尋結果點進詳情頁再按返回時，
// ImageSearch 頁面會被卸載又重新掛載，搜尋結果不該憑空消失。
export const useImageSearchStore = defineStore('image-search', () => {
  const status = ref<ImageSearchStatus>('idle');
  const results = ref<ImageSearchResult[]>([]);
  const error = ref<string | null>(null);
  // top-1 過 reject 門檻但分數普通 → UI 顯示「相似度中等」提示，誠實管理期望。
  const weakMatch = ref(false);

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
    weakMatch.value = false;

    try {
      const clipModelStore = useClipModelStore();
      const embedding = await clipModelStore.computeEmbedding(file);

      // 全庫 kNN：不先分類 styleGroup。open-set 拒絕靠 top-1 相似度——
      // 「圖庫裡沒有夠像的圖」，這個判斷會隨圖庫成長自動變準。
      const matches = await searchSimilarImages(embedding);

      if (matches.length === 0 || isRejected(matches[0].similarity)) {
        status.value = 'no-match';
        return;
      }

      weakMatch.value = isWeakMatch(matches[0].similarity);
      results.value = matches;
      status.value = 'success';
    } catch (e) {
      console.warn('[imageSearch] search failed:', e);
      status.value = 'error';
      error.value = i18n.global.t('imageSearch.searchFailed');
    }
  }

  return { status, results, error, weakMatch, search };
});
