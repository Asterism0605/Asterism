import { i18n } from '@/i18n';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

export function validateImageFile(file: File): string | null {
  if (!IMAGE_SEARCH_CONFIG.allowedFileTypes.includes(file.type)) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  if (file.size > IMAGE_SEARCH_CONFIG.maxFileSizeBytes) {
    return i18n.global.t('imageSearch.fileTooLarge');
  }

  if (file.size === 0) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  return null;
}

// top-1 相似度低於 reject 門檻 → 圖庫裡沒有夠像的圖。
export function isRejected(top1Similarity: number): boolean {
  return top1Similarity < IMAGE_SEARCH_CONFIG.retrievalRejectThreshold;
}

// top-1 過 reject 門檻但低於 weak 門檻 → 相似度中等，UI 顯示提示但照樣給結果。
export function isWeakMatch(top1Similarity: number): boolean {
  return top1Similarity < IMAGE_SEARCH_CONFIG.weakMatchThreshold;
}
