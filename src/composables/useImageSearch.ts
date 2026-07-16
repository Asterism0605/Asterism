import { ref, type Ref } from 'vue';
import { classifyStyleGroup } from '@/services/styleGroupClassifier.service';
import { meetsSimilarityThreshold, validateImageFile } from '@/services/imageSearch.service';
import { searchImagesByEmbedding } from '@/api/imageSearch.api';
import type { ImageSearchResult } from '@/types/imageSearch';
import type { ClassificationAnchor } from '@/api/classificationAnchors.api';

export type ImageSearchStatus = 'idle' | 'searching' | 'success' | 'no-match' | 'error';

export function useImageSearch(
  computeEmbedding: (file: File) => Promise<number[]>,
  anchors: Ref<ClassificationAnchor[]>
) {
  const status = ref<ImageSearchStatus>('idle');
  const results = ref<ImageSearchResult[]>([]);
  const error = ref<string | null>(null);

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
      error.value = '搜尋失敗，請稍後再試。';
    }
  }

  return { status, results, error, search };
}
