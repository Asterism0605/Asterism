import { ref, type Ref } from 'vue';
import { i18n } from '@/i18n';
import { classifyStyleGroup } from '@/services/styleGroupClassifier.service';
import { meetsSimilarityThreshold, validateImageFile } from '@/services/imageSearch.service';
import { searchImagesByEmbedding } from '@/api/imageSearch.api';
import type { ImageSearchResult } from '@/types/imageSearch';
import type { ClassificationAnchor } from '@/api/classificationAnchors.api';

export type ImageSearchStatus = 'idle' | 'searching' | 'success' | 'no-match' | 'error';

// 狀態拉到 module 層級，理由同 useClipModel：使用者從搜尋結果點進詳情頁再按返回時，
// ImageSearch 頁面會被卸載又重新掛載，若搜尋結果放在 composable 內部會被清空，
// 使用者會看到自己剛剛上傳的圖片和搜尋結果憑空消失。
const status = ref<ImageSearchStatus>('idle');
const results = ref<ImageSearchResult[]>([]);
const error = ref<string | null>(null);

export function useImageSearch(
  computeEmbedding: (file: File) => Promise<number[]>,
  anchors: Ref<ClassificationAnchor[]>
) {
  async function search(file: File) {
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
      const embedding = await computeEmbedding(file);
      const styleGroup = classifyStyleGroup(embedding, anchors.value);
      const matches = await searchImagesByEmbedding(embedding, styleGroup);
      const filtered = matches.filter((match) => meetsSimilarityThreshold(match.similarity));

      if (filtered.length === 0) {
        status.value = 'no-match';
        return;
      }

      results.value = filtered;
      status.value = 'success';
    } catch {
      status.value = 'error';
      error.value = i18n.global.t('imageSearch.searchFailed');
    }
  }

  return { status, results, error, search };
}

// 測試用：重置 module 層級狀態，避免測試之間互相汙染。
export function resetImageSearchState(): void {
  status.value = 'idle';
  results.value = [];
  error.value = null;
}
